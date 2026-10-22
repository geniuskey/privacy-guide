import { describe, expect, it } from "vitest";
import {
  authenticate, COOKIE_NAME, PasswordHasher, sessionCookie, SessionManager,
} from "../src/session.js";
import { FakeClock, fastHasher, MIN, PASSWORD, seed } from "./helpers.js";

describe("비밀번호 해시", () => {
  it("해시·검증·솔트", () => {
    const h = fastHasher.hash("pw-1");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(fastHasher.verify("pw-1", h)).toBe(true);
    expect(fastHasher.verify("pw-2", h)).toBe(false);
    expect(fastHasher.hash("pw-1")).not.toBe(h);
    expect(fastHasher.verify("pw-1", "garbage")).toBe(false);
  });

  it("파라미터 상향 시 재해시 필요", () => {
    expect(new PasswordHasher({ N: 2 ** 11, r: 8, p: 1, keyLen: 32, saltLen: 16 }).needsRehash(fastHasher.hash("x"))).toBe(true);
  });

  it("로그인 실패 사유를 구분하지 않는다", () => {
    const { users } = seed(new FakeClock());
    expect(authenticate(users, fastHasher, "alice@example.com", PASSWORD)?.id).toBe("u-alice");
    expect(authenticate(users, fastHasher, "alice@example.com", "x")).toBeNull();
    expect(authenticate(users, fastHasher, "nobody@example.com", "x")).toBeNull();
  });
});

describe("세션", () => {
  it("쿠키 플래그", () => {
    const c = sessionCookie("tok", 8 * 60 * MIN);
    expect(c.startsWith(`${COOKIE_NAME}=tok`)).toBe(true);
    for (const f of ["HttpOnly", "Secure", "SameSite=Lax", "Path=/"]) expect(c).toContain(f);
    expect(c).not.toMatch(/Domain=/i);
  });

  it("로그인 시 이전 세션 무효화(세션 고정 방지)", () => {
    const sm = new SessionManager(new FakeClock().fn);
    const pre = sm.create("anon-or-old");
    const post = sm.login("u-alice", pre);
    expect(post).not.toBe(pre);
    expect(sm.get(pre)).toBeNull();
    expect(sm.get(post)?.userId).toBe("u-alice");
  });

  it("유휴·절대 타임아웃", () => {
    const clock = new FakeClock();
    const sm = new SessionManager(clock.fn, 30 * MIN, 8 * 60 * MIN);
    let t = sm.create("u");
    clock.advance(29 * MIN);
    expect(sm.get(t)).not.toBeNull();
    clock.advance(31 * MIN);
    expect(sm.get(t)).toBeNull();

    t = sm.create("u");
    for (let i = 0; i < 20; i++) { clock.advance(25 * MIN); sm.get(t); }
    expect(sm.get(t)).toBeNull();
  });

  it("rotate 는 절대 만료 기준을 유지", () => {
    const clock = new FakeClock();
    const sm = new SessionManager(clock.fn);
    const t = sm.create("u");
    for (let i = 0; i < 47; i++) { clock.advance(10 * MIN); expect(sm.get(t)).not.toBeNull(); }
    const n = sm.rotate(t)!;
    expect(sm.get(t)).toBeNull();
    expect(sm.get(n)).not.toBeNull();
    clock.advance(15 * MIN);
    expect(sm.get(n)).toBeNull();
  });

  it("평문 토큰을 저장하지 않음 + 전체 폐기", () => {
    const sm = new SessionManager(new FakeClock().fn);
    const t = sm.create("u");
    sm.create("u");
    expect(sm.storedKeys()).not.toContain(t);
    expect(sm.revokeAll("u")).toBe(2);
  });
});
