import pytest

from kr_privacy_examples.audit_log import AuditLog
from kr_privacy_examples.llm_filter import (
    BlockedPayloadError, RecordingLLMClient, SafeLLMGateway, build_payload, redact_for_llm,
)
from kr_privacy_examples.log_masking import PII_PATTERNS

TICKET = {
    "id": "t-9", "category": "환불", "product": "모니터",
    "message": "환불 계좌 확인 부탁. 카드 1234 5678 9012 3456, 연락처 01098765432, 메일 kim@corp.kr, 주민 850505-2345678",
    "customer_name": "홍길동", "customer_address": "서울시 종로구 1", "internal_notes": "환불 남용 의심",
}


def test_allowlist_drops_unlisted_fields():
    payload, _ = build_payload(TICKET, ("category", "message"))
    assert set(payload) == {"category", "message"}


def test_redaction_tokens():
    text, n = redact_for_llm(TICKET["message"])
    assert n == 4
    assert "[CARD]" in text and "[PHONE]" in text and "[EMAIL]" in text and "[RRN]" in text


def test_fake_client_receives_no_pii(clock):
    fake = RecordingLLMClient()
    gw = SafeLLMGateway(fake, AuditLog(clock))
    gw.summarize_ticket("u-support", TICKET)
    prompt = fake.prompts[-1]
    for secret in ["홍길동", "종로구", "환불 남용", "kim@corp.kr", "01098765432", "850505", "3456"]:
        assert secret not in prompt
    assert not any(p.search(prompt) for _, p, _ in PII_PATTERNS)


def test_fail_closed_when_pii_survives(clock, monkeypatch):
    import kr_privacy_examples.llm_filter as mod
    monkeypatch.setattr(mod, "redact_for_llm", lambda t: (t, 0))  # 치환이 고장난 상황
    fake = RecordingLLMClient()
    audit = AuditLog(clock)
    with pytest.raises(BlockedPayloadError):
        SafeLLMGateway(fake, audit).summarize_ticket("u-support", TICKET)
    assert fake.prompts == []
    assert audit.events(action="llm.send")[-1].result == "blocked"


def test_endpoint_with_rbac(login, llm, app):
    assert login("alice@example.com").post("/support/tickets/t-1/summary").status_code == 403
    r = login("support@example.com").post("/support/tickets/t-1/summary")
    assert r.status_code == 200
    assert "alice@example.com" not in llm.prompts[-1] and "김앨리스" not in llm.prompts[-1]
    sent = app.state.container.audit.events(action="llm.send")[-1]
    assert sent.details == {"fields": ["category", "product", "message"], "redactions": 2}
