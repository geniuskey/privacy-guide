"""정보주체 권리: 개인정보 내보내기(열람·전송)와 삭제 요청 처리.

- 본인 확인된 주체만 자기 데이터에 대해 요청할 수 있다(대리 요청은 별도 위임 확인 절차 필요).
- 내보내기는 응답 모델(허용 목록)을 재사용해 내부 필드가 섞이지 않게 한다.
- 삭제 요청: 운영 데이터는 파기, 법정 보존 대상은 최소 항목만 분리보관, 계정은 파기 후 세션 전부 폐기.
- 처리 결과(무엇을 지웠고 무엇을 왜 남겼는지)를 정보주체에게 알릴 수 있도록 보고서로 반환한다.
"""

from __future__ import annotations

import secrets
from dataclasses import dataclass, field
from typing import Any, Callable

from .audit_log import AuditLog
from .domain import Clock, NotFoundError, OrderRepository, PermissionDeniedError, UserStore, utc_now
from .minimal_response import to_my_profile, to_order_out
from .rbac import Principal
from .retention import RetentionService, StoredRecord


@dataclass
class DeletionReport:
    user_id: str
    deleted_records: int = 0
    retained: list[dict[str, str]] = field(default_factory=list)  # 남긴 항목과 근거
    unclassified_records: int = 0
    sessions_revoked: int = 0


class DataSubjectRightsService:
    def __init__(self, users: UserStore, orders: OrderRepository, retention: RetentionService, audit: AuditLog,
                 clock: Clock = utc_now, on_account_deleted: Callable[[str], int] | None = None) -> None:
        self._users, self._orders, self._retention = users, orders, retention
        self._audit, self._clock = audit, clock
        self._on_deleted = on_account_deleted

    @staticmethod
    def _ensure_self(actor: Principal, user_id: str) -> None:
        if actor.user_id != user_id:
            raise PermissionDeniedError("본인 데이터만 요청할 수 있습니다")

    def export(self, actor: Principal, user_id: str) -> dict[str, Any]:
        self._ensure_self(actor, user_id)
        user = self._users.get(user_id)
        if user is None:
            raise NotFoundError(user_id)
        data = {
            "profile": to_my_profile(user).model_dump(mode="json"),
            "orders": [to_order_out(o).model_dump(mode="json") for o in self._orders.list_by_owner(user_id)],
            "records": [
                {"id": r.id, "type": r.record_type, "created_at": r.created_at.isoformat(), "data": r.data}
                for r in self._retention.active.for_user(user_id)
            ],
            "exported_at": self._clock().isoformat(),
        }
        self._audit.record(actor.user_id, "dsr.export", subject_id=user_id)
        return data

    def delete(self, actor: Principal, user_id: str, reason: str = "정보주체 삭제 요청") -> DeletionReport:
        self._ensure_self(actor, user_id)
        if self._users.get(user_id) is None:
            raise NotFoundError(user_id)
        now = self._clock()
        report = DeletionReport(user_id)

        # 1) 주문 → 전자상거래법상 계약 기록으로 "최소 항목만" 남긴다(배송지 등은 제외).
        for o in self._orders.remove_by_owner(user_id):
            self._retention.active.add(StoredRecord(
                id=f"contract-{o.id}-{secrets.token_hex(4)}", record_type="contract_record", user_id=user_id,
                data={"order_id": o.id, "item": o.item, "amount": o.amount, "ordered_at": o.created_at.isoformat()},
                created_at=now,
            ))

        # 2) 운영 기록: 법정 보존 대상은 분리보관, 나머지는 파기
        sep = self._retention.end_purpose_for_user(user_id, actor_id=actor.user_id)
        report.deleted_records = len(sep.deleted)
        report.unclassified_records = len(sep.unclassified)
        for rec_id in sep.separated:
            rec = next(r for r in self._retention.separated.for_user(user_id) if r.id == rec_id)
            rule = self._retention.policy.rule_for(rec.record_type)
            report.retained.append({"record_type": rec.record_type, "basis": rule.basis if rule else ""})

        # 3) 계정 파기 + 세션 폐기
        self._users.remove(user_id)
        if self._on_deleted:
            report.sessions_revoked = self._on_deleted(user_id)

        self._audit.record(actor.user_id, "dsr.delete", subject_id=user_id, reason=reason,
                           details={"deleted_records": report.deleted_records, "retained": len(report.retained),
                                    "unclassified": report.unclassified_records})
        return report
