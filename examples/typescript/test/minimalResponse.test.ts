import { describe, expect, it } from "vitest";
import {
  assertOnlyKeys, FORBIDDEN_RESPONSE_FIELDS, maskName, toAdminView, toMyProfile, toOrderOut, toUserSummary,
} from "../src/minimalResponse.js";
import { FakeClock, seed } from "./helpers.js";

const clock = new FakeClock();
const { users, orders } = seed(clock);
const alice = users.get("u-alice")!;

describe("최소 필드 반환", () => {
  const outputs = {
    summary: toUserSummary(alice),
    profile: toMyProfile(alice),
    admin: toAdminView(alice),
    order: toOrderOut(orders.get("o-1")!),
  };

  for (const [name, out] of Object.entries(outputs)) {
    it(`${name}: 내부 필드가 없다`, () => {
      for (const f of FORBIDDEN_RESPONSE_FIELDS) expect(out).not.toHaveProperty(f);
      const json = JSON.stringify(out);
      expect(json).not.toContain("900101-1234567");
      expect(json).not.toContain("scrypt$");
      expect(json).not.toContain("VIP");
      expect(json).not.toContain("테헤란로");
    });
  }

  it("요약에는 마스킹된 이름만", () => {
    expect(outputs.summary).toEqual({ id: "u-alice", displayName: "김**스" });
    expect(maskName("이밥")).toBe("이*");
  });

  it("런타임 허용 키 검사", () => {
    expect(() => assertOnlyKeys({ id: "x", passwordHash: "h" } as { id: string }, ["id"])).toThrow();
  });
});
