// 광고성 정보 전송 게이트: 채널별 수신동의, 야간 전송 제한, 수신동의 2년 재확인, 처리 결과 통지.
// 정보통신망법 제50조, 같은 법 시행령 제61조~제62조의3을 옮긴 예시.
// - 오후 9시~다음 날 오전 8시(한국 시간)는 별도 야간 동의 필요. 전자우편은 예외(시행령 제61조제2항).
// - 거래관계 예외는 거래 종료일부터 6개월 이내, 같은 종류의 재화등만.
// - 의사표시 후 14일 이내 처리 결과 통지, 동의일(최근 확인일)부터 2년마다 재확인.
// 앱 푸시의 매체 해당 여부, 재확인 후 기산점, "광고성 정보"의 범위는 법무 검토가 필요하다(review-required).
import { type Clock, systemClock } from "./domain.js";

export type Channel = "sms" | "email" | "push" | "phone";
export type Action = "consent" | "night_consent" | "refuse" | "reconfirm";

const NIGHT_EXEMPT: ReadonlySet<Channel> = new Set(["email"]);
const KST_OFFSET_MS = 9 * 3_600_000; // 한국은 일광절약시간이 없다
const RESULT_NOTICE_DAYS = 14;
const RECONFIRM_YEARS = 2;
const TRANSACTION_EXEMPTION_MONTHS = 6;

/** 한국 날짜 "YYYY-MM-DD" */
export const kstDate = (at: Date) => new Date(at.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);

export function isNight(at: Date): boolean {
  const h = new Date(at.getTime() + KST_OFFSET_MS).getUTCHours();
  return h >= 21 || h < 8;
}

/** "YYYY-MM-DD"에 개월 수를 더한다(말일 보정). */
export function addMonths(day: string, months: number): string {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  const total = m - 1 + months;
  const ny = y + Math.floor(total / 12);
  const nm = total % 12;
  const last = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return new Date(Date.UTC(ny, nm, Math.min(d, last))).toISOString().slice(0, 10);
}

const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

interface ChannelConsent { consented: boolean; night: boolean; consentedOn: string | null }
export interface ConsentEvent { userId: string; channel: Channel; action: Action; at: Date; source: string }
export interface ResultNotice { userId: string; channel: Channel; action: Action; expressedOn: string; result: string; due: string }
export interface Transaction { category: string; endedOn: string; contactCollectedDirectly?: boolean }
export interface Decision { allowed: boolean; reason: string }

export class MarketingConsentService {
  private consents = new Map<string, ChannelConsent>();
  readonly events: ConsentEvent[] = [];
  readonly notices: ResultNotice[] = [];

  constructor(private readonly senderName: string, private readonly clock: Clock = systemClock) {}

  private get(userId: string, channel: Channel): ChannelConsent {
    const k = `${userId}\0${channel}`;
    let c = this.consents.get(k);
    if (!c) this.consents.set(k, (c = { consented: false, night: false, consentedOn: null }));
    return c;
  }

  record(userId: string, channel: Channel, action: Action, source: string): ResultNotice {
    const now = this.clock();
    const today = kstDate(now);
    const c = this.get(userId, channel);
    let result: string;
    switch (action) {
      case "consent":
        Object.assign(c, { consented: true, consentedOn: today });
        result = "수신동의 처리";
        break;
      case "night_consent":
        if (!c.consented) throw new Error("야간 수신동의는 수신동의 뒤에 받는다");
        c.night = true;
        result = "야간(21시~08시) 수신동의 처리";
        break;
      case "reconfirm":
        if (!c.consented) throw new Error("동의하지 않은 수신자는 재확인 대상이 아니다");
        c.consentedOn = today;
        result = "수신동의 유지 처리";
        break;
      case "refuse":
        Object.assign(c, { consented: false, night: false, consentedOn: null });
        result = "수신거부(동의 철회) 처리";
    }
    this.events.push({ userId, channel, action, at: now, source });
    const notice = { userId, channel, action, expressedOn: today, result: `${this.senderName}: ${result}`,
      due: addDays(today, RESULT_NOTICE_DAYS) };
    this.notices.push(notice);
    return notice;
  }

  /** 이 날짜 전까지 수신동의 여부를 확인해야 한다. */
  reconfirmDeadline(userId: string, channel: Channel): string | null {
    const c = this.get(userId, channel);
    return c.consented && c.consentedOn ? addMonths(c.consentedOn, RECONFIRM_YEARS * 12) : null;
  }

  canSend(userId: string, channel: Channel, opts: { category?: string; transaction?: Transaction; at?: Date } = {}): Decision {
    const at = opts.at ?? this.clock();
    const today = kstDate(at);
    const c = this.get(userId, channel);
    const refused = this.events.some((e) => e.userId === userId && e.channel === channel && e.action === "refuse");
    let basis: string;
    if (c.consented) {
      const deadline = this.reconfirmDeadline(userId, channel);
      if (deadline && today >= deadline) return { allowed: false, reason: "수신동의 2년 재확인 기한 경과" };
      basis = "수신동의";
    } else if (refused) {
      return { allowed: false, reason: "수신거부 또는 동의 철회" };
    } else if (opts.transaction && (opts.transaction.contactCollectedDirectly ?? true)
      && opts.category === opts.transaction.category
      && today <= addMonths(opts.transaction.endedOn, TRANSACTION_EXEMPTION_MONTHS)) {
      basis = "거래관계 예외(같은 종류, 거래 종료 후 6개월 이내)";
    } else {
      return { allowed: false, reason: "수신동의 없음" };
    }
    if (isNight(at) && !NIGHT_EXEMPT.has(channel) && !c.night) return { allowed: false, reason: "야간(21시~08시) 별도 동의 없음" };
    return { allowed: true, reason: basis };
  }
}

/** 제50조제4항 명시사항. "(광고)" 표기 등 구체 형식은 시행령 별표 6 확인 필요(review-required). */
export const adMessage = (senderName: string, contact: string, body: string, unsubscribe: string) =>
  `(광고) ${body}\n${senderName} ${contact}\n수신거부: ${unsubscribe}`;
