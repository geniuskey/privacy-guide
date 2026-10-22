import json

import pytest

from kr_privacy_examples.domain import PermissionDeniedError
from kr_privacy_examples.rbac import Principal, Role


def test_export_own_data_as_json(login):
    r = login("alice@example.com").get("/me/export")
    assert r.status_code == 200
    data = r.json()
    assert data["profile"]["email"] == "alice@example.com"
    assert [o["id"] for o in data["orders"]] == ["o-1"]
    assert {x["type"] for x in data["records"]} == {"support_chat", "payment_record", "marketing_profile"}
    json.dumps(data, ensure_ascii=False)  # 직렬화 가능
    assert "password_hash" not in r.text and "resident_number" not in r.text


def test_cannot_export_or_delete_others(app):
    dsr = app.state.container.dsr
    bob = Principal("u-bob", frozenset({Role.CUSTOMER}))
    with pytest.raises(PermissionDeniedError):
        dsr.export(bob, "u-alice")
    with pytest.raises(PermissionDeniedError):
        dsr.delete(bob, "u-alice")


def test_deletion_request(login, app):
    c = app.state.container
    alice = login("alice@example.com")
    r = alice.post("/me/deletion-request", json={"reason": "서비스 탈퇴"})
    assert r.status_code == 200
    body = r.json()
    assert body["sessions_revoked"] == 1
    assert {x["record_type"] for x in body["retained"]} == {"payment_record", "contract_record"}
    assert body["deleted_records"] == 2  # support_chat, marketing_profile

    # 계정·주문·운영 기록 삭제, 세션 무효화
    assert c.users.get("u-alice") is None
    assert c.orders.list_by_owner("u-alice") == []
    assert c.retention.active.for_user("u-alice") == []
    assert alice.get("/me").status_code == 401

    # 법정 보존 기록은 분리보관되며 최소 항목만 포함 (배송지 제외)
    contract = next(r for r in c.retention.separated.for_user("u-alice") if r.record_type == "contract_record")
    assert "shipping_address" not in contract.data and contract.data["order_id"] == "o-1"

    actions = [e.action for e in c.audit.events(subject_id="u-alice")]
    assert "dsr.delete" in actions and "retention.end_purpose" in actions
    assert c.audit.verify().ok
