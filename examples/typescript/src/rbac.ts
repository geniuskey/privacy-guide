// RBAC 접근제어: 역할 → 권한 매핑. 코드는 역할이 아니라 권한을 검사하고, 매핑에 없으면 거부한다.
import { PermissionDeniedError } from "./domain.js";

export const Permission = {
  OrderReadOwn: "order:read:own",
  OrderReadAny: "order:read:any",
  TicketRead: "ticket:read",
  UserManage: "user:manage",
  RoleManage: "role:manage",
  BreakGlass: "pii:break_glass", // 긴급 열람 "요청" 자격
  PiiRead: "pii:read", // 어떤 역할에도 매핑하지 않음 → 별도 grant 로만 부여
  PiiGrant: "pii:grant",
  AuditRead: "audit:read",
} as const;
export type Permission = (typeof Permission)[keyof typeof Permission];

export const Role = {
  Customer: "customer",
  Support: "support",
  SystemAdmin: "system_admin",
  PrivacyOfficer: "privacy_officer",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  customer: [Permission.OrderReadOwn],
  support: [Permission.OrderReadAny, Permission.TicketRead, Permission.BreakGlass],
  // 시스템 관리자: 계정·역할 관리만. 개인정보 열람 권한 없음.
  system_admin: [Permission.UserManage, Permission.RoleManage, Permission.BreakGlass],
  privacy_officer: [Permission.PiiGrant, Permission.AuditRead],
};

export interface Principal {
  userId: string;
  roles: readonly string[];
  grants?: readonly Permission[];
}

const isRole = (r: string): r is Role => Object.hasOwn(ROLE_PERMISSIONS, r);

export function permissionsFor(roles: readonly string[], grants: readonly Permission[] = []): Set<Permission> {
  const perms = new Set<Permission>(grants);
  for (const r of roles) {
    if (!isRole(r)) continue; // 알 수 없는 역할 → 권한 없음 (기본 거부)
    for (const p of ROLE_PERMISSIONS[r]) perms.add(p);
  }
  return perms;
}

export function hasPermission(p: Principal, perm: Permission): boolean {
  return permissionsFor(p.roles, p.grants).has(perm);
}

export function requirePermission(p: Principal | undefined, perm: Permission): Principal {
  if (!p) throw new UnauthenticatedError();
  if (!hasPermission(p, perm)) throw new PermissionDeniedError(perm);
  return p;
}

export class UnauthenticatedError extends Error {}

// 아주 작은 핸들러 추상화: 웹 프레임워크의 미들웨어/가드에 해당한다.
export interface Req { principal?: Principal; params: Record<string, string> }
export interface Res { status: number; body: unknown }
export type Handler = (req: Req) => Res;

export function withPermission(perm: Permission, handler: (req: Req & { principal: Principal }) => Res): Handler {
  return (req) => {
    if (!req.principal) return { status: 401, body: { detail: "authentication required" } };
    if (!hasPermission(req.principal, perm)) return { status: 403, body: { detail: "forbidden" } };
    return handler({ ...req, principal: req.principal });
  };
}
