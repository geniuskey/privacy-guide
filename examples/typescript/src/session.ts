// 세션·인증정보 보안.
// - 비밀번호: scrypt + 랜덤 솔트, 파라미터를 해시 문자열에 저장(추후 상향 가능). timingSafeEqual 로 비교.
// - 없는 계정도 더미 해시를 검증해 응답 시간으로 계정 존재 여부가 드러나지 않게 한다.
// - 세션 ID: 256bit 랜덤, 서버에는 SHA-256 해시만 저장. 유휴/절대 타임아웃, 로그인 시 재발급.
// - 쿠키: __Host- 접두사 + HttpOnly + Secure + SameSite=Lax + Path=/ (Domain 미지정).
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { type Clock, systemClock, type UserRecord, type UserStore } from "./domain.js";

export const COOKIE_NAME = "__Host-sid";

export interface ScryptParams { N: number; r: number; p: number; keyLen: number; saltLen: number }
// OWASP 권고(N=2^17, r=8, p=1) 수준. 테스트에서는 낮은 값을 주입한다.
export const DEFAULT_SCRYPT: ScryptParams = { N: 2 ** 17, r: 8, p: 1, keyLen: 32, saltLen: 16 };

export class PasswordHasher {
  private readonly dummy: string;
  constructor(readonly params: ScryptParams = DEFAULT_SCRYPT) {
    this.dummy = this.hash(randomBytes(16).toString("hex"));
  }

  private derive(pw: string, salt: Buffer, N: number, r: number, p: number, keyLen: number): Buffer {
    return scryptSync(pw.normalize("NFKC"), salt, keyLen, { N, r, p, maxmem: 128 * N * r * p + 2 * 1024 * 1024 });
  }

  hash(pw: string): string {
    const { N, r, p, keyLen, saltLen } = this.params;
    const salt = randomBytes(saltLen);
    const dk = this.derive(pw, salt, N, r, p, keyLen);
    return `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${dk.toString("base64")}`;
  }

  verify(pw: string, stored: string): boolean {
    const parts = stored.split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") return false;
    const [, N, r, p, salt, dk] = parts as [string, string, string, string, string, string];
    try {
      const expected = Buffer.from(dk, "base64");
      const actual = this.derive(pw, Buffer.from(salt, "base64"), Number(N), Number(r), Number(p), expected.length);
      return actual.length === expected.length && timingSafeEqual(actual, expected);
    } catch {
      return false;
    }
  }

  needsRehash(stored: string): boolean {
    const [, N, r, p] = stored.split("$");
    return Number(N) !== this.params.N || Number(r) !== this.params.r || Number(p) !== this.params.p;
  }

  verifyDummy(pw: string): void { this.verify(pw, this.dummy); }
}

/** 실패 사유(계정 없음/비밀번호 불일치)를 구분해 반환하지 않는다. */
export function authenticate(users: UserStore, hasher: PasswordHasher, email: string, pw: string): UserRecord | null {
  const user = users.getByEmail(email);
  if (!user) { hasher.verifyDummy(pw); return null; }
  if (!hasher.verify(pw, user.passwordHash)) return null;
  if (hasher.needsRehash(user.passwordHash)) user.passwordHash = hasher.hash(pw);
  return user;
}

interface Session { userId: string; createdAt: number; lastSeenAt: number }

export class SessionManager {
  private sessions = new Map<string, Session>();

  constructor(
    private readonly clock: Clock = systemClock,
    readonly idleTimeoutMs = 30 * 60 * 1000,
    readonly absoluteTimeoutMs = 8 * 60 * 60 * 1000,
  ) {}

  private static key(token: string): string { return createHash("sha256").update(token).digest("hex"); }

  /** 테스트용: 저장된 키 목록 (평문 토큰이 저장되지 않음을 확인) */
  storedKeys(): string[] { return [...this.sessions.keys()]; }

  create(userId: string): string {
    const token = randomBytes(32).toString("base64url");
    const now = this.clock().getTime();
    this.sessions.set(SessionManager.key(token), { userId, createdAt: now, lastSeenAt: now });
    return token;
  }

  get(token: string): { userId: string } | null {
    const k = SessionManager.key(token);
    const s = this.sessions.get(k);
    if (!s) return null;
    const now = this.clock().getTime();
    if (now - s.lastSeenAt > this.idleTimeoutMs || now - s.createdAt > this.absoluteTimeoutMs) {
      this.sessions.delete(k);
      return null;
    }
    s.lastSeenAt = now;
    return { userId: s.userId };
  }

  /** 로그인 전 세션 ID 를 재사용하지 않는다(세션 고정 방지). */
  login(userId: string, previousToken?: string): string {
    if (previousToken) this.revoke(previousToken);
    return this.create(userId);
  }

  /** 권한 변경 등 민감 시점에 ID 교체. 절대 만료 기준(createdAt)은 유지. */
  rotate(token: string): string | null {
    const k = SessionManager.key(token);
    const s = this.sessions.get(k);
    if (!s) return null;
    this.sessions.delete(k);
    const fresh = randomBytes(32).toString("base64url");
    this.sessions.set(SessionManager.key(fresh), { ...s, lastSeenAt: this.clock().getTime() });
    return fresh;
  }

  revoke(token: string): void { this.sessions.delete(SessionManager.key(token)); }

  revokeAll(userId: string): number {
    let n = 0;
    for (const [k, s] of this.sessions) if (s.userId === userId) { this.sessions.delete(k); n += 1; }
    return n;
  }
}

/** Set-Cookie 헤더 값 생성 */
export function sessionCookie(token: string, maxAgeMs: number): string {
  return [
    `${COOKIE_NAME}=${token}`,
    "Path=/",
    `Max-Age=${Math.floor(maxAgeMs / 1000)}`,
    "HttpOnly", // JS 접근 차단 → XSS 탈취 완화
    "Secure", // HTTPS 전용
    "SameSite=Lax", // 교차 사이트 POST 에 미전송 → CSRF 완화
  ].join("; ");
}

export const clearSessionCookie = (): string => `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
