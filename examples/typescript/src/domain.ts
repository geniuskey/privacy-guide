// 예제 공통 도메인 모델과 인메모리 저장소.

export type Clock = () => Date;
export const systemClock: Clock = () => new Date();

/** 리소스가 없거나, 존재 여부를 노출하면 안 되는 경우 → 404 */
export class NotFoundError extends Error {}
/** 인증은 되었으나 권한이 없는 경우 → 403 */
export class PermissionDeniedError extends Error {}

/** DB 행에 해당하는 내부 모델. 그대로 응답하지 않는다. */
export interface UserRecord {
  id: string;
  email: string;
  name: string;
  phone: string;
  passwordHash: string;
  roles: string[];
  createdAt: Date;
  // 주민등록번호는 법령 근거 없이 수집 금지. "절대 응답에 나오면 안 되는 필드" 시연용.
  residentNumber?: string;
  internalMemo?: string;
}

export interface Order {
  id: string;
  ownerId: string;
  item: string;
  amount: number;
  shippingAddress: string;
  createdAt: Date;
}

export class UserStore {
  private users = new Map<string, UserRecord>();
  add(u: UserRecord): void { this.users.set(u.id, u); }
  get(id: string): UserRecord | undefined { return this.users.get(id); }
  getByEmail(email: string): UserRecord | undefined {
    const e = email.trim().toLowerCase();
    return [...this.users.values()].find((u) => u.email.toLowerCase() === e);
  }
  all(): UserRecord[] { return [...this.users.values()]; }
  remove(id: string): void { this.users.delete(id); }
}

export class OrderRepository {
  private orders = new Map<string, Order>();
  add(o: Order): void { this.orders.set(o.id, o); }
  get(id: string): Order | undefined { return this.orders.get(id); }
  listByOwner(ownerId: string): Order[] { return [...this.orders.values()].filter((o) => o.ownerId === ownerId); }
  removeByOwner(ownerId: string): Order[] {
    const removed = this.listByOwner(ownerId);
    for (const o of removed) this.orders.delete(o.id);
    return removed;
  }
}
