"""관리자 권한과 데이터 열람 권한 분리.

- system_admin 은 계정·역할을 관리할 수 있지만, 개인정보 원문을 볼 수는 없다.
- 개인정보 열람(pii:read)은 privacy_officer 가 "타인에게만" 별도로 부여한다(자기 부여 금지).
- system_admin 은 privacy_officer 역할을 부여할 수 없고, 자기 역할도 바꿀 수 없다(권한 상승 차단).
- 긴급 열람(break-glass): 사유 필수, 대상 1명, 시간 제한, 모든 단계 감사로그.
"""

from __future__ import annotations

import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta

from .audit_log import AuditLog
from .domain import Clock, NotFoundError, PermissionDeniedError, UserStore, utc_now
from .minimal_response import AdminUserView, PiiView, to_admin_view
from .rbac import Permission, Principal, Role, has_permission

# system_admin 이 부여할 수 없는 역할
PROTECTED_ROLES = frozenset({Role.PRIVACY_OFFICER})


class PiiGrantRegistry:
    def __init__(self, audit: AuditLog) -> None:
        self._audit = audit
        self._grants: dict[str, set[Permission]] = {}

    def grant_pii_read(self, granter: Principal, grantee_id: str, reason: str) -> None:
        if not has_permission(granter, Permission.PII_GRANT):
            raise PermissionDeniedError("pii:grant required")
        if granter.user_id == grantee_id:
            raise PermissionDeniedError("self-grant is not allowed")
        if not reason.strip():
            raise ValueError("reason required")
        self._grants.setdefault(grantee_id, set()).add(Permission.PII_READ)
        self._audit.record(granter.user_id, "pii.grant", subject_id=grantee_id, reason=reason)

    def revoke_pii_read(self, granter: Principal, grantee_id: str) -> None:
        if not has_permission(granter, Permission.PII_GRANT):
            raise PermissionDeniedError("pii:grant required")
        self._grants.get(grantee_id, set()).discard(Permission.PII_READ)
        self._audit.record(granter.user_id, "pii.revoke", subject_id=grantee_id)

    def grants_for(self, user_id: str) -> frozenset[Permission]:
        return frozenset(self._grants.get(user_id, set()))


class AdminService:
    """계정 관리. 반환값은 항상 마스킹된 AdminUserView."""

    def __init__(self, users: UserStore, audit: AuditLog) -> None:
        self._users = users
        self._audit = audit

    def list_users(self, actor: Principal) -> list[AdminUserView]:
        if not has_permission(actor, Permission.USER_MANAGE):
            raise PermissionDeniedError("user:manage required")
        return [to_admin_view(u) for u in self._users.all()]

    def assign_roles(self, actor: Principal, target_id: str, roles: set[str]) -> AdminUserView:
        if not has_permission(actor, Permission.ROLE_MANAGE):
            raise PermissionDeniedError("role:manage required")
        if actor.user_id == target_id:
            raise PermissionDeniedError("cannot change own roles")
        if roles & PROTECTED_ROLES:
            raise PermissionDeniedError("protected role")
        user = self._users.get(target_id)
        if user is None:
            raise NotFoundError(target_id)
        valid = {Role(r) for r in roles}  # 알 수 없는 역할은 ValueError
        before = sorted(user.roles)
        user.roles = set(valid)
        self._audit.record(actor.user_id, "role.assign", subject_id=target_id,
                           details={"before": before, "after": sorted(user.roles)})
        return to_admin_view(user)


@dataclass(frozen=True)
class BreakGlassGrant:
    id: str
    actor_id: str
    subject_id: str
    reason: str
    opened_at: datetime
    expires_at: datetime


class BreakGlassService:
    MIN_REASON_LENGTH = 10
    MAX_DURATION = timedelta(hours=1)

    def __init__(self, audit: AuditLog, clock: Clock = utc_now) -> None:
        self._audit = audit
        self._clock = clock
        self._grants: dict[str, BreakGlassGrant] = {}

    def open(self, actor: Principal, subject_id: str, reason: str, duration: timedelta) -> BreakGlassGrant:
        if not has_permission(actor, Permission.BREAK_GLASS):
            raise PermissionDeniedError("break-glass not allowed")
        if len(reason.strip()) < self.MIN_REASON_LENGTH:
            raise ValueError("구체적인 사유가 필요합니다")
        if duration <= timedelta(0) or duration > self.MAX_DURATION:
            raise ValueError("duration out of range")
        now = self._clock()
        grant = BreakGlassGrant(secrets.token_hex(8), actor.user_id, subject_id, reason, now, now + duration)
        self._grants[grant.id] = grant
        self._audit.record(actor.user_id, "break_glass.open", subject_id=subject_id, reason=reason,
                           details={"grant_id": grant.id, "expires_at": grant.expires_at.isoformat()})
        return grant

    def close(self, actor: Principal, grant_id: str) -> None:
        grant = self._grants.pop(grant_id, None)
        if grant:
            self._audit.record(actor.user_id, "break_glass.close", subject_id=grant.subject_id,
                               details={"grant_id": grant_id})

    def active_grant(self, actor_id: str, subject_id: str) -> BreakGlassGrant | None:
        now = self._clock()
        for g in self._grants.values():
            if g.actor_id == actor_id and g.subject_id == subject_id and g.opened_at <= now < g.expires_at:
                return g
        return None


class PiiAccessService:
    def __init__(self, users: UserStore, break_glass: BreakGlassService, audit: AuditLog) -> None:
        self._users = users
        self._bg = break_glass
        self._audit = audit

    def read_pii(self, actor: Principal, subject_id: str, purpose: str | None = None) -> PiiView:
        if has_permission(actor, Permission.PII_READ):
            via, reason = "grant", purpose
        elif bg := self._bg.active_grant(actor.user_id, subject_id):
            via, reason = "break_glass", bg.reason
        else:
            self._audit.record(actor.user_id, "pii.read", subject_id=subject_id, result="denied")
            raise PermissionDeniedError("pii:read required")
        user = self._users.get(subject_id)
        if user is None:
            raise NotFoundError(subject_id)
        # 열람 "성공"도 반드시 기록한다(개인정보처리시스템 접속기록).
        self._audit.record(actor.user_id, "pii.read", subject_id=subject_id, reason=reason, details={"via": via})
        return PiiView(id=user.id, name=user.name, email=user.email, phone=user.phone, access_via=via)
