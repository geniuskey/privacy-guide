from datetime import date, datetime, timezone

import pytest

from kr_privacy_examples.marketing_consent import (
    KST, Action, Channel, ConsentStore, MarketingConsentService, Transaction, ad_message, add_years, is_night,
)


@pytest.fixture
def svc(clock):
    clock.now = datetime(2026, 3, 2, 3, 0, tzinfo=timezone.utc)  # KST 12:00
    return MarketingConsentService(ConsentStore(sender_name="예시상점"), clock)


def kst(*args) -> datetime:
    return datetime(*args, tzinfo=KST)


def test_no_consent_no_send(svc):
    assert not svc.can_send("u-1", Channel.SMS).allowed


def test_consent_is_per_channel(svc):
    svc.record("u-1", Channel.EMAIL, Action.CONSENT, source="signup")
    assert svc.can_send("u-1", Channel.EMAIL).allowed
    assert not svc.can_send("u-1", Channel.SMS).allowed


def test_night_hours_boundaries_in_kst():
    assert is_night(kst(2026, 3, 2, 21, 0))
    assert is_night(kst(2026, 3, 3, 7, 59))
    assert not is_night(kst(2026, 3, 3, 8, 0))
    assert not is_night(kst(2026, 3, 2, 20, 59))
    assert is_night(datetime(2026, 3, 2, 12, 30, tzinfo=timezone.utc))  # UTC 12:30 = KST 21:30


def test_night_send_needs_separate_consent_except_email(svc):
    for ch in (Channel.SMS, Channel.PUSH, Channel.EMAIL):
        svc.record("u-1", ch, Action.CONSENT, source="signup")
    night = kst(2026, 3, 2, 22, 0)
    assert svc.can_send("u-1", Channel.SMS, at=night).reason == "야간(21시~08시) 별도 동의 없음"
    assert not svc.can_send("u-1", Channel.PUSH, at=night).allowed
    assert svc.can_send("u-1", Channel.EMAIL, at=night).allowed  # 시행령 제61조제2항
    svc.record("u-1", Channel.SMS, Action.NIGHT_CONSENT, source="settings")
    assert svc.can_send("u-1", Channel.SMS, at=night).allowed


def test_night_consent_requires_base_consent(svc):
    with pytest.raises(ValueError):
        svc.record("u-1", Channel.SMS, Action.NIGHT_CONSENT, source="settings")


def test_refusal_stops_sending_and_clears_night_consent(svc):
    svc.record("u-1", Channel.SMS, Action.CONSENT, source="signup")
    svc.record("u-1", Channel.SMS, Action.NIGHT_CONSENT, source="settings")
    svc.record("u-1", Channel.SMS, Action.REFUSE, source="unsubscribe_link")
    assert svc.can_send("u-1", Channel.SMS).reason == "수신거부 또는 동의 철회"
    assert svc.store.consents[("u-1", Channel.SMS)].night is False


def test_every_change_queues_result_notice_within_14_days(svc):
    n = svc.record("u-1", Channel.SMS, Action.REFUSE, source="unsubscribe_link")
    assert n.expressed_on == date(2026, 3, 2) and n.due == date(2026, 3, 16)
    assert "예시상점" in n.result and "수신거부" in n.result
    assert [e.source for e in svc.store.events] == ["unsubscribe_link"]


def test_transaction_exemption_same_category_within_six_months(svc):
    tx = Transaction(category="커피 원두", ended_on=date(2025, 9, 2))
    assert svc.can_send("u-1", Channel.SMS, category="커피 원두", transaction=tx).allowed  # 3/2 = 6개월째 당일
    assert not svc.can_send("u-1", Channel.SMS, category="가전", transaction=tx).allowed
    assert not svc.can_send("u-1", Channel.SMS, category="커피 원두",
                            transaction=Transaction("커피 원두", date(2025, 9, 1))).allowed
    assert not svc.can_send("u-1", Channel.SMS, category="커피 원두",
                            transaction=Transaction("커피 원두", date(2026, 1, 1), contact_collected_directly=False)).allowed


def test_refusal_overrides_transaction_exemption(svc):
    svc.record("u-1", Channel.SMS, Action.REFUSE, source="unsubscribe_link")
    tx = Transaction(category="커피 원두", ended_on=date(2026, 2, 1))
    assert not svc.can_send("u-1", Channel.SMS, category="커피 원두", transaction=tx).allowed


def test_reconfirm_every_two_years(svc, clock):
    svc.record("u-1", Channel.EMAIL, Action.CONSENT, source="signup")
    assert svc.reconfirm_deadline("u-1", Channel.EMAIL) == date(2028, 3, 2)

    clock.now = datetime(2028, 2, 10, 3, 0, tzinfo=timezone.utc)
    assert svc.due_for_reconfirm(within_days=30) == [("u-1", Channel.EMAIL, date(2028, 3, 2))]
    assert svc.can_send("u-1", Channel.EMAIL).allowed

    clock.now = datetime(2028, 3, 2, 3, 0, tzinfo=timezone.utc)
    assert svc.can_send("u-1", Channel.EMAIL).reason == "수신동의 2년 재확인 기한 경과"

    svc.record("u-1", Channel.EMAIL, Action.RECONFIRM, source="reconfirm_mail")
    assert svc.can_send("u-1", Channel.EMAIL).allowed
    assert svc.reconfirm_deadline("u-1", Channel.EMAIL) == date(2030, 3, 2)


def test_leap_day_consent_deadline():
    assert add_years(date(2028, 2, 29), 2) == date(2030, 2, 28)


def test_ad_message_has_required_parts():
    m = ad_message("예시상점", "02-000-0000", "봄 세일", "080-000-0000")
    assert m.startswith("(광고)") and "예시상점" in m and "수신거부" in m
