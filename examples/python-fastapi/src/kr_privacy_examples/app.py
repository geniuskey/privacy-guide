"""10개 주제를 하나로 묶은 FastAPI 앱.

실행: uv run uvicorn kr_privacy_examples.app:app --reload  (uvicorn 은 별도 설치)
모든 저장소는 인메모리이며, 데모 계정은 seed_demo_data() 에서 만든다.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import timedelta
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .admin_separation import AdminService, BreakGlassService, PiiAccessService, PiiGrantRegistry
from .audit_log import AuditLog
from .data_subject_rights import DataSubjectRightsService
from .domain import Clock, NotFoundError, Order, OrderRepository, PermissionDeniedError, UserRecord, UserStore, utc_now
from .llm_filter import LLMClient, RecordingLLMClient, SafeLLMGateway
from .log_masking import install_masking
from .minimal_response import AdminUserView, MyProfile, OrderOut, PiiView, UserSummary, to_my_profile, to_order_out, to_user_summary
from .ownership import get_order_for, list_orders_for
from .rbac import Permission, Principal, Role, get_principal, require_permission
from .retention import PurgeJob, RecordStore, RetentionPolicy, RetentionService, SeparatedStore, StoredRecord
from .session_security import (
    COOKIE_NAME, PasswordHasher, SessionManager, authenticate, clear_session_cookie, set_session_cookie,
)

logger = logging.getLogger("kr_privacy_examples")


@dataclass
class Container:
    clock: Clock
    hasher: PasswordHasher
    llm_client: LLMClient
    audit: AuditLog = field(init=False)
    users: UserStore = field(default_factory=UserStore)
    orders: OrderRepository = field(default_factory=OrderRepository)
    tickets: dict[str, dict[str, Any]] = field(default_factory=dict)

    def __post_init__(self) -> None:
        self.audit = AuditLog(self.clock)
        self.sessions = SessionManager(self.clock)
        self.pii_grants = PiiGrantRegistry(self.audit)
        self.admin = AdminService(self.users, self.audit)
        self.break_glass = BreakGlassService(self.audit, self.clock)
        self.pii = PiiAccessService(self.users, self.break_glass, self.audit)
        self.retention = RetentionService(RecordStore(), SeparatedStore(), RetentionPolicy(), self.audit, self.clock)
        self.purge_job = PurgeJob(self.retention, self.clock)
        self.dsr = DataSubjectRightsService(self.users, self.orders, self.retention, self.audit, self.clock,
                                            on_account_deleted=self.sessions.revoke_all)
        self.llm = SafeLLMGateway(self.llm_client, self.audit)


DEMO_PASSWORD = "correct horse battery staple"


def seed_demo_data(c: Container) -> None:
    now = c.clock()
    pw = c.hasher.hash(DEMO_PASSWORD)
    people = [
        ("u-alice", "alice@example.com", "김앨리스", "010-1111-2222", {Role.CUSTOMER}),
        ("u-bob", "bob@example.com", "이밥", "010-3333-4444", {Role.CUSTOMER}),
        ("u-admin", "admin@example.com", "박관리", "010-5555-6666", {Role.SYSTEM_ADMIN}),
        ("u-officer", "officer@example.com", "최보호", "010-7777-8888", {Role.PRIVACY_OFFICER}),
        ("u-support", "support@example.com", "정상담", "010-9999-0000", {Role.SUPPORT}),
    ]
    for uid, email, name, phone, roles in people:
        c.users.add(UserRecord(uid, email, name, phone, pw, set(roles), now,
                               resident_number="900101-1234567", internal_memo="VIP 후보"))
    c.orders.add(Order("o-1", "u-alice", "키보드", 59000, "서울시 강남구 테헤란로 1", now))
    c.orders.add(Order("o-2", "u-bob", "마우스", 29000, "부산시 해운대구 1", now))
    c.retention.active.add(StoredRecord("r-chat-1", "support_chat", "u-alice", {"text": "배송 문의"}, now))
    c.retention.active.add(StoredRecord("r-pay-1", "payment_record", "u-alice", {"amount": 59000}, now))
    c.retention.active.add(StoredRecord("r-mkt-1", "marketing_profile", "u-alice", {"segment": "gadget"}, now))
    c.tickets["t-1"] = {
        "id": "t-1", "user_id": "u-alice", "category": "배송", "product": "키보드",
        "message": "배송이 늦어요. 연락은 010-1111-2222 또는 alice@example.com 으로 주세요.",
        "customer_name": "김앨리스", "customer_address": "서울시 강남구 테헤란로 1",
        "internal_notes": "블랙컨슈머 의심",
    }


class LoginIn(BaseModel):
    email: str
    password: str = Field(min_length=1, max_length=256)


class BreakGlassIn(BaseModel):
    subject_id: str
    reason: str
    minutes: int = Field(ge=1, le=60)


class DeletionIn(BaseModel):
    reason: str = "정보주체 삭제 요청"


def create_app(*, clock: Clock = utc_now, hasher: PasswordHasher | None = None,
               llm_client: LLMClient | None = None, seed: bool = True) -> FastAPI:
    c = Container(clock, hasher or PasswordHasher(), llm_client or RecordingLLMClient())
    if seed:
        seed_demo_data(c)

    app = FastAPI(title="KR Privacy Examples")
    app.state.container = c

    if not logger.handlers:  # 앱 로그는 마스킹 필터가 붙은 핸들러로만 출력
        logger.addHandler(install_masking(logging.StreamHandler()))

    @app.middleware("http")
    async def attach_principal(request: Request, call_next):
        request.state.principal = None
        token = request.cookies.get(COOKIE_NAME)
        if token and (session := c.sessions.get(token)) and (user := c.users.get(session.user_id)):
            request.state.principal = Principal(user.id, frozenset(user.roles), c.pii_grants.grants_for(user.id))
        return await call_next(request)

    @app.exception_handler(NotFoundError)
    async def _not_found(_: Request, __: NotFoundError) -> JSONResponse:
        return JSONResponse({"detail": "not found"}, status_code=404)

    @app.exception_handler(PermissionDeniedError)
    async def _forbidden(_: Request, __: PermissionDeniedError) -> JSONResponse:
        return JSONResponse({"detail": "forbidden"}, status_code=403)

    # --- 세션·인증 ---
    @app.post("/auth/login", response_model=UserSummary)
    def login(body: LoginIn, request: Request, response: Response) -> UserSummary:
        user = authenticate(c.users, c.hasher, body.email, body.password)
        if user is None:
            logger.info("login failed", extra={"email": body.email})  # 필터가 이메일을 마스킹
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid credentials")
        token = c.sessions.login(user.id, previous_token=request.cookies.get(COOKIE_NAME))
        set_session_cookie(response, token, c.sessions.absolute_timeout)
        c.audit.record(user.id, "auth.login", subject_id=user.id)
        return to_user_summary(user)

    @app.post("/auth/logout", status_code=204)
    def logout(request: Request, response: Response) -> Response:
        if token := request.cookies.get(COOKIE_NAME):
            c.sessions.revoke(token)
        clear_session_cookie(response)
        response.status_code = 204
        return response

    # --- 최소 필드 반환 ---
    @app.get("/me", response_model=MyProfile)
    def me(p: Principal = Depends(get_principal)) -> MyProfile:
        user = c.users.get(p.user_id)
        if user is None:
            raise NotFoundError(p.user_id)
        return to_my_profile(user)

    # --- RBAC + 객체 소유권 ---
    @app.get("/orders", response_model=list[OrderOut])
    def my_orders(p: Principal = Depends(require_permission(Permission.ORDER_READ_OWN))) -> list[OrderOut]:
        return [to_order_out(o) for o in list_orders_for(p, c.orders)]

    @app.get("/orders/{order_id}", response_model=OrderOut)
    def order_detail(order_id: str, p: Principal = Depends(get_principal)) -> OrderOut:
        return to_order_out(get_order_for(p, order_id, c.orders, c.audit))

    # --- 관리자 권한 / 열람 권한 분리 ---
    @app.get("/admin/users", response_model=list[AdminUserView])
    def admin_users(p: Principal = Depends(require_permission(Permission.USER_MANAGE))) -> list[AdminUserView]:
        return c.admin.list_users(p)

    @app.get("/admin/users/{user_id}/pii", response_model=PiiView)
    def admin_user_pii(user_id: str, purpose: str | None = None, p: Principal = Depends(get_principal)) -> PiiView:
        return c.pii.read_pii(p, user_id, purpose)

    @app.post("/admin/break-glass")
    def open_break_glass(body: BreakGlassIn, p: Principal = Depends(get_principal)) -> dict[str, str]:
        try:
            g = c.break_glass.open(p, body.subject_id, body.reason, timedelta(minutes=body.minutes))
        except ValueError as e:
            raise HTTPException(422, str(e)) from e
        return {"grant_id": g.id, "expires_at": g.expires_at.isoformat()}

    @app.get("/audit/verify")
    def audit_verify(_: Principal = Depends(require_permission(Permission.AUDIT_READ))) -> dict[str, Any]:
        r = c.audit.verify()
        return {"ok": r.ok, "broken_at": r.broken_at, "events": len(c.audit.events())}

    # --- 정보주체 권리 ---
    @app.get("/me/export")
    def export_me(p: Principal = Depends(get_principal)) -> dict[str, Any]:
        return c.dsr.export(p, p.user_id)

    @app.post("/me/deletion-request")
    def delete_me(body: DeletionIn, response: Response, p: Principal = Depends(get_principal)) -> dict[str, Any]:
        report = c.dsr.delete(p, p.user_id, body.reason)
        clear_session_cookie(response)
        return {"deleted_records": report.deleted_records, "retained": report.retained,
                "sessions_revoked": report.sessions_revoked}

    # --- 외부 LLM 전송 필터링 ---
    @app.post("/support/tickets/{ticket_id}/summary")
    def summarize(ticket_id: str, p: Principal = Depends(require_permission(Permission.TICKET_READ))) -> dict[str, str]:
        ticket = c.tickets.get(ticket_id)
        if ticket is None:
            raise NotFoundError(ticket_id)
        return {"summary": c.llm.summarize_ticket(p.user_id, ticket)}

    return app


app = create_app()
