import { describe, expect, it } from "vitest";
import { hasPermission, Permission, permissionsFor, type Principal, Role, withPermission } from "../src/rbac.js";

describe("RBAC", () => {
  it("역할에 매핑된 권한만 허용", () => {
    const p: Principal = { userId: "u", roles: [Role.Customer] };
    expect(hasPermission(p, Permission.OrderReadOwn)).toBe(true);
    expect(hasPermission(p, Permission.UserManage)).toBe(false);
  });

  it("알 수 없는 역할은 기본 거부", () => {
    expect(permissionsFor(["superuser", "__proto__"]).size).toBe(0);
  });

  it("pii:read 는 어떤 역할에도 포함되지 않는다", () => {
    for (const r of Object.values(Role)) expect(permissionsFor([r]).has(Permission.PiiRead)).toBe(false);
  });

  it("핸들러 가드: 401 / 403 / 200", () => {
    const h = withPermission(Permission.UserManage, () => ({ status: 200, body: "ok" }));
    expect(h({ params: {} }).status).toBe(401);
    expect(h({ params: {}, principal: { userId: "a", roles: ["customer"] } }).status).toBe(403);
    expect(h({ params: {}, principal: { userId: "a", roles: ["system_admin"] } }).status).toBe(200);
  });
});
