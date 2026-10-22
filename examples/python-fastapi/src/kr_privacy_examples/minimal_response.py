"""최소 필드 반환 API: 응답 모델을 허용 목록(allowlist)으로 사용한다.

- 내부 모델(UserRecord)을 그대로 직렬화하지 않는다. 필드가 추가되면 자동으로 노출되기 때문이다.
- 응답 모델은 화면/용도별로 따로 정의하고, 변환 함수에서 필드를 "명시적으로" 골라 담는다.
- extra="forbid" 로 실수로 넘긴 내부 필드가 조용히 섞이지 않게 한다.
- FastAPI response_model 은 2차 방어선으로, 반환 객체에서 모델에 없는 필드를 제거한다.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from .domain import Order, UserRecord

# 어떤 응답에도 나타나면 안 되는 내부 필드명 (테스트에서 회귀 방지용으로 사용)
FORBIDDEN_RESPONSE_FIELDS = frozenset({
    "password_hash", "resident_number", "internal_memo", "failed_login_count", "shipping_address",
})


class _Out(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class UserSummary(_Out):
    """다른 사용자에게 보여도 되는 최소 정보."""

    id: str
    display_name: str


class MyProfile(_Out):
    """본인 조회용. 본인 정보라도 비밀번호 해시·내부 메모 등은 제외."""

    id: str
    name: str
    email: str
    phone: str
    created_at: datetime


class AdminUserView(_Out):
    """시스템 관리자용: 계정 관리에 필요한 정보만. 연락처는 마스킹."""

    id: str
    email_masked: str
    roles: list[str]
    created_at: datetime


class OrderOut(_Out):
    id: str
    item: str
    amount: int
    created_at: datetime


class PiiView(_Out):
    """pii:read 또는 break-glass 로만 반환되는 상세 개인정보."""

    id: str
    name: str
    email: str
    phone: str
    access_via: str


def mask_name(name: str) -> str:
    if len(name) <= 1:
        return "*"
    if len(name) == 2:
        return name[0] + "*"
    return name[0] + "*" * (len(name) - 2) + name[-1]


def mask_email(email: str) -> str:
    local, _, domain = email.partition("@")
    return f"{local[:1]}***@{domain}" if domain else "***"


def to_user_summary(u: UserRecord) -> UserSummary:
    return UserSummary(id=u.id, display_name=mask_name(u.name))


def to_my_profile(u: UserRecord) -> MyProfile:
    return MyProfile(id=u.id, name=u.name, email=u.email, phone=u.phone, created_at=u.created_at)


def to_admin_view(u: UserRecord) -> AdminUserView:
    return AdminUserView(id=u.id, email_masked=mask_email(u.email), roles=sorted(u.roles), created_at=u.created_at)


def to_order_out(o: Order) -> OrderOut:
    return OrderOut(id=o.id, item=o.item, amount=o.amount, created_at=o.created_at)
