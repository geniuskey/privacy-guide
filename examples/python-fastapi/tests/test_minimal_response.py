from kr_privacy_examples.minimal_response import (
    FORBIDDEN_RESPONSE_FIELDS, AdminUserView, MyProfile, OrderOut, PiiView, UserSummary, mask_name,
)

import pydantic
import pytest


def _keys(obj):
    if isinstance(obj, dict):
        for k, v in obj.items():
            yield k
            yield from _keys(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from _keys(v)


@pytest.mark.parametrize("model", [UserSummary, MyProfile, AdminUserView, OrderOut, PiiView])
def test_response_schemas_have_no_internal_fields(model):
    assert not set(model.model_json_schema()["properties"]) & FORBIDDEN_RESPONSE_FIELDS


def test_extra_fields_are_rejected():
    with pytest.raises(pydantic.ValidationError):
        UserSummary(id="u", display_name="x", password_hash="h")


def test_endpoints_never_leak_internal_fields(login):
    c = login("alice@example.com")
    for path in ["/me", "/orders", "/orders/o-1", "/me/export"]:
        r = c.get(path)
        assert r.status_code == 200, path
        assert not set(_keys(r.json())) & FORBIDDEN_RESPONSE_FIELDS, path
        assert "900101-1234567" not in r.text and "scrypt$" not in r.text and "VIP" not in r.text
        assert "테헤란로" not in r.text  # 배송지는 주문 응답에서 제외


def test_login_response_is_summary_only(client_factory):
    from kr_privacy_examples.app import DEMO_PASSWORD
    r = client_factory().post("/auth/login", json={"email": "alice@example.com", "password": DEMO_PASSWORD})
    assert r.json() == {"id": "u-alice", "display_name": "김**스"}


def test_mask_name():
    assert mask_name("이밥") == "이*" and mask_name("남궁민수") == "남**수"
