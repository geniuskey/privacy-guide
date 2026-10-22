import { beforeEach, describe, expect, it } from "vitest";
import { AuditLog } from "../src/auditLog.js";
import { PermissionDeniedError } from "../src/domain.js";
import {
  addPeriod, RecordStore, RetentionPolicy, RetentionService, runPurge, SeparatedStore, type StoredRecord,
} from "../src/retention.js";
import { DAY, FakeClock } from "./helpers.js";

let clock: FakeClock;
let svc: RetentionService;
const rec = (id: string, recordType: string): StoredRecord =>
  ({ id, recordType, userId: "u-1", data: { v: 1 }, createdAt: clock.fn(), retentionStart: null });

beforeEach(() => {
  clock = new FakeClock();
  svc = new RetentionService(new RecordStore(), new SeparatedStore(), new RetentionPolicy(), new AuditLog(clock.fn), clock.fn);
});

describe("보존기간·분리보관", () => {
  it("말일 보정", () => {
    expect(addPeriod(new Date("2024-02-29T00:00:00Z"), { years: 1 }).toISOString()).toBe("2025-02-28T00:00:00.000Z");
    expect(addPeriod(new Date("2026-01-31T00:00:00Z"), { months: 1 }).toISOString()).toBe("2026-02-28T00:00:00.000Z");
  });

  it("이용 중인 데이터는 파기하지 않음", () => {
    svc.active.add(rec("chat", "support_chat"));
    clock.advance(3650 * DAY);
    expect(runPurge(svc, clock.fn).purged).toEqual([]);
  });

  it("목적 종료: 법정 보존은 분리, 나머지는 파기, 미분류는 보류", () => {
    for (const [id, t] of [["pay", "payment_record"], ["mkt", "marketing_profile"], ["chat", "support_chat"], ["x", "unknown"]] as const)
      svc.active.add(rec(id, t));
    const r = svc.endPurposeForUser("u-1");
    expect(r.separated).toEqual(["pay"]);
    expect(r.deleted.sort()).toEqual(["chat", "mkt"]);
    expect(r.unclassified).toEqual(["x"]);
    expect(svc.separated.has("pay") && !svc.active.has("pay")).toBe(true);
    expect(svc.active.has("x")).toBe(true);
  });

  it("보존기간 경과 후 파기 + 감사 + 멱등", () => {
    svc.active.add(rec("pay", "payment_record"));
    svc.active.add(rec("log", "login_log"));
    svc.endPurposeForUser("u-1");
    clock.advance(89 * DAY);
    expect(runPurge(svc, clock.fn).purged).toEqual([]);
    clock.advance(3 * DAY);
    expect(runPurge(svc, clock.fn).purged).toEqual(["log"]);
    clock.now = addPeriod(clock.now, { years: 5 });
    expect(runPurge(svc, clock.fn).purged).toEqual(["pay"]);
    expect(runPurge(svc, clock.fn).purged).toEqual([]);
    const purges = svc.audit.events({ action: "retention.purge" });
    expect(purges.map((e) => e.resource)).toEqual(["record:log", "record:pay"]);
  });

  it("분리보관 데이터는 허용 목적 외 열람 불가", () => {
    svc.active.add(rec("pay", "payment_record"));
    svc.endPurposeForUser("u-1");
    expect(() => svc.separated.read("pay", { purpose: "marketing", actorId: "x", audit: svc.audit })).toThrow(PermissionDeniedError);
    expect(svc.separated.read("pay", { purpose: "dispute", actorId: "x", audit: svc.audit }).id).toBe("pay");
  });
});
