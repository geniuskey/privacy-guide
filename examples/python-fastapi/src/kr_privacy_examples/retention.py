"""보존기간 만료 데이터 삭제와 법정 보존 데이터 분리보관.

- 기록 유형별 보존 규칙(근거 포함)을 코드/설정으로 관리한다.
- 보존기간은 "처리 목적 종료 시점"(retention_start, 예: 탈퇴·거래 완료)부터 계산한다.
- 법령상 보존 의무가 있는 기록은 운영 저장소에서 분리보관 저장소로 옮기고, 목적 외 열람을 막는다.
- 파기 배치는 시계를 주입받아 테스트 가능하게 만들고, 파기 사실(유형·ID·근거)을 감사로그에 남긴다.
- 규칙이 없는 유형은 임의로 지우지도, 무기한 두지도 않고 "미분류"로 보고해 사람이 판단하게 한다.

아래 보존기간·근거는 예시다. 실제 적용 전 최신 법령과 법무 검토로 확정해야 한다.
"""

from __future__ import annotations

import calendar
from dataclasses import dataclass, field, replace
from datetime import datetime, timedelta
from typing import Any

from .audit_log import AuditLog
from .domain import Clock, PermissionDeniedError, utc_now


@dataclass(frozen=True)
class RetentionRule:
    record_type: str
    years: int = 0
    months: int = 0
    days: int = 0
    basis: str = ""
    legal_hold: bool = False  # True 면 목적 종료 후 즉시 파기하지 않고 분리보관


def add_period(start: datetime, years: int = 0, months: int = 0, days: int = 0) -> datetime:
    total = start.month - 1 + months + years * 12
    year, month = start.year + total // 12, total % 12 + 1
    day = min(start.day, calendar.monthrange(year, month)[1])  # 2/29, 31일 보정
    return start.replace(year=year, month=month, day=day) + timedelta(days=days)


DEFAULT_RULES: tuple[RetentionRule, ...] = (
    RetentionRule("contract_record", years=5, legal_hold=True,
                  basis="전자상거래법 시행령 제6조: 계약 또는 청약철회 등에 관한 기록 5년"),
    RetentionRule("payment_record", years=5, legal_hold=True,
                  basis="전자상거래법 시행령 제6조: 대금결제 및 재화 등의 공급에 관한 기록 5년"),
    RetentionRule("consumer_complaint", years=3, legal_hold=True,
                  basis="전자상거래법 시행령 제6조: 소비자 불만 또는 분쟁처리에 관한 기록 3년"),
    RetentionRule("login_log", months=3, legal_hold=True,
                  basis="통신비밀보호법 시행령 제41조: 로그기록자료 3개월"),
    RetentionRule("support_chat", years=1, basis="내부 방침(예시): 상담 품질 관리 1년"),
    RetentionRule("marketing_profile", basis="동의 철회·탈퇴 시 지체 없이 파기"),
)


class RetentionPolicy:
    def __init__(self, rules: tuple[RetentionRule, ...] = DEFAULT_RULES) -> None:
        self._rules = {r.record_type: r for r in rules}

    def rule_for(self, record_type: str) -> RetentionRule | None:
        return self._rules.get(record_type)

    def expires_at(self, record: StoredRecord) -> datetime | None:
        rule = self.rule_for(record.record_type)
        if rule is None or record.retention_start is None:
            return None
        return add_period(record.retention_start, rule.years, rule.months, rule.days)


@dataclass(frozen=True)
class StoredRecord:
    id: str
    record_type: str
    user_id: str
    data: dict[str, Any]
    created_at: datetime
    retention_start: datetime | None = None  # None = 아직 처리 목적 진행 중


class RecordStore:
    """운영 저장소."""

    def __init__(self) -> None:
        self._records: dict[str, StoredRecord] = {}

    def add(self, record: StoredRecord) -> None:
        self._records[record.id] = record

    def delete(self, record_id: str) -> None:
        self._records.pop(record_id, None)

    def all(self) -> list[StoredRecord]:
        return list(self._records.values())

    def for_user(self, user_id: str) -> list[StoredRecord]:
        return [r for r in self._records.values() if r.user_id == user_id]

    def __contains__(self, record_id: str) -> bool:
        return record_id in self._records


class SeparatedStore(RecordStore):
    """분리보관 저장소. 운영에서는 별도 DB/스키마·별도 접근권한·암호화로 물리/논리 분리한다."""

    ALLOWED_PURPOSES = frozenset({"dispute", "legal_request", "tax_audit"})

    def read(self, record_id: str, *, purpose: str, actor_id: str, audit: AuditLog) -> StoredRecord:
        if purpose not in self.ALLOWED_PURPOSES:
            audit.record(actor_id, "separated.read", resource=f"record:{record_id}", result="denied", reason=purpose)
            raise PermissionDeniedError("분리보관 데이터는 법정 목적 외 열람 불가")
        record = self._records[record_id]
        audit.record(actor_id, "separated.read", subject_id=record.user_id, resource=f"record:{record_id}",
                     reason=purpose)
        return record


@dataclass
class SeparationReport:
    deleted: list[str] = field(default_factory=list)
    separated: list[str] = field(default_factory=list)
    unclassified: list[str] = field(default_factory=list)


class RetentionService:
    def __init__(self, active: RecordStore, separated: SeparatedStore, policy: RetentionPolicy,
                 audit: AuditLog, clock: Clock = utc_now) -> None:
        self.active, self.separated, self.policy = active, separated, policy
        self._audit, self._clock = audit, clock

    def end_purpose_for_user(self, user_id: str, actor_id: str = "system") -> SeparationReport:
        """탈퇴 등으로 처리 목적이 끝났을 때: 법정 보존 대상은 분리보관, 나머지는 즉시 파기."""
        now = self._clock()
        report = SeparationReport()
        for rec in self.active.for_user(user_id):
            rule = self.policy.rule_for(rec.record_type)
            if rule is None:
                report.unclassified.append(rec.id)
                continue
            self.active.delete(rec.id)
            if rule.legal_hold:
                self.separated.add(replace(rec, retention_start=rec.retention_start or now))
                report.separated.append(rec.id)
            else:
                report.deleted.append(rec.id)
        self._audit.record(actor_id, "retention.end_purpose", subject_id=user_id,
                           details={"deleted": len(report.deleted), "separated": len(report.separated),
                                    "unclassified": len(report.unclassified)})
        return report


@dataclass
class PurgeResult:
    purged: list[str] = field(default_factory=list)
    unclassified: list[str] = field(default_factory=list)


class PurgeJob:
    """주기적으로 실행되는 파기 배치. 여러 번 실행해도 결과가 같다(멱등)."""

    def __init__(self, service: RetentionService, clock: Clock = utc_now) -> None:
        self._svc = service
        self._clock = clock

    def run(self) -> PurgeResult:
        now = self._clock()
        result = PurgeResult()
        for store in (self._svc.active, self._svc.separated):
            for rec in store.all():
                rule = self._svc.policy.rule_for(rec.record_type)
                if rule is None:
                    result.unclassified.append(rec.id)
                    continue
                expires = self._svc.policy.expires_at(rec)
                if expires is not None and expires <= now:
                    store.delete(rec.id)  # 운영에서는 백업·복제본·캐시·검색 인덱스 파기도 함께 관리
                    result.purged.append(rec.id)
                    self._svc._audit.record(
                        "retention-job", "retention.purge", subject_id=rec.user_id, resource=f"record:{rec.id}",
                        details={"record_type": rec.record_type, "basis": rule.basis},
                    )
        return result
