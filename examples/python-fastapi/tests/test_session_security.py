from datetime import timedelta

from kr_privacy_examples.app import DEMO_PASSWORD
from kr_privacy_examples.session_security import COOKIE_NAME, PasswordHasher, ScryptParams, SessionManager


def test_password_hash_and_verify(fast_hasher):
    h = fast_hasher.hash("pw-1")
    assert h.startswith("scrypt$") and "pw-1" not in h
    assert fast_hasher.verify("pw-1", h)
    assert not fast_hasher.verify("pw-2", h)
    assert fast_hasher.hash("pw-1") != h  # 솔트
    assert not fast_hasher.verify("pw-1", "garbage")


def test_rehash_on_param_upgrade(fast_hasher):
    old = fast_hasher.hash("pw")
    assert PasswordHasher(ScryptParams(n=2**11)).needs_rehash(old)


def test_cookie_flags(client_factory):
    r = client_factory().post("/auth/login", json={"email": "alice@example.com", "password": DEMO_PASSWORD})
    cookie = r.headers["set-cookie"].lower()
    assert cookie.startswith(COOKIE_NAME.lower() + "=")
    for flag in ["httponly", "secure", "samesite=lax", "path=/"]:
        assert flag in cookie
    assert "domain=" not in cookie


def test_login_failure_is_generic(client_factory):
    c = client_factory()
    wrong_pw = c.post("/auth/login", json={"email": "alice@example.com", "password": "x"})
    no_user = c.post("/auth/login", json={"email": "nobody@example.com", "password": "x"})
    assert wrong_pw.status_code == no_user.status_code == 401
    assert wrong_pw.json() == no_user.json()


def test_session_rotation_on_login(app, client_factory):
    c = client_factory()
    c.post("/auth/login", json={"email": "alice@example.com", "password": DEMO_PASSWORD})
    first = c.cookies.get(COOKIE_NAME)
    c.post("/auth/login", json={"email": "alice@example.com", "password": DEMO_PASSWORD})
    second = c.cookies.get(COOKIE_NAME)
    assert first != second
    assert app.state.container.sessions.get(first) is None  # 이전 세션 무효화


def test_idle_and_absolute_timeout(clock):
    sm = SessionManager(clock, idle_timeout=timedelta(minutes=30), absolute_timeout=timedelta(hours=8))
    t = sm.create("u")
    clock.advance(minutes=29)
    assert sm.get(t) is not None
    clock.advance(minutes=31)
    assert sm.get(t) is None  # 유휴 만료

    t = sm.create("u")
    for _ in range(20):  # 계속 활동해도
        clock.advance(minutes=25)
        sm.get(t)
    assert sm.get(t) is None  # 8시간 절대 만료


def test_rotate_keeps_absolute_deadline(clock):
    sm = SessionManager(clock)
    t = sm.create("u")
    for _ in range(47):  # 10분 간격으로 활동하며 7시간 50분 경과
        clock.advance(minutes=10)
        assert sm.get(t) is not None
    new = sm.rotate(t)
    assert sm.get(t) is None and sm.get(new) is not None
    clock.advance(minutes=15)
    assert sm.get(new) is None


def test_session_token_not_stored_in_plaintext(clock):
    sm = SessionManager(clock)
    t = sm.create("u")
    assert t not in sm._sessions


def test_logout_revokes(login):
    c = login("alice@example.com")
    assert c.get("/me").status_code == 200
    token = c.cookies.get(COOKIE_NAME)
    c.post("/auth/logout")
    c.cookies.set(COOKIE_NAME, token)  # 탈취된 쿠키 재사용 시도
    assert c.get("/me").status_code == 401
