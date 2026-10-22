from kr_privacy_examples.domain import NotFoundError
from kr_privacy_examples.ownership import get_order_for
from kr_privacy_examples.rbac import Principal, Role

import pytest


def test_owner_can_read_own_order(login):
    r = login("alice@example.com").get("/orders/o-1")
    assert r.status_code == 200 and r.json()["id"] == "o-1"


def test_other_users_order_returns_404_not_403(login):
    alice = login("alice@example.com")
    other = alice.get("/orders/o-2")      # bob 의 주문
    missing = alice.get("/orders/o-999")  # 존재하지 않는 주문
    # 존재 여부를 구분할 수 없어야 한다
    assert other.status_code == missing.status_code == 404
    assert other.json() == missing.json()


def test_denied_access_is_audited(app, login):
    login("alice@example.com").get("/orders/o-2")
    denied = [e for e in app.state.container.audit.events(action="order.read") if e.result == "denied"]
    assert denied and denied[0].actor_id == "u-alice"


def test_list_is_scoped_to_owner(login):
    ids = [o["id"] for o in login("alice@example.com").get("/orders").json()]
    assert ids == ["o-1"]


def test_support_with_read_any_permission(app):
    repo = app.state.container.orders
    assert get_order_for(Principal("s", frozenset({Role.SUPPORT})), "o-2", repo).owner_id == "u-bob"
    with pytest.raises(NotFoundError):
        get_order_for(Principal("x", frozenset({Role.CUSTOMER})), "o-2", repo)
