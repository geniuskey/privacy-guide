"""외부 LLM 전송 데이터 필터링.

1) 허용 목록: 작업에 필요한 필드만 고른다(블록리스트는 새 필드가 생기면 새어 나간다).
2) 비정형 텍스트 안의 개인정보는 라벨 토큰으로 치환한다([EMAIL], [PHONE] 등).
3) 최종 프롬프트를 다시 검사해 남은 패턴이 있으면 전송을 차단한다(fail closed).
4) 전송 사실(필드 목록·치환 건수)을 감사로그에 남긴다. 프롬프트 원문은 남기지 않는다.

정규식은 이름·주소 같은 자유 형식 개인정보를 완전히 잡지 못한다. 이름·주소 필드는
허용 목록에서 빼는 방식으로 막고, 필요하면 NER 기반 탐지나 가명처리를 추가한다.
외부 LLM 사용은 국외이전·처리위탁 고지, 학습 사용 여부(옵트아웃) 계약 확인이 별도로 필요하다.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol

from .audit_log import AuditLog
from .log_masking import PII_PATTERNS


class LLMClient(Protocol):
    def complete(self, prompt: str) -> str: ...


class BlockedPayloadError(Exception):
    pass


@dataclass
class RecordingLLMClient:
    """오프라인 가짜 클라이언트. 실제 전송 대신 프롬프트를 기록한다(테스트·데모용)."""

    prompts: list[str] = field(default_factory=list)

    def complete(self, prompt: str) -> str:
        self.prompts.append(prompt)
        return f"[요약] {len(prompt)}자 분량의 문의를 요약했습니다."


# 상담 티켓 요약 작업에 필요한 필드만 허용
TICKET_SUMMARY_FIELDS = ("category", "product", "message")

_LABELS = {"TOKEN": "[TOKEN]", "EMAIL": "[EMAIL]", "RRN": "[RRN]", "CARD": "[CARD]", "PHONE": "[PHONE]"}


def redact_for_llm(text: str) -> tuple[str, int]:
    count = 0
    for label, pattern, _ in PII_PATTERNS:
        text, n = pattern.subn(_LABELS[label], text)
        count += n
    return text, count


def contains_pii(text: str) -> bool:
    return any(p.search(text) for _, p, _ in PII_PATTERNS)


def build_payload(source: dict[str, Any], allowed_fields: tuple[str, ...]) -> tuple[dict[str, str], int]:
    payload: dict[str, str] = {}
    total = 0
    for name in allowed_fields:
        if name in source and source[name] is not None:
            payload[name], n = redact_for_llm(str(source[name]))
            total += n
    return payload, total


class SafeLLMGateway:
    def __init__(self, client: LLMClient, audit: AuditLog) -> None:
        self._client = client
        self._audit = audit

    def summarize_ticket(self, actor_id: str, ticket: dict[str, Any]) -> str:
        payload, redactions = build_payload(ticket, TICKET_SUMMARY_FIELDS)
        prompt = "다음 고객 문의를 한 문장으로 요약하세요.\n" + "\n".join(f"{k}: {v}" for k, v in payload.items())
        if contains_pii(prompt):
            self._audit.record(actor_id, "llm.send", resource=f"ticket:{ticket.get('id')}", result="blocked")
            raise BlockedPayloadError("PII detected after redaction")
        self._audit.record(actor_id, "llm.send", resource=f"ticket:{ticket.get('id')}",
                           details={"fields": list(payload), "redactions": redactions})
        return self._client.complete(prompt)
