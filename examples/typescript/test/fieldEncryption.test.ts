import { beforeEach, describe, expect, it } from "vitest";
import {
  BlindIndex, CustomerRepository, DecryptionError, FieldCipher, type FieldContext, KeyRing,
} from "../src/fieldEncryption.js";

const CTX: FieldContext = { table: "customers", column: "rrn", recordId: "c-1" };
let ring: KeyRing;
let cipher: FieldCipher;
let repo: CustomerRepository;

beforeEach(() => {
  ring = new KeyRing();
  ring.add("k1", KeyRing.generate());
  cipher = new FieldCipher(ring);
  repo = new CustomerRepository(cipher, new BlindIndex(Buffer.alloc(32, "i"), "customers.phone"));
});

describe("필드 암호화", () => {
  it("복호화되고 암호문에 평문이 없다", () => {
    const t = cipher.encrypt("900101-1234567", CTX);
    expect(t.startsWith("enc:v1:k1:")).toBe(true);
    expect(t).not.toContain("900101");
    expect(cipher.decrypt(t, CTX)).toBe("900101-1234567");
  });

  it("같은 평문도 암호문이 매번 다르다", () => {
    expect(cipher.encrypt("x", CTX)).not.toBe(cipher.encrypt("x", CTX));
  });

  it("암호문은 행·컬럼에 묶여 있다", () => {
    const t = cipher.encrypt("900101-1234567", CTX);
    expect(() => cipher.decrypt(t, { ...CTX, recordId: "c-2" })).toThrow(DecryptionError);
    expect(() => cipher.decrypt(t, { ...CTX, column: "passport_no" })).toThrow(DecryptionError);
  });

  it("변조·평문 값은 거부한다", () => {
    const t = cipher.encrypt("secret", CTX);
    const i = t.lastIndexOf(":") + 1;
    const flipped = t.slice(0, i) + (t[i] === "A" ? "B" : "A") + t.slice(i + 1);
    expect(() => cipher.decrypt(flipped, CTX)).toThrow(DecryptionError);
    expect(() => cipher.decrypt("plain-text-value", CTX)).toThrow(DecryptionError);
  });
});

describe("키 순환", () => {
  it("폐기 전까지 옛 키 암호문을 읽고, 재암호화 후 폐기한다", () => {
    const old = cipher.encrypt("110-123-456789", CTX);
    ring.add("k2", KeyRing.generate());
    expect(cipher.decrypt(old, CTX)).toBe("110-123-456789");
    const next = cipher.rotate(old, CTX);
    expect(cipher.keyIdOf(next)).toBe("k2");
    expect(cipher.rotate(next, CTX)).toBe(next);
    ring.retire("k1");
    expect(cipher.decrypt(next, CTX)).toBe("110-123-456789");
    expect(() => cipher.decrypt(old, CTX)).toThrow(DecryptionError);
  });

  it("활성 키 폐기·잘못된 키 길이는 거부한다", () => {
    expect(() => ring.retire("k1")).toThrow(RangeError);
    expect(() => ring.add("short", Buffer.from("too-short"))).toThrow(RangeError);
  });

  it("배치로 나눠 재암호화한다", () => {
    for (let i = 0; i < 5; i++) repo.add(`c-${i}`, "가명", `010-0000-000${i}`);
    ring.add("k2", KeyRing.generate());
    expect(repo.rotateAll(3)).toBe(3);
    expect(repo.rotateAll(3)).toBe(2);
    expect(repo.rotateAll()).toBe(0);
    ring.retire("k1");
    expect(repo.phoneOf("c-4")).toBe("01000000004");
  });
});

describe("블라인드 인덱스", () => {
  it("형식이 달라도 같은 번호를 찾는다", () => {
    repo.add("c-1", "김가명", "010-1234-5678");
    repo.add("c-2", "이가명", "010-9999-0000");
    expect(repo.findByPhone("01012345678").map((r) => r.id)).toEqual(["c-1"]);
    expect(repo.findByPhone("010 1234 5678").map((r) => r.id)).toEqual(["c-1"]);
    expect(repo.findByPhone("010-0000-0000")).toEqual([]);
  });

  it("저장된 행에 평문 번호가 없다", () => {
    const row = repo.add("c-1", "김가명", "010-1234-5678");
    expect(row.phoneEnc).not.toContain("5678");
    expect(row.phoneBidx).not.toContain("5678");
  });

  it("컬럼·키마다 인덱스가 다르다", () => {
    const k = Buffer.alloc(32, "i");
    const vals = new Set([
      new BlindIndex(k, "customers.phone").of("01012345678"),
      new BlindIndex(k, "orders.phone").of("01012345678"),
      new BlindIndex(Buffer.alloc(32, "j"), "customers.phone").of("01012345678"),
    ]);
    expect(vals.size).toBe(3);
  });

  it("잘린 인덱스의 충돌은 복호화로 걸러낸다", () => {
    repo.add("c-1", "김가명", "010-1234-5678");
    const c2 = repo.add("c-2", "이가명", "010-9999-0000");
    c2.phoneBidx = repo.rows.get("c-1")!.phoneBidx;
    expect(repo.findByPhone("010-1234-5678").map((r) => r.id)).toEqual(["c-1"]);
  });
});
