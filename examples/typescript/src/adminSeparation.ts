// 관리자 권한과 데이터 열람 권한 분리.
// - system_admin: 계정·역할 관리 가능, 개인정보 원문 열람 불가.
// - pii:read 는 privacy_officer 가 "타인에게만" 부여(자기 부여 금지). 보호 역할은 admin 이 부여 불가.
// - break-glass: 사유 필수·대상 1명·시간 제한·전 과정 감사로그.
import { randomBytes } from "node:crypto";
import type { AuditLog } from "./auditLog.js";
import { type Clock, NotFoundError, PermissionDeniedError, systemClock, type UserStore } from "./domain.js";
import { type AdminUserView, type PiiView, toAdminView } from "./minimalResponse.js";
import { hasPermission, Permission, type Principal, Role, ROLE_PERMISSIONS } from "./rbac.js";

export const PROTECTED_ROLES: readonly string[] = [Role.PrivacyOfficer];

export class PiiGrantRegistry {
  private grants = new Map<string, Set<Permission>>();
  constructor(private readonly audit: AuditLog) {}

  grantPiiRead(granter: Principal, granteeId: string, reason: string): void {
    if (!hasPermission(granter, Permission.PiiGrant)) throw new PermissionDeniedError("pii:grant required");
    if (granter.userId === granteeId) throw new PermissionDeniedError("self-grant not allowed");
    if (!reason.trim()) throw new Error("reason required");
    const set = this.grants.get(granteeId) ?? new Set();
    set.add(Permission.PiiRead);
    this.grants.set(granteeId, set);
    this.audit.record({ actorId: granter.userId, action: "pii.grant", subjectId: granteeId, reason });
  }

  grantsFor(userId: string): Permission[] { return [...(this.grants.get(userId) ?? [])]; }
}

export class AdminService {
  constructor(private readonly users: UserStore, private readonly audit: AuditLog) {}

  listUsers(actor: Principal): AdminUserView[] {
    if (!hasPermission(actor, Permission.UserManage)) throw new PermissionDeniedError("user:manage required");
    return this.users.all().map(toAdminView);
  }

  assignRoles(actor: Principal, targetId: string, roles: string[]): AdminUserView {
    if (!hasPermission(actor, Permission.RoleManage)) throw new PermissionDeniedError("role:manage required");
    if (actor.userId === targetId) throw new PermissionDeniedError("cannot change own roles");
    if (roles.some((r) => PROTECTED_ROLES.includes(r))) throw new PermissionDeniedError("protected role");
    if (roles.some((r) => !Object.hasOwn(ROLE_PERMISSIONS, r))) throw new Error("unknown role");
    const user = this.users.get(targetId);
    if (!user) throw new NotFoundError(targetId);
    const before = [...user.roles].sort();
    user.roles = [...roles];
    this.audit.record({ actorId: actor.userId, action: "role.assign", subjectId: targetId,
      details: { before, after: [...roles].sort() } });
    return toAdminView(user);
  }
}

export interface BreakGlassGrant {
  id: string; actorId: string; subjectId: string; reason: string; openedAt: Date; expiresAt: Date;
}

export class BreakGlassService {
  static readonly MIN_REASON_LENGTH = 10;
  static readonly MAX_DURATION_MS = 60 * 60 * 1000;
  private grants = new Map<string, BreakGlassGrant>();

  constructor(private readonly audit: AuditLog, private readonly clock: Clock = systemClock) {}

  open(actor: Principal, subjectId: string, reason: string, durationMs: number): BreakGlassGrant {
    if (!hasPermission(actor, Permission.BreakGlass)) throw new PermissionDeniedError("break-glass not allowed");
    if (reason.trim().length < BreakGlassService.MIN_REASON_LENGTH) throw new RangeError("구체적인 사유가 필요합니다");
    if (durationMs <= 0 || durationMs > BreakGlassService.MAX_DURATION_MS) throw new RangeError("duration out of range");
    const now = this.clock();
    const grant: BreakGlassGrant = {
      id: randomBytes(8).toString("hex"), actorId: actor.userId, subjectId, reason,
      openedAt: now, expiresAt: new Date(now.getTime() + durationMs),
    };
    this.grants.set(grant.id, grant);
    this.audit.record({ actorId: actor.userId, action: "break_glass.open", subjectId, reason,
      details: { grantId: grant.id, expiresAt: grant.expiresAt.toISOString() } });
    return grant;
  }

  activeGrant(actorId: string, subjectId: string): BreakGlassGrant | undefined {
    const now = this.clock().getTime();
    return [...this.grants.values()].find(
      (g) => g.actorId === actorId && g.subjectId === subjectId && g.openedAt.getTime() <= now && now < g.expiresAt.getTime(),
    );
  }
}

export class PiiAccessService {
  constructor(
    private readonly users: UserStore,
    private readonly breakGlass: BreakGlassService,
    private readonly audit: AuditLog,
  ) {}

  readPii(actor: Principal, subjectId: string, purpose?: string): PiiView {
    let via: string;
    let reason: string | undefined;
    const bg = this.breakGlass.activeGrant(actor.userId, subjectId);
    if (hasPermission(actor, Permission.PiiRead)) {
      via = "grant"; reason = purpose;
    } else if (bg) {
      via = "break_glass"; reason = bg.reason;
    } else {
      this.audit.record({ actorId: actor.userId, action: "pii.read", subjectId, result: "denied" });
      throw new PermissionDeniedError("pii:read required");
    }
    const u = this.users.get(subjectId);
    if (!u) throw new NotFoundError(subjectId);
    this.audit.record({ actorId: actor.userId, action: "pii.read", subjectId, reason, details: { via } });
    return { id: u.id, name: u.name, email: u.email, phone: u.phone, accessVia: via };
  }
}
