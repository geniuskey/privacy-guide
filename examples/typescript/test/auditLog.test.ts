import { describe, expect, it } from "vitest";
import { type AuditEvent, AuditLog } from "../src/auditLog.js";
import { FakeClock } from "./helpers.js";

class TamperableLog extends AuditLog {
  tamper(i: number, patch: Partial<AuditEvent>): void { this.entries[i] = { ...this.entries[i]!, ...patch }; }
  drop(i: number): void { this.entries.splice(i, 1); }
}

function make(key?: Buffer) {
  const log = new TamperableLog(new FakeClock().fn, key);
  log.record({ actorId: "u-admin", action: "pii.read", subjectId: "u-alice", resource: "user:u-alice", reason: "CS 문의 #1" });
  log.record({ actorId: "u-admin", action: "role.assign", subjectId: "u-bob", details: { after: ["support"] } });
  log.record({ actorId: "u-alice", action: "dsr.export", subjectId: "u-alice" });
  return log;
}

describe("감사로그", () => {
  it("누가/언제/무엇을/누구/왜", () => {
    const e = make().events()[0]!;
    expect([e.actorId, e.action, e.subjectId, e.reason]).toEqual(["u-admin", "pii.read", "u-alice", "CS 문의 #1"]);
    expect(e.timestamp).toBe("2026-01-01T09:00:00.000Z");
    expect(Object.isFrozen(e)).toBe(true);
  });

  it("해시 체인 검증 (HMAC 포함)", () => {
    expect(make().verify().ok).toBe(true);
    expect(make(Buffer.from("kms-key")).verify().ok).toBe(true);
  });

  it("변조·삭제 탐지", () => {
    const a = make();
    a.tamper(1, { subjectId: "u-carol" });
    expect(a.verify()).toEqual({ ok: false, brokenAt: 1 });
    const b = make();
    b.drop(1);
    expect(b.verify().brokenAt).toBe(1);
  });

  it("사유·상세의 개인정보는 마스킹", () => {
    const e = new AuditLog().record({ actorId: "u", action: "x", reason: "고객 010-1234-5678 요청",
      details: { email: "a@b.com", password: "p" } });
    expect(e.reason).toBe("고객 010-****-5678 요청");
    expect(e.details).toEqual({ email: "a***@b.com", password: "[REDACTED]" });
  });
});
