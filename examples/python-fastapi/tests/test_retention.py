from datetime import datetime, timezone

import pytest

from kr_privacy_examples.audit_log import AuditLog
from kr_privacy_examples.domain import PermissionDeniedError
from kr_privacy_examples.retention import (
    PurgeJob, RecordStore, RetentionPolicy, RetentionService, SeparatedStore, StoredRecord, add_period,
)


@pytest.fixture
def svc(clock):
    return RetentionService(RecordStore(), SeparatedStore(), RetentionPolicy(), AuditLog(clock), clock)


def _rec(id_, type_, clock, start=None):
    return StoredRecord(id_, type_, "u-1", {"v": 1}, clock(), retention_start=start)


def test_add_period_handles_month_end():
    assert add_period(datetime(2024, 2, 29, tzinfo=timezone.utc), years=1) == datetime(2025, 2, 28, tzinfo=timezone.utc)
    assert add_period(datetime(2026, 1, 31, tzinfo=timezone.utc), months=1) == datetime(2026, 2, 28, tzinfo=timezone.utc)


def test_active_purpose_records_are_not_purged(svc, clock):
    svc.active.add(_rec("chat", "support_chat", clock))  # retention_start 없음 = 이용 중
    clock.advance(days=365 * 10)
    assert PurgeJob(svc, clock).run().purged == []


def test_end_purpose_separates_legal_and_deletes_others(svc, clock):
    for id_, t in [("pay", "payment_record"), ("mkt", "marketing_profile"), ("chat", "support_chat"), ("x", "unknown")]:
        svc.active.add(_rec(id_, t, clock))
    report = svc.end_purpose_for_user("u-1")
    assert report.separated == ["pay"]
    assert set(report.deleted) == {"mkt", "chat"}
    assert report.unclassified == ["x"]
    assert "pay" in svc.separated and "pay" not in svc.active
    assert "x" in svc.active  # 미분류는 임의 삭제하지 않음


def test_purge_after_retention_period(svc, clock):
    svc.end_purpose_for_user("u-1")
    svc.active.add(_rec("pay", "payment_record", clock))
    svc.active.add(_rec("log", "login_log", clock))
    svc.end_purpose_for_user("u-1")
    job = PurgeJob(svc, clock)

    clock.advance(days=89)
    assert job.run().purged == []
    clock.advance(days=3)  # 3개월 경과
    assert job.run().purged == ["log"]
    clock.now = add_period(clock.now, years=5)
    assert job.run().purged == ["pay"]
    assert job.run().purged == []  # 멱등
    purges = svc._audit.events(action="retention.purge")
    assert [e.resource for e in purges] == ["record:log", "record:pay"]
    assert all(e.details["basis"] for e in purges)


def test_separated_store_access_restricted(svc, clock):
    svc.active.add(_rec("pay", "payment_record", clock))
    svc.end_purpose_for_user("u-1")
    with pytest.raises(PermissionDeniedError):
        svc.separated.read("pay", purpose="marketing", actor_id="u-x", audit=svc._audit)
    assert svc.separated.read("pay", purpose="dispute", actor_id="u-x", audit=svc._audit).id == "pay"
