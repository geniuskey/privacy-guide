// 객체 단위 소유권 검증 (BOLA/IDOR 방지).
// 404 vs 403: 타인 객체에 403 을 주면 ID 존재 사실이 드러난다. 일반 사용자에게는 '없음'과 '권한 없음'을
// 구분하지 않고 404 를 반환하고, 실제 사유는 감사로그에 남긴다. 403 은 기능 단위 권한 부족에 쓴다.
import type { AuditLog } from "./auditLog.js";
import { NotFoundError, type Order, type OrderRepository } from "./domain.js";
import { hasPermission, Permission, type Principal } from "./rbac.js";

export function getOrderFor(p: Principal, orderId: string, repo: OrderRepository, audit?: AuditLog): Order {
  const order = repo.get(orderId);
  if (!order) throw new NotFoundError(orderId);
  if (order.ownerId === p.userId) return order;
  if (hasPermission(p, Permission.OrderReadAny)) {
    audit?.record({ actorId: p.userId, action: "order.read", subjectId: order.ownerId, resource: `order:${orderId}` });
    return order;
  }
  audit?.record({
    actorId: p.userId, action: "order.read", subjectId: order.ownerId, resource: `order:${orderId}`,
    result: "denied", reason: "not owner",
  });
  throw new NotFoundError(orderId); // 403 이 아니라 404
}

/** 목록 조회는 조건 자체를 소유자로 한정한다(클라이언트가 ownerId 를 넘기지 않게). */
export const listOrdersFor = (p: Principal, repo: OrderRepository): Order[] => repo.listByOwner(p.userId);
