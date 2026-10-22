import { describe, expect, it } from "vitest";
import { createLogger, type LogEntry, maskText, maskValue } from "../src/logMasking.js";

describe("로그 마스킹", () => {
  it.each([
    ["메일 hong.gildong@example.co.kr", "메일 h***@example.co.kr"],
    ["전화 010-1234-5678", "전화 010-****-5678"],
    ["전화 01012345678", "전화 010-****-5678"],
    ["주민번호900101-1234567", "주민번호900101-1******"],
    ["카드 1234-5678-9012-3456", "카드 ****-****-****-3456"],
    ["Authorization: Bearer abc.DEF-123_xyz", "Authorization: Bearer [REDACTED]"],
  ])("%s", (raw, masked) => {
    expect(maskText(raw)).toBe(masked);
  });

  it("개인정보가 아닌 숫자는 유지", () => {
    expect(maskText("주문번호 20260101 금액 59000원")).toBe("주문번호 20260101 금액 59000원");
  });

  it("구조화 필드·민감 키·에러 객체 마스킹", () => {
    const out: LogEntry[] = [];
    const log = createLogger((e) => out.push(e));
    log.info("login a@b.com", {
      password: "hunter2", access_token: "t", ctx: { phone: "010-1111-2222" }, err: new Error("rrn 900101-1234567"),
    });
    const e = out[0]!;
    expect(e.msg).toBe("login a***@b.com");
    expect(e.password).toBe("[REDACTED]");
    expect(e.access_token).toBe("[REDACTED]");
    expect(e.ctx).toEqual({ phone: "010-****-2222" });
    expect(JSON.stringify(e)).not.toContain("1234567");
  });

  it("중첩 배열", () => {
    expect(maskValue({ items: [{ email: "x@y.com" }], Authorization: "Bearer z" }))
      .toEqual({ items: [{ email: "x***@y.com" }], Authorization: "[REDACTED]" });
  });
});
