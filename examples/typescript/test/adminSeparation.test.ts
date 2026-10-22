import { beforeEach, describe, expect, it } from "vitest";
import { AdminService, BreakGlassService, PiiAccessService, PiiGrantRegistry } from "../src/adminSeparation.js";
import { AuditLog } from "../src/auditLog.js";
import { PermissionDeniedError } from "../src/domain.js";
import type { Principal } from "../src/rbac.js";
import { FakeClock, HOUR, MIN, seed } from "./helpers.js";

let clock: FakeClock;
let audit: AuditLog;
let ctx: ReturnType<typeof seed>;
let grants: PiiGrantRegistry;
let bg: BreakGlassService;
let pii: PiiAccessService;
let admin: AdminService;

const ADMIN: Principal = { userId: "u-admin", roles: ["system_admin"] };
const OFFICER: Principal = { userId: "u-officer", roles: ["privacy_officer"] };

beforeEach(() => {
  clock = new FakeClock();
  audit = new AuditLog(clock.fn);
  ctx = seed(clock);
  grants = new PiiGrantRegistry(audit);
  bg = new BreakGlassService(audit, clock.fn);
  pii = new PiiAccessService(ctx.users, bg, audit);
  admin = new AdminService(ctx.users, audit);
});

describe("관리자 권한과 열람 권한 분리", () => {
  it("관리자는 사용자 목록을 관리하되 개인정보 원문은 보지 못한다", () => {
    const json = JSON.stringify(admin.listUsers(ADMIN));
    expect(json).not.toContain("alice@example.com");
    expect(json).not.toContain("010-1111-2222");
    expect(json).toContain("a***@example.com");
  });

  it("grant 없이 PII 열람 불가 + 거부 기록", () => {
    expect(() => pii.readPii(ADMIN, "u-alice")).toThrow(PermissionDeniedError);
    expect(audit.events({ action: "pii.read" })[0]?.result).toBe("denied");
  });

  it("별도 grant 로 열람 가능, 자기 부여·관리자 부여 금지", () => {
    expect(() => grants.grantPiiRead(OFFICER, "u-officer", "self")).toThrow(PermissionDeniedError);
    expect(() => grants.grantPiiRead(ADMIN, "u-bob", "x")).toThrow(PermissionDeniedError);
    grants.grantPiiRead(OFFICER, "u-admin", "분쟁 대응 담당 지정");
    const p = { ...ADMIN, grants: grants.grantsFor("u-admin") };
    const view = pii.readPii(p, "u-alice", "분쟁 처리");
    expect(view.email).toBe("alice@example.com");
    expect(Object.keys(view)).not.toContain("residentNumber");
  });

  it("권한 상승 차단: 보호 역할 부여·자기 역할 변경 금지", () => {
    expect(() => admin.assignRoles(ADMIN, "u-bob", ["privacy_officer"])).toThrow(PermissionDeniedError);
    expect(() => admin.assignRoles(ADMIN, "u-admin", ["support"])).toThrow(PermissionDeniedError);
    expect(admin.assignRoles(ADMIN, "u-bob", ["support"]).roles).toEqual(["support"]);
  });

  it("break-glass: 사유 필수, 대상 한정, 시간 만료, 감사", () => {
    expect(() => bg.open(ADMIN, "u-alice", "급함", 10 * MIN)).toThrow(RangeError);
    expect(() => bg.open(ADMIN, "u-alice", "장애 티켓 INC-123 본인 확인", 2 * HOUR)).toThrow(RangeError);
    bg.open(ADMIN, "u-alice", "장애 티켓 INC-123 본인 확인", 10 * MIN);
    expect(pii.readPii(ADMIN, "u-alice").accessVia).toBe("break_glass");
    expect(() => pii.readPii(ADMIN, "u-bob")).toThrow(PermissionDeniedError);
    clock.advance(11 * MIN);
    expect(() => pii.readPii(ADMIN, "u-alice")).toThrow(PermissionDeniedError);
    expect(audit.events({ action: "break_glass.open" })[0]?.reason).toContain("INC-123");
    expect(audit.events({ action: "pii.read" }).map((e) => e.result)).toEqual(["success", "denied", "denied"]);
  });
});
