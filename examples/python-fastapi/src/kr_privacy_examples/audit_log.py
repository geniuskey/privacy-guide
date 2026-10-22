"""감사로그: 누가/언제/무엇을/누구의 정보에/어떤 행위를/왜 했는지 기록.

- append-only: 수정·삭제 API 를 제공하지 않는다.
- 해시 체인: 각 이벤트가 직전 이벤트 해시를 포함하므로 중간 변조·삭제가 verify() 로 드러난다.
- 해시 체인만으로는 저장소 쓰기 권한자가 체인 전체를 재계산할 수 있다.
  운영에서는 HMAC 키를 별도 보관(KMS)하거나, 주기적으로 최신 해시를 외부(WORM 스토리지 등)에 고정한다.
- 감사로그 자체에 개인정보 원문을 넣지 않는다(subject_id 등 식별자만, 사유·상세는 마스킹).
"""

from __future__ import annotations

import hashlib
import hmac
import json
from dataclasses import asdict, dataclass, field
from typing import Any

from .domain import Clock, utc_now
from .log_masking import mask_text, mask_value

GENESIS_HASH = "0" * 64


@dataclass(frozen=True)
class AuditEvent:
    seq: int
    timestamp: str
    actor_id: str
    action: str
    subject_id: str | None
    resource: str | None
    reason: str | None
    result: str
    details: dict[str, Any] = field(default_factory=dict)
    prev_hash: str = GENESIS_HASH
    hash: str = ""


@dataclass(frozen=True)
class VerifyResult:
    ok: bool
    broken_at: int | None = None  # 처음 깨진 이벤트의 seq


class AuditLog:
    def __init__(self, clock: Clock = utc_now, hmac_key: bytes | None = None) -> None:
        self._clock = clock
        self._key = hmac_key
        self._events: list[AuditEvent] = []

    def _digest(self, event: AuditEvent) -> str:
        payload = asdict(event)
        payload.pop("hash")
        data = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":"), default=str).encode()
        if self._key:
            return hmac.new(self._key, data, hashlib.sha256).hexdigest()
        return hashlib.sha256(data).hexdigest()

    def record(
        self,
        actor_id: str,
        action: str,
        *,
        subject_id: str | None = None,
        resource: str | None = None,
        reason: str | None = None,
        result: str = "success",
        details: dict[str, Any] | None = None,
    ) -> AuditEvent:
        prev = self._events[-1].hash if self._events else GENESIS_HASH
        event = AuditEvent(
            seq=len(self._events),
            timestamp=self._clock().isoformat(),
            actor_id=actor_id,
            action=action,
            subject_id=subject_id,
            resource=resource,
            reason=mask_text(reason) if reason else None,
            result=result,
            details=mask_value(dict(details or {})),
            prev_hash=prev,
        )
        event = AuditEvent(**{**asdict(event), "hash": self._digest(event)})
        self._events.append(event)
        return event

    def events(self, *, subject_id: str | None = None, action: str | None = None) -> tuple[AuditEvent, ...]:
        return tuple(
            e for e in self._events
            if (subject_id is None or e.subject_id == subject_id) and (action is None or e.action == action)
        )

    def verify(self) -> VerifyResult:
        prev = GENESIS_HASH
        for i, e in enumerate(self._events):
            if e.seq != i or e.prev_hash != prev or e.hash != self._digest(e):
                return VerifyResult(False, i)
            prev = e.hash
        return VerifyResult(True)
