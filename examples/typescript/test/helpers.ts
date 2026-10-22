import { OrderRepository, type UserRecord, UserStore } from "../src/domain.js";
import { PasswordHasher } from "../src/session.js";

export class FakeClock {
  now = new Date("2026-01-01T09:00:00Z");
  readonly fn = (): Date => new Date(this.now);
  advance(ms: number): void { this.now = new Date(this.now.getTime() + ms); }
}
export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

// 테스트 속도를 위한 낮은 파라미터 (운영 값 아님)
export const fastHasher = new PasswordHasher({ N: 2 ** 10, r: 8, p: 1, keyLen: 32, saltLen: 16 });
export const PASSWORD = "correct horse battery staple";

export function seed(clock: FakeClock) {
  const users = new UserStore();
  const orders = new OrderRepository();
  const hash = fastHasher.hash(PASSWORD);
  const mk = (id: string, email: string, name: string, phone: string, roles: string[]): UserRecord => ({
    id, email, name, phone, roles, passwordHash: hash, createdAt: clock.fn(),
    residentNumber: "900101-1234567", internalMemo: "VIP 후보",
  });
  users.add(mk("u-alice", "alice@example.com", "김앨리스", "010-1111-2222", ["customer"]));
  users.add(mk("u-bob", "bob@example.com", "이밥", "010-3333-4444", ["customer"]));
  users.add(mk("u-admin", "admin@example.com", "박관리", "010-5555-6666", ["system_admin"]));
  users.add(mk("u-officer", "officer@example.com", "최보호", "010-7777-8888", ["privacy_officer"]));
  orders.add({ id: "o-1", ownerId: "u-alice", item: "키보드", amount: 59000, shippingAddress: "서울시 강남구 테헤란로 1", createdAt: clock.fn() });
  orders.add({ id: "o-2", ownerId: "u-bob", item: "마우스", amount: 29000, shippingAddress: "부산시 해운대구 1", createdAt: clock.fn() });
  return { users, orders };
}
