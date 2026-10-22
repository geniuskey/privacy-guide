import { describe, expect, it } from "vitest";
import { AuditLog } from "../src/auditLog.js";
import { NotFoundError } from "../src/domain.js";
import { getOrderFor, listOrdersFor } from "../src/ownership.js";
import { FakeClock, seed } from "./helpers.js";

const clock = new FakeClock();
const { orders } = seed(clock);
const alice = { userId: "u-alice", roles: ["customer"] };

describe("객체 단위 소유권", () => {
  it("본인 주문 조회 가능", () => {
    expect(getOrderFor(alice, "o-1", orders).id).toBe("o-1");
  });

  it("타인 주문과 없는 주문은 동일하게 NotFound (존재 여부 비노출)", () => {
    const err = (id: string) => { try { getOrderFor(alice, id, orders); } catch (e) { return e; } };
    expect(err("o-2")).toBeInstanceOf(NotFoundError);
    expect(err("o-999")).toBeInstanceOf(NotFoundError);
  });

  it("거부된 접근은 감사로그에 남는다", () => {
    const audit = new AuditLog(clock.fn);
    expect(() => getOrderFor(alice, "o-2", orders, audit)).toThrow(NotFoundError);
    expect(audit.events({ action: "order.read" })[0]?.result).toBe("denied");
  });

  it("order:read:any 권한(상담원)은 조회 가능", () => {
    expect(getOrderFor({ userId: "s", roles: ["support"] }, "o-2", orders).ownerId).toBe("u-bob");
  });

  it("목록은 소유자로 한정", () => {
    expect(listOrdersFor(alice, orders).map((o) => o.id)).toEqual(["o-1"]);
  });
});
