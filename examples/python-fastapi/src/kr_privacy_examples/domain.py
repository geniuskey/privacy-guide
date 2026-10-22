"""예제 전반에서 공유하는 도메인 모델과 인메모리 저장소."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Callable

# 시간 의존 로직(타임아웃, 보존기간)은 테스트 가능하도록 시계를 주입받는다.
Clock = Callable[[], datetime]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class NotFoundError(Exception):
    """리소스가 없거나, 존재 여부를 노출하면 안 되는 경우."""


class PermissionDeniedError(Exception):
    """인증은 되었으나 권한이 없는 경우."""


@dataclass
class UserRecord:
    """DB 행에 해당하는 내부 모델. 절대 그대로 응답으로 내보내지 않는다."""

    id: str
    email: str
    name: str
    phone: str
    password_hash: str
    roles: set[str]
    created_at: datetime
    # 주민등록번호는 법령 근거 없이 수집할 수 없다(개인정보 보호법 제24조의2).
    # 여기서는 "응답에 절대 나오면 안 되는 내부 필드"를 시연하기 위해서만 둔다.
    resident_number: str | None = None
    internal_memo: str = ""
    failed_login_count: int = 0


class UserStore:
    def __init__(self) -> None:
        self._users: dict[str, UserRecord] = {}

    def add(self, user: UserRecord) -> None:
        self._users[user.id] = user

    def get(self, user_id: str) -> UserRecord | None:
        return self._users.get(user_id)

    def get_by_email(self, email: str) -> UserRecord | None:
        email = email.strip().lower()
        return next((u for u in self._users.values() if u.email.lower() == email), None)

    def all(self) -> list[UserRecord]:
        return list(self._users.values())

    def remove(self, user_id: str) -> None:
        self._users.pop(user_id, None)


@dataclass(frozen=True)
class Order:
    id: str
    owner_id: str
    item: str
    amount: int
    shipping_address: str
    created_at: datetime


@dataclass
class OrderRepository:
    _orders: dict[str, Order] = field(default_factory=dict)

    def add(self, order: Order) -> None:
        self._orders[order.id] = order

    def get(self, order_id: str) -> Order | None:
        return self._orders.get(order_id)

    def list_by_owner(self, owner_id: str) -> list[Order]:
        return [o for o in self._orders.values() if o.owner_id == owner_id]

    def remove_by_owner(self, owner_id: str) -> list[Order]:
        removed = self.list_by_owner(owner_id)
        for o in removed:
            del self._orders[o.id]
        return removed
