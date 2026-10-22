// 최소 필드 반환: 응답 DTO 를 허용 목록으로 정의하고, 변환 함수에서 필드를 명시적으로 골라 담는다.
// `{...user}` 나 `delete user.passwordHash` 같은 블록리스트 방식은 새 필드가 생기면 그대로 노출된다.
import type { Order, UserRecord } from "./domain.js";

export const FORBIDDEN_RESPONSE_FIELDS = [
  "passwordHash", "residentNumber", "internalMemo", "shippingAddress",
] as const;

export interface UserSummary { id: string; displayName: string }
export interface MyProfile { id: string; name: string; email: string; phone: string; createdAt: string }
export interface AdminUserView { id: string; emailMasked: string; roles: string[]; createdAt: string }
export interface OrderOut { id: string; item: string; amount: number; createdAt: string }
export interface PiiView { id: string; name: string; email: string; phone: string; accessVia: string }

export function maskName(name: string): string {
  const c = [...name];
  if (c.length <= 1) return "*";
  if (c.length === 2) return `${c[0]}*`;
  return `${c[0]}${"*".repeat(c.length - 2)}${c[c.length - 1]}`;
}

export function maskEmail(email: string): string {
  const [local = "", domain] = email.split("@");
  return domain ? `${local.slice(0, 1)}***@${domain}` : "***";
}

export const toUserSummary = (u: UserRecord): UserSummary => ({ id: u.id, displayName: maskName(u.name) });

export const toMyProfile = (u: UserRecord): MyProfile => ({
  id: u.id, name: u.name, email: u.email, phone: u.phone, createdAt: u.createdAt.toISOString(),
});

export const toAdminView = (u: UserRecord): AdminUserView => ({
  id: u.id, emailMasked: maskEmail(u.email), roles: [...u.roles].sort(), createdAt: u.createdAt.toISOString(),
});

export const toOrderOut = (o: Order): OrderOut => ({
  id: o.id, item: o.item, amount: o.amount, createdAt: o.createdAt.toISOString(),
});

/** 런타임 2차 방어: 허용 키 외의 키가 있으면 예외 (직렬화 직전 검사용). */
export function assertOnlyKeys<T extends object>(obj: T, allowed: readonly (keyof T)[]): T {
  const extra = Object.keys(obj).filter((k) => !(allowed as readonly string[]).includes(k));
  if (extra.length) throw new Error(`unexpected response fields: ${extra.join(",")}`);
  return obj;
}
