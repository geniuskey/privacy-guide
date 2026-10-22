import dataclasses

from kr_privacy_examples.audit_log import AuditLog


def _log(clock, key=None):
    log = AuditLog(clock, hmac_key=key)
    log.record("u-admin", "pii.read", subject_id="u-alice", resource="user:u-alice", reason="CS 문의 #1")
    log.record("u-admin", "role.assign", subject_id="u-bob", details={"after": ["support"]})
    log.record("u-alice", "dsr.export", subject_id="u-alice")
    return log


def test_event_has_who_when_what_whom_why(clock):
    e = _log(clock).events()[0]
    assert (e.actor_id, e.action, e.subject_id, e.reason) == ("u-admin", "pii.read", "u-alice", "CS 문의 #1")
    assert e.timestamp == clock().isoformat()


def test_chain_verifies(clock):
    assert _log(clock).verify().ok
    assert _log(clock, key=b"secret-from-kms").verify().ok


def test_tampering_detected(clock):
    log = _log(clock)
    log._events[1] = dataclasses.replace(log._events[1], subject_id="u-carol")
    r = log.verify()
    assert not r.ok and r.broken_at == 1


def test_deletion_detected(clock):
    log = _log(clock)
    del log._events[1]
    assert log.verify().broken_at == 1


def test_no_mutation_api_and_returns_copy(clock):
    log = _log(clock)
    assert not any(hasattr(log, m) for m in ("update", "delete", "remove", "clear"))
    assert isinstance(log.events(), tuple)


def test_pii_in_reason_and_details_masked(clock):
    log = AuditLog(clock)
    e = log.record("u", "x", reason="고객 010-1234-5678 요청", details={"email": "a@b.com", "password": "p"})
    assert e.reason == "고객 010-****-5678 요청"
    assert e.details == {"email": "a***@b.com", "password": "[REDACTED]"}


def test_audit_verify_endpoint(login):
    assert login("alice@example.com").get("/audit/verify").status_code == 403
    r = login("officer@example.com").get("/audit/verify")
    assert r.status_code == 200 and r.json()["ok"] is True
