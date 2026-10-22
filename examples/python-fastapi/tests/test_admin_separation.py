from datetime import timedelta

import pytest

from kr_privacy_examples.domain import PermissionDeniedError
from kr_privacy_examples.rbac import Principal, Role

ADMIN = Principal("u-admin", frozenset({Role.SYSTEM_ADMIN}))
OFFICER = Principal("u-officer", frozenset({Role.PRIVACY_OFFICER}))


def test_admin_can_manage_users_but_sees_no_pii(login):
    r = login("admin@example.com").get("/admin/users")
    assert r.status_code == 200
    body = r.text
    assert "alice@example.com" not in body and "010-1111-2222" not in body and "김앨리스" not in body
    assert any(u["email_masked"] == "a***@example.com" for u in r.json())


def test_admin_cannot_read_pii_without_grant(login, app):
    r = login("admin@example.com").get("/admin/users/u-alice/pii")
    assert r.status_code == 403
    assert app.state.container.audit.events(action="pii.read")[-1].result == "denied"


def test_pii_read_via_separate_grant(login, app):
    c = app.state.container
    c.pii_grants.grant_pii_read(OFFICER, "u-admin", "분쟁 대응 담당 지정")
    r = login("admin@example.com").get("/admin/users/u-alice/pii", params={"purpose": "분쟁 처리"})
    assert r.status_code == 200 and r.json()["email"] == "alice@example.com"
    assert "resident_number" not in r.json()


def test_self_grant_and_privilege_escalation_blocked(app):
    c = app.state.container
    with pytest.raises(PermissionDeniedError):
        c.pii_grants.grant_pii_read(OFFICER, "u-officer", "self")
    with pytest.raises(PermissionDeniedError):
        c.pii_grants.grant_pii_read(ADMIN, "u-support", "admin 은 부여 불가")
    with pytest.raises(PermissionDeniedError):
        c.admin.assign_roles(ADMIN, "u-support", {Role.PRIVACY_OFFICER})
    with pytest.raises(PermissionDeniedError):
        c.admin.assign_roles(ADMIN, "u-admin", {Role.SYSTEM_ADMIN, Role.SUPPORT})
    view = c.admin.assign_roles(ADMIN, "u-bob", {Role.SUPPORT})
    assert view.roles == ["support"]


def test_break_glass_requires_reason_and_expires(login, app, clock):
    admin = login("admin@example.com")
    short = admin.post("/admin/break-glass", json={"subject_id": "u-alice", "reason": "급함", "minutes": 10})
    assert short.status_code == 422

    r = admin.post("/admin/break-glass",
                   json={"subject_id": "u-alice", "reason": "장애 티켓 INC-123 고객 본인 확인", "minutes": 10})
    assert r.status_code == 200
    assert admin.get("/admin/users/u-alice/pii").json()["access_via"] == "break_glass"
    # 다른 대상에는 적용되지 않는다
    assert admin.get("/admin/users/u-bob/pii").status_code == 403

    clock.advance(minutes=11)
    assert admin.get("/admin/users/u-alice/pii").status_code == 403

    audit = app.state.container.audit
    opened = audit.events(action="break_glass.open")[0]
    assert opened.reason.startswith("장애 티켓") and opened.actor_id == "u-admin"
    assert [e.result for e in audit.events(action="pii.read")] == ["success", "denied", "denied"]


def test_break_glass_duration_capped(app):
    with pytest.raises(ValueError):
        app.state.container.break_glass.open(ADMIN, "u-alice", "충분히 긴 사유입니다 정말로", timedelta(hours=2))
