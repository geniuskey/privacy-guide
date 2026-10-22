"""광고성 정보 전송 게이트: 채널별 수신동의, 야간 전송 제한, 수신동의 2년 재확인, 처리 결과 통지.

정보통신망법 제50조와 같은 법 시행령 제61조~제62조의3을 코드로 옮긴 예시다.
- 채널(SMS·이메일·앱 푸시·전화)마다 수신동의 상태를 따로 저장하고, 모든 변경을 이력으로 남긴다.
- 오후 9시~다음 날 오전 8시(한국 시간)에는 별도 야간 동의가 있어야 보낸다. 시행령이 정한 매체(전자우편)는 예외.
- 거래관계 예외(제50조제1항제1호)는 거래 종료일부터 6개월 이내, 같은 종류의 재화등일 때만 인정한다.
- 수신동의·거부·철회 의사를 받으면 14일 이내 처리 결과를 알리고, 동의일(최근 확인일)부터 2년마다 동의 여부를 확인한다.

앱 푸시가 "전자적 전송매체"에 해당하는지, 재확인 후 2년을 어디서부터 다시 셀지, 무엇이 "광고성 정보"인지는
법무 검토로 확정해야 한다(review-required). 이 모듈은 보수적인 쪽을 기본값으로 택한다.
"""

from __future__ import annotations

import calendar
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta
from enum import StrEnum
from zoneinfo import ZoneInfo

from .domain import Clock, utc_now

KST = ZoneInfo("Asia/Seoul")
NIGHT_START, NIGHT_END = time(21, 0), time(8, 0)
TRANSACTION_EXEMPTION_MONTHS = 6  # 시행령 제61조제1항
RESULT_NOTICE_DAYS = 14  # 시행령 제62조의2
RECONFIRM_YEARS = 2  # 시행령 제62조의3제1항


class Channel(StrEnum):
    SMS = "sms"
    EMAIL = "email"
    PUSH = "push"
    PHONE = "phone"


NIGHT_EXEMPT_CHANNELS = frozenset({Channel.EMAIL})  # 시행령 제61조제2항: 전자우편


class Action(StrEnum):
    CONSENT = "consent"
    NIGHT_CONSENT = "night_consent"
    REFUSE = "refuse"  # 수신거부·수신동의 철회
    RECONFIRM = "reconfirm"


def add_years(d: date, years: int) -> date:
    y = d.year + years
    return d.replace(year=y, day=min(d.day, calendar.monthrange(y, d.month)[1]))


def add_months(d: date, months: int) -> date:
    total = d.month - 1 + months
    y, m = d.year + total // 12, total % 12 + 1
    return date(y, m, min(d.day, calendar.monthrange(y, m)[1]))


def is_night(at: datetime) -> bool:
    t = at.astimezone(KST).time()
    return t >= NIGHT_START or t < NIGHT_END


@dataclass
class ChannelConsent:
    consented: bool = False
    night: bool = False
    consented_on: date | None = None  # 최초 동의일 또는 최근 재확인일(KST)


@dataclass(frozen=True)
class ConsentEvent:
    user_id: str
    channel: Channel
    action: Action
    at: datetime
    source: str  # 예: "signup_form_v3", "unsubscribe_link", "reconfirm_mail"


@dataclass(frozen=True)
class ResultNotice:
    """시행령 제62조의2 각 호: 전송자 명칭, 의사표시 사실과 날짜, 처리 결과."""

    user_id: str
    channel: Channel
    action: Action
    expressed_on: date
    result: str
    due: date


@dataclass(frozen=True)
class Transaction:
    category: str  # 재화등의 종류
    ended_on: date
    contact_collected_directly: bool = True


@dataclass(frozen=True)
class Decision:
    allowed: bool
    reason: str


@dataclass
class ConsentStore:
    sender_name: str
    consents: dict[tuple[str, Channel], ChannelConsent] = field(default_factory=dict)
    events: list[ConsentEvent] = field(default_factory=list)
    notices: list[ResultNotice] = field(default_factory=list)


class MarketingConsentService:
    def __init__(self, store: ConsentStore, clock: Clock = utc_now) -> None:
        self.store, self._clock = store, clock

    def _get(self, user_id: str, channel: Channel) -> ChannelConsent:
        return self.store.consents.setdefault((user_id, channel), ChannelConsent())

    def record(self, user_id: str, channel: Channel, action: Action, *, source: str) -> ResultNotice:
        now = self._clock()
        today = now.astimezone(KST).date()
        c = self._get(user_id, channel)
        if action is Action.CONSENT:
            c.consented, c.consented_on = True, today
            result = "수신동의 처리"
        elif action is Action.NIGHT_CONSENT:
            if not c.consented:
                raise ValueError("야간 수신동의는 수신동의 뒤에 받는다")
            c.night = True
            result = "야간(21시~08시) 수신동의 처리"
        elif action is Action.RECONFIRM:
            if not c.consented:
                raise ValueError("동의하지 않은 수신자는 재확인 대상이 아니다")
            c.consented_on = today
            result = "수신동의 유지 처리"
        else:
            c.consented, c.night, c.consented_on = False, False, None
            result = "수신거부(동의 철회) 처리"
        self.store.events.append(ConsentEvent(user_id, channel, action, now, source))
        notice = ResultNotice(user_id, channel, action, today, f"{self.store.sender_name}: {result}",
                              due=today + timedelta(days=RESULT_NOTICE_DAYS))
        self.store.notices.append(notice)
        return notice

    def reconfirm_deadline(self, user_id: str, channel: Channel) -> date | None:
        """이 날짜 전까지 수신동의 여부를 확인해야 한다."""
        c = self._get(user_id, channel)
        return add_years(c.consented_on, RECONFIRM_YEARS) if c.consented and c.consented_on else None

    def due_for_reconfirm(self, within_days: int = 30) -> list[tuple[str, Channel, date]]:
        """기한이 within_days 안에 오는 동의 목록. 확인 안내 발송 배치가 사용한다."""
        today = self._clock().astimezone(KST).date()
        out = []
        for (user_id, channel) in self.store.consents:
            deadline = self.reconfirm_deadline(user_id, channel)
            if deadline and deadline - today <= timedelta(days=within_days):
                out.append((user_id, channel, deadline))
        return sorted(out, key=lambda x: x[2])

    def can_send(self, user_id: str, channel: Channel, *, category: str | None = None,
                 transaction: Transaction | None = None, at: datetime | None = None) -> Decision:
        at = at or self._clock()
        today = at.astimezone(KST).date()
        c = self._get(user_id, channel)
        refused = any(e.user_id == user_id and e.channel == channel and e.action is Action.REFUSE
                      for e in self.store.events)

        if c.consented:
            deadline = self.reconfirm_deadline(user_id, channel)
            if deadline and today >= deadline:
                return Decision(False, "수신동의 2년 재확인 기한 경과")
            basis = "수신동의"
        elif refused:
            # 제50조제2항: 거래관계 예외로 보내던 경우에도 수신거부 후에는 보내지 않는다
            return Decision(False, "수신거부 또는 동의 철회")
        elif (transaction and transaction.contact_collected_directly and category == transaction.category
              and today <= add_months(transaction.ended_on, TRANSACTION_EXEMPTION_MONTHS)):
            basis = "거래관계 예외(같은 종류, 거래 종료 후 6개월 이내)"
        else:
            return Decision(False, "수신동의 없음")

        if is_night(at) and channel not in NIGHT_EXEMPT_CHANNELS and not c.night:
            return Decision(False, "야간(21시~08시) 별도 동의 없음")
        return Decision(True, basis)


def ad_message(sender_name: str, contact: str, body: str, unsubscribe: str) -> str:
    """제50조제4항 명시사항(전송자 명칭·연락처, 수신거부 방법)을 붙인다.

    "(광고)" 표기 위치 등 구체 형식은 시행령 별표 6을 원문으로 확인해야 한다(review-required).
    """
    return f"(광고) {body}\n{sender_name} {contact}\n수신거부: {unsubscribe}"
