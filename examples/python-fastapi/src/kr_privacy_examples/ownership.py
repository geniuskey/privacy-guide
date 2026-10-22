"""객체 단위 소유권 검증 (BOLA/IDOR 방지).

`GET /orders/{id}` 처럼 식별자를 받는 모든 API 는 "이 주체가 이 객체에 접근할 수 있는가"를
매 요청마다 서버에서 검증해야 한다. 로그인 여부나 역할 검사만으로는 부족하다.

404 vs 403 정책
- 타인 소유 객체에 403 을 주면 "그 ID 가 존재한다"는 사실이 노출된다(열거 공격의 단서).
- 따라서 일반 사용자에게는 '없음'과 '권한 없음'을 구분하지 않고 동일하게 404 를 반환한다.
- 403 은 객체와 무관한 기능 단위 권한 부족(RBAC)에 사용한다.
- 내부 감사로그에는 실제 사유(타인 객체 접근 시도)를 남겨 탐지에 활용한다.
"""

from __future__ import annotations

from .audit_log import AuditLog
from .domain import NotFoundError, Order, OrderRepository
from .rbac import Permission, Principal, has_permission


def get_order_for(principal: Principal, order_id: str, repo: OrderRepository, audit: AuditLog | None = None) -> Order:
    order = repo.get(order_id)
    if order is None:
        raise NotFoundError(order_id)
    if order.owner_id == principal.user_id:
        return order
    if has_permission(principal, Permission.ORDER_READ_ANY):
        if audit:
            audit.record(principal.user_id, "order.read", subject_id=order.owner_id, resource=f"order:{order_id}")
        return order
    if audit:
        audit.record(
            principal.user_id, "order.read", subject_id=order.owner_id,
            resource=f"order:{order_id}", result="denied", reason="not owner",
        )
    raise NotFoundError(order_id)  # 403 이 아니라 404: 존재 여부 비노출


def list_orders_for(principal: Principal, repo: OrderRepository) -> list[Order]:
    # 목록 API 는 조회 조건 자체를 소유자로 한정한다(클라이언트가 owner_id 를 넘기게 하지 않는다).
    return repo.list_by_owner(principal.user_id)
