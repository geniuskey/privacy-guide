"""RBAC 접근제어: 역할 → 권한 매핑과 권한 강제 FastAPI 의존성.

원칙
- 기본 거부(default deny): 매핑에 없는 역할/권한은 모두 거부한다.
- 코드에서는 역할이 아니라 "권한"을 검사한다(역할 구성이 바뀌어도 코드 수정 불필요).
- 개인정보 열람(pii:read)은 역할에 묶지 않고 별도 부여(grant)로만 얻는다.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Callable, Iterable

from fastapi import HTTPException, Request, status


class Permission(StrEnum):
    ORDER_READ_OWN = "order:read:own"
    ORDER_READ_ANY = "order:read:any"
    TICKET_READ = "ticket:read"
    USER_MANAGE = "user:manage"
    ROLE_MANAGE = "role:manage"
    BREAK_GLASS = "pii:break_glass"  # 긴급 열람 "요청" 자격 (열람 권한 자체가 아님)
    PII_READ = "pii:read"  # 역할 매핑에 없음. 별도 grant 로만 부여
    PII_GRANT = "pii:grant"
    AUDIT_READ = "audit:read"


class Role(StrEnum):
    CUSTOMER = "customer"
    SUPPORT = "support"
    SYSTEM_ADMIN = "system_admin"
    PRIVACY_OFFICER = "privacy_officer"


ROLE_PERMISSIONS: dict[Role, frozenset[Permission]] = {
    Role.CUSTOMER: frozenset({Permission.ORDER_READ_OWN}),
    Role.SUPPORT: frozenset({Permission.ORDER_READ_ANY, Permission.TICKET_READ, Permission.BREAK_GLASS}),
    # 시스템 관리자는 계정/역할을 관리하지만 개인정보 열람 권한은 없다.
    Role.SYSTEM_ADMIN: frozenset({Permission.USER_MANAGE, Permission.ROLE_MANAGE, Permission.BREAK_GLASS}),
    # 개인정보 보호책임자(또는 위임자)는 열람 권한 부여와 감사로그 열람을 담당한다.
    Role.PRIVACY_OFFICER: frozenset({Permission.PII_GRANT, Permission.AUDIT_READ}),
}


@dataclass(frozen=True)
class Principal:
    """인증된 요청 주체."""

    user_id: str
    roles: frozenset[str] = frozenset()
    grants: frozenset[Permission] = field(default_factory=frozenset)


def permissions_for(roles: Iterable[str], grants: Iterable[Permission] = ()) -> frozenset[Permission]:
    perms: set[Permission] = set(grants)
    for r in roles:
        try:
            perms |= ROLE_PERMISSIONS[Role(r)]
        except ValueError:
            continue  # 알 수 없는 역할 → 권한 없음 (기본 거부)
    return frozenset(perms)


def has_permission(principal: Principal, permission: Permission) -> bool:
    return permission in permissions_for(principal.roles, principal.grants)


def get_principal(request: Request) -> Principal:
    """미들웨어가 세션에서 해석해 둔 주체를 꺼낸다. 없으면 401."""
    principal = getattr(request.state, "principal", None)
    if principal is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "authentication required")
    return principal


def require_permission(permission: Permission) -> Callable[[Request], Principal]:
    """`Depends(require_permission(Permission.X))` 로 엔드포인트에 권한을 강제한다."""

    def dependency(request: Request) -> Principal:
        principal = get_principal(request)
        if not has_permission(principal, permission):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "forbidden")
        return principal

    return dependency
