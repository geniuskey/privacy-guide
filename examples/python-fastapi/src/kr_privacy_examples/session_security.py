"""세션·인증정보 보안.

- 비밀번호: hashlib.scrypt (솔트 포함, 파라미터를 해시 문자열에 저장해 추후 상향 가능).
- 비교: hmac.compare_digest 로 상수 시간 비교.
- 존재하지 않는 계정도 더미 해시를 검증해 응답 시간으로 계정 존재 여부가 드러나지 않게 한다.
- 세션 ID: secrets 로 생성, 서버에는 SHA-256 해시만 저장(저장소 유출 시 세션 탈취 방지).
- 유휴(idle) 타임아웃 + 절대(absolute) 타임아웃, 로그인 시 세션 재발급(세션 고정 공격 방지).
- 쿠키: HttpOnly, Secure, SameSite=Lax, `__Host-` 접두사(Path=/, Domain 미지정 강제).
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta

from fastapi import Response

from .domain import Clock, UserRecord, UserStore, utc_now

COOKIE_NAME = "__Host-sid"


@dataclass(frozen=True)
class ScryptParams:
    # OWASP 권고(N=2^17, r=8, p=1) 수준. 테스트에서는 더 낮은 값을 주입한다.
    n: int = 2**17
    r: int = 8
    p: int = 1
    dklen: int = 32
    salt_len: int = 16


def _b64(b: bytes) -> str:
    return base64.b64encode(b).decode()


class PasswordHasher:
    def __init__(self, params: ScryptParams = ScryptParams()) -> None:
        self.params = params
        self._dummy = self.hash(secrets.token_urlsafe(16))

    def _derive(self, password: str, salt: bytes, n: int, r: int, p: int, dklen: int) -> bytes:
        return hashlib.scrypt(password.encode(), salt=salt, n=n, r=r, p=p, dklen=dklen,
                              maxmem=128 * n * r * p + 2 * 1024 * 1024)

    def hash(self, password: str) -> str:
        p = self.params
        salt = secrets.token_bytes(p.salt_len)
        dk = self._derive(password, salt, p.n, p.r, p.p, p.dklen)
        return f"scrypt${p.n}${p.r}${p.p}${_b64(salt)}${_b64(dk)}"

    def verify(self, password: str, stored: str) -> bool:
        try:
            algo, n, r, p, salt_b64, dk_b64 = stored.split("$")
            if algo != "scrypt":
                return False
            expected = base64.b64decode(dk_b64)
            actual = self._derive(password, base64.b64decode(salt_b64), int(n), int(r), int(p), len(expected))
        except (ValueError, TypeError):
            return False
        return hmac.compare_digest(actual, expected)

    def needs_rehash(self, stored: str) -> bool:
        _, n, r, p, *_ = stored.split("$")
        return (int(n), int(r), int(p)) != (self.params.n, self.params.r, self.params.p)

    def verify_dummy(self, password: str) -> None:
        self.verify(password, self._dummy)


def authenticate(users: UserStore, hasher: PasswordHasher, email: str, password: str) -> UserRecord | None:
    """성공 시 사용자, 실패 시 None. 실패 사유(계정 없음/비밀번호 불일치)를 구분해 노출하지 않는다."""
    user = users.get_by_email(email)
    if user is None:
        hasher.verify_dummy(password)  # 타이밍 차이 완화
        return None
    if not hasher.verify(password, user.password_hash):
        user.failed_login_count += 1
        return None
    user.failed_login_count = 0
    if hasher.needs_rehash(user.password_hash):
        user.password_hash = hasher.hash(password)
    return user


@dataclass
class Session:
    user_id: str
    created_at: datetime
    last_seen_at: datetime


class SessionManager:
    def __init__(
        self,
        clock: Clock = utc_now,
        idle_timeout: timedelta = timedelta(minutes=30),
        absolute_timeout: timedelta = timedelta(hours=8),
    ) -> None:
        self._clock = clock
        self.idle_timeout = idle_timeout
        self.absolute_timeout = absolute_timeout
        self._sessions: dict[str, Session] = {}

    @staticmethod
    def _key(token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()

    def create(self, user_id: str) -> str:
        token = secrets.token_urlsafe(32)
        now = self._clock()
        self._sessions[self._key(token)] = Session(user_id, now, now)
        return token

    def get(self, token: str) -> Session | None:
        key = self._key(token)
        s = self._sessions.get(key)
        if s is None:
            return None
        now = self._clock()
        if now - s.last_seen_at > self.idle_timeout or now - s.created_at > self.absolute_timeout:
            del self._sessions[key]
            return None
        s.last_seen_at = now
        return s

    def rotate(self, token: str) -> str | None:
        """권한 변경 등 민감 시점에 ID 만 교체. 절대 타임아웃 기준(created_at)은 유지한다."""
        s = self._sessions.pop(self._key(token), None)
        if s is None:
            return None
        new = secrets.token_urlsafe(32)
        self._sessions[self._key(new)] = Session(s.user_id, s.created_at, self._clock())
        return new

    def login(self, user_id: str, previous_token: str | None = None) -> str:
        # 로그인 전 세션 ID 를 절대 재사용하지 않는다(세션 고정 방지).
        if previous_token:
            self.revoke(previous_token)
        return self.create(user_id)

    def revoke(self, token: str) -> None:
        self._sessions.pop(self._key(token), None)

    def revoke_all(self, user_id: str) -> int:
        keys = [k for k, s in self._sessions.items() if s.user_id == user_id]
        for k in keys:
            del self._sessions[k]
        return len(keys)

    def active_count(self) -> int:
        return len(self._sessions)


def set_session_cookie(response: Response, token: str, max_age: timedelta) -> None:
    response.set_cookie(
        COOKIE_NAME, token,
        max_age=int(max_age.total_seconds()),
        httponly=True,   # JS 에서 접근 불가 → XSS 로 인한 탈취 완화
        secure=True,     # HTTPS 로만 전송
        samesite="lax",  # 교차 사이트 POST 에 쿠키 미전송 → CSRF 완화
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/", secure=True, httponly=True, samesite="lax")
