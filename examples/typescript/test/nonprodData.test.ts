import { describe, expect, it } from "vitest";
import {
  DumpTransformer, fakeEmail, fakeName, fakePhone, type Policies, scanFixture, UnclassifiedColumnError,
} from "../src/nonprodData.js";

const POLICIES: Policies = {
  users: {
    id: { rule: "pseudonym" },
    name: { rule: "fake", fake: fakeName },
    email: { rule: "fake", fake: fakeEmail },
    phone: { rule: "fake", fake: fakePhone },
    rrnEnc: { rule: "drop" },
    memo: { rule: "null" },
    status: { rule: "keep" },
  },
  orders: { id: { rule: "keep" }, userId: { rule: "pseudonym" }, address: { rule: "null" } },
};
const KEY = Buffer.alloc(32, "k");
const USER = { id: "u-1", name: "김철수", email: "chulsoo@corp.co.kr", phone: "010-1234-5678",
  rrnEnc: "enc:v1:...", memo: "VIP, 010-9876-5432", status: "active" };
const t = new DumpTransformer(POLICIES, KEY);

describe("운영 덤프 변환", () => {
  it("컬럼별 정책대로 변환한다", () => {
    const [row] = t.transform("users", [USER]);
    expect(row).not.toHaveProperty("rrnEnc");
    expect(row).toMatchObject({ memo: null, status: "active" });
    expect(String(row!.email).endsWith("@example.invalid")).toBe(true);
    expect(JSON.stringify(row)).not.toContain("김철수");
    expect(JSON.stringify(row)).not.toContain("1234-5678");
  });

  it("가명은 결정적이고 키에 따라 다르다", () => {
    expect(t.transform("users", [USER])).toEqual(t.transform("users", [USER]));
    expect(new DumpTransformer(POLICIES, Buffer.alloc(32, "x")).transform("users", [USER])[0]!.id)
      .not.toBe(t.transform("users", [USER])[0]!.id);
  });

  it("같은 컬럼 안에서는 관계를 유지한다", () => {
    const [a, b] = t.transform("orders", [{ id: 1, userId: "u-1", address: "서울" }, { id: 2, userId: "u-1", address: null }]);
    expect(a!.userId).toBe(b!.userId);
  });

  it("정책 없는 컬럼·테이블은 멈춘다", () => {
    expect(() => t.transform("users", [{ ...USER, birthday: "1990-01-01" }])).toThrow(/users\.birthday/);
    expect(() => t.transform("payments", [{ id: 1 }])).toThrow(UnclassifiedColumnError);
    expect(() => t.checkSchema({ users: ["id", "birthday"], orders: ["coupon"] })).toThrow(/orders\.coupon, users\.birthday/);
    expect(() => t.checkSchema({ users: Object.keys(POLICIES.users!) })).not.toThrow();
  });

  it("짧은 키는 거부한다", () => {
    expect(() => new DumpTransformer(POLICIES, Buffer.from("short"))).toThrow(RangeError);
  });
});

describe("픽스처 검사", () => {
  it("실제처럼 보이는 값을 찾고 원문을 남기지 않는다", () => {
    const f = scanFixture("name,rrn\n홍길동,900101-1234567,010-1234-5678,hong@gmail.com,4111-1111-1111-1111");
    expect(new Set(f.map((x) => x.kind))).toEqual(new Set(["주민등록번호", "휴대전화번호", "이메일", "카드번호"]));
    expect(f.every((x) => x.line === 2 && !x.excerpt.includes("1234567"))).toBe(true);
  });

  it("명백한 가짜 값과 변환 결과는 통과한다", () => {
    expect(scanFixture("테스트00001,010-0000-1234,user-abc@example.invalid,qa@example.com,order 1234-5678-9012-3456")).toEqual([]);
    expect(scanFixture(JSON.stringify(t.transform("users", [USER])))).toEqual([]);
  });
});
