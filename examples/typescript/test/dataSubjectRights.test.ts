import { beforeEach, describe, expect, it } from "vitest";
import { AuditLog } from "../src/auditLog.js";
import { DataSubjectRightsService } from "../src/dataSubjectRights.js";
import { PermissionDeniedError } from "../src/domain.js";
import { RecordStore, RetentionPolicy, RetentionService, SeparatedStore } from "../src/retention.js";
import { SessionManager } from "../src/session.js";
import { FakeClock, seed } from "./helpers.js";

let clock: FakeClock;
let ctx: ReturnType<typeof seed>;
let audit: AuditLog;
let retention: RetentionService;
let sessions: SessionManager;
let dsr: DataSubjectRightsService;
const alice = { userId: "u-alice", roles: ["customer"] };

beforeEach(() => {
  clock = new FakeClock();
  ctx = seed(clock);
  audit = new AuditLog(clock.fn);
  retention = new RetentionService(new RecordStore(), new SeparatedStore(), new RetentionPolicy(), audit, clock.fn);
  sessions = new SessionManager(clock.fn);
  dsr = new DataSubjectRightsService(ctx.users, ctx.orders, retention, audit, clock.fn, (id) => sessions.revokeAll(id));
  const base = { userId: "u-alice", createdAt: clock.fn(), retentionStart: null };
  retention.active.add({ ...base, id: "r-chat", recordType: "support_chat", data: { text: "배송 문의" } });
  retention.active.add({ ...base, id: "r-pay", recordType: "payment_record", data: { amount: 59000 } });
  retention.active.add({ ...base, id: "r-mkt", recordType: "marketing_profile", data: { segment: "gadget" } });
});

describe("정보주체 권리", () => {
  it("본인 데이터 JSON 내보내기 (내부 필드 제외)", () => {
    const json = dsr.export(alice, "u-alice");
    const data = JSON.parse(json);
    expect(data.profile.email).toBe("alice@example.com");
    expect(data.orders.map((o: { id: string }) => o.id)).toEqual(["o-1"]);
    expect(data.records).toHaveLength(3);
    expect(json).not.toContain("passwordHash");
    expect(json).not.toContain("900101-1234567");
    expect(audit.events({ action: "dsr.export" })).toHaveLength(1);
  });

  it("타인 데이터 요청 거부", () => {
    const bob = { userId: "u-bob", roles: ["customer"] };
    expect(() => dsr.export(bob, "u-alice")).toThrow(PermissionDeniedError);
    expect(() => dsr.delete(bob, "u-alice")).toThrow(PermissionDeniedError);
  });

  it("삭제 요청: 파기 + 법정 보존 분리 + 세션 폐기 + 감사", () => {
    const token = sessions.create("u-alice");
    const r = dsr.delete(alice, "u-alice", "서비스 탈퇴");
    expect(r.deletedRecords).toBe(2);
    expect(r.retained.map((x) => x.recordType).sort()).toEqual(["contract_record", "payment_record"]);
    expect(r.sessionsRevoked).toBe(1);
    expect(sessions.get(token)).toBeNull();
    expect(ctx.users.get("u-alice")).toBeUndefined();
    expect(ctx.orders.listByOwner("u-alice")).toEqual([]);
    expect(retention.active.forUser("u-alice")).toEqual([]);
    const contract = retention.separated.forUser("u-alice").find((x) => x.recordType === "contract_record")!;
    expect(contract.data).not.toHaveProperty("shippingAddress");
    expect(audit.events({ subjectId: "u-alice" }).map((e) => e.action)).toContain("dsr.delete");
    expect(audit.verify().ok).toBe(true);
  });
});
