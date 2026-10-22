import { beforeEach, describe, expect, it } from "vitest";
import { addMonths, adMessage, isNight, MarketingConsentService } from "../src/marketingConsent.js";

let now: Date;
let svc: MarketingConsentService;
const kst = (s: string) => new Date(`${s}+09:00`);

beforeEach(() => {
  now = kst("2026-03-02T12:00:00");
  svc = new MarketingConsentService("예시상점", () => now);
});

describe("광고성 정보 전송 게이트", () => {
  it("동의는 채널별이다", () => {
    expect(svc.canSend("u-1", "sms").allowed).toBe(false);
    svc.record("u-1", "email", "consent", "signup");
    expect(svc.canSend("u-1", "email").allowed).toBe(true);
    expect(svc.canSend("u-1", "sms").allowed).toBe(false);
  });

  it("야간 경계는 한국 시간 기준", () => {
    expect(isNight(kst("2026-03-02T21:00:00"))).toBe(true);
    expect(isNight(kst("2026-03-03T07:59:00"))).toBe(true);
    expect(isNight(kst("2026-03-03T08:00:00"))).toBe(false);
    expect(isNight(new Date("2026-03-02T12:30:00Z"))).toBe(true);
  });

  it("야간에는 별도 동의 필요, 이메일은 예외", () => {
    for (const ch of ["sms", "push", "email"] as const) svc.record("u-1", ch, "consent", "signup");
    const at = kst("2026-03-02T22:00:00");
    expect(svc.canSend("u-1", "sms", { at }).reason).toBe("야간(21시~08시) 별도 동의 없음");
    expect(svc.canSend("u-1", "push", { at }).allowed).toBe(false);
    expect(svc.canSend("u-1", "email", { at }).allowed).toBe(true);
    svc.record("u-1", "sms", "night_consent", "settings");
    expect(svc.canSend("u-1", "sms", { at }).allowed).toBe(true);
  });

  it("수신거부 후에는 거래관계 예외로도 보내지 않는다", () => {
    const transaction = { category: "커피 원두", endedOn: "2026-02-01" };
    expect(svc.canSend("u-1", "sms", { category: "커피 원두", transaction }).allowed).toBe(true);
    svc.record("u-1", "sms", "refuse", "unsubscribe_link");
    expect(svc.canSend("u-1", "sms", { category: "커피 원두", transaction }).allowed).toBe(false);
  });

  it("거래관계 예외는 같은 종류·6개월 이내만", () => {
    const tx = (endedOn: string, contactCollectedDirectly = true) => ({ category: "커피 원두", endedOn, contactCollectedDirectly });
    expect(svc.canSend("u-1", "sms", { category: "커피 원두", transaction: tx("2025-09-02") }).allowed).toBe(true);
    expect(svc.canSend("u-1", "sms", { category: "커피 원두", transaction: tx("2025-09-01") }).allowed).toBe(false);
    expect(svc.canSend("u-1", "sms", { category: "가전", transaction: tx("2026-01-01") }).allowed).toBe(false);
    expect(svc.canSend("u-1", "sms", { category: "커피 원두", transaction: tx("2026-01-01", false) }).allowed).toBe(false);
  });

  it("모든 의사표시에 14일 이내 결과 통지를 쌓는다", () => {
    const n = svc.record("u-1", "sms", "refuse", "unsubscribe_link");
    expect(n).toMatchObject({ expressedOn: "2026-03-02", due: "2026-03-16" });
    expect(n.result).toContain("예시상점");
  });

  it("2년마다 재확인, 기한이 지나면 보내지 않는다", () => {
    svc.record("u-1", "email", "consent", "signup");
    expect(svc.reconfirmDeadline("u-1", "email")).toBe("2028-03-02");
    now = kst("2028-03-02T12:00:00");
    expect(svc.canSend("u-1", "email").reason).toBe("수신동의 2년 재확인 기한 경과");
    svc.record("u-1", "email", "reconfirm", "reconfirm_mail");
    expect(svc.canSend("u-1", "email").allowed).toBe(true);
    expect(svc.reconfirmDeadline("u-1", "email")).toBe("2030-03-02");
  });

  it("말일 보정과 광고 명시사항", () => {
    expect(addMonths("2028-02-29", 24)).toBe("2030-02-28");
    const m = adMessage("예시상점", "02-000-0000", "봄 세일", "080-000-0000");
    expect(m.startsWith("(광고)")).toBe(true);
    expect(m).toContain("수신거부");
  });
});
