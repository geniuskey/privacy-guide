from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from kr_privacy_examples.app import DEMO_PASSWORD, create_app
from kr_privacy_examples.llm_filter import RecordingLLMClient
from kr_privacy_examples.session_security import PasswordHasher, ScryptParams


class FakeClock:
    def __init__(self, start: datetime | None = None) -> None:
        self.now = start or datetime(2026, 1, 1, 9, 0, tzinfo=timezone.utc)

    def __call__(self) -> datetime:
        return self.now

    def advance(self, **kwargs: float) -> None:
        self.now += timedelta(**kwargs)


@pytest.fixture
def clock() -> FakeClock:
    return FakeClock()


@pytest.fixture(scope="session")
def fast_hasher() -> PasswordHasher:
    # 테스트 속도를 위해 낮은 파라미터 사용 (운영 값 아님)
    return PasswordHasher(ScryptParams(n=2**10))


@pytest.fixture
def llm() -> RecordingLLMClient:
    return RecordingLLMClient()


@pytest.fixture
def app(clock, fast_hasher, llm):
    return create_app(clock=clock, hasher=fast_hasher, llm_client=llm)


@pytest.fixture
def client_factory(app):
    def make() -> TestClient:
        # Secure 쿠키가 전송되도록 https base_url 사용
        return TestClient(app, base_url="https://testserver")
    return make


@pytest.fixture
def login(client_factory):
    def do(email: str) -> TestClient:
        c = client_factory()
        r = c.post("/auth/login", json={"email": email, "password": DEMO_PASSWORD})
        assert r.status_code == 200, r.text
        return c
    return do
