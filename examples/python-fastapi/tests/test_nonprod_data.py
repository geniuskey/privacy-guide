import pytest

from kr_privacy_examples.nonprod_data import (
    ColumnPolicy, DumpTransformer, Rule, UnclassifiedColumnError, fake_email, fake_name, fake_phone, scan_fixture,
)

POLICIES = {
    "users": {
        "id": ColumnPolicy(Rule.PSEUDONYM),
        "name": ColumnPolicy(Rule.FAKE, fake_name),
        "email": ColumnPolicy(Rule.FAKE, fake_email),
        "phone": ColumnPolicy(Rule.FAKE, fake_phone),
        "rrn_enc": ColumnPolicy(Rule.DROP),
        "memo": ColumnPolicy(Rule.NULL),
        "status": ColumnPolicy(Rule.KEEP),
    },
    "orders": {
        "id": ColumnPolicy(Rule.KEEP),
        "user_id": ColumnPolicy(Rule.PSEUDONYM),
        "address": ColumnPolicy(Rule.NULL),
    },
}
KEY = b"k" * 32
USER = {"id": "u-1", "name": "김철수", "email": "chulsoo@corp.co.kr", "phone": "010-1234-5678",
        "rrn_enc": "enc:v1:...", "memo": "VIP, 010-9876-5432", "status": "active"}


@pytest.fixture
def t() -> DumpTransformer:
    return DumpTransformer(POLICIES, KEY)


def test_every_column_is_transformed_per_policy(t):
    [row] = t.transform("users", [USER])
    assert "rrn_enc" not in row
    assert row["memo"] is None and row["status"] == "active"
    assert row["email"].endswith("@example.invalid")
    assert row["phone"].startswith("010-0000-")
    assert "김철수" not in str(row) and "1234-5678" not in str(row)
    assert all(USER[c] != row[c] for c in ("id", "name", "email", "phone"))


def test_pseudonyms_are_deterministic_but_keyed(t):
    [a] = t.transform("users", [USER])
    [b] = t.transform("users", [USER])
    assert a == b
    [c] = DumpTransformer(POLICIES, b"x" * 32).transform("users", [USER])
    assert c["id"] != a["id"]


def test_pseudonyms_are_scoped_per_column(t):
    # users.id와 orders.user_id는 컬럼 컨텍스트가 달라 값이 다르다. 조인이 필요하면 같은 컨텍스트를 쓰도록 정책을 맞춘다
    [u] = t.transform("users", [USER])
    [o] = t.transform("orders", [{"id": 1, "user_id": "u-1", "address": "서울"}])
    assert u["id"] != o["user_id"]
    [o2] = t.transform("orders", [{"id": 2, "user_id": "u-1", "address": None}])
    assert o["user_id"] == o2["user_id"]  # 같은 컬럼 안에서는 관계 유지


def test_unknown_column_fails_closed(t):
    with pytest.raises(UnclassifiedColumnError, match="users.birthday"):
        t.transform("users", [{**USER, "birthday": "1990-01-01"}])
    with pytest.raises(UnclassifiedColumnError):
        t.transform("payments", [{"id": 1}])


def test_schema_check_lists_all_missing_columns(t):
    with pytest.raises(UnclassifiedColumnError) as e:
        t.check_schema({"users": ["id", "name", "birthday"], "orders": ["id", "coupon"]})
    assert "orders.coupon" in str(e.value) and "users.birthday" in str(e.value)
    t.check_schema({"users": list(POLICIES["users"])})  # 통과


def test_short_key_rejected():
    with pytest.raises(ValueError):
        DumpTransformer(POLICIES, b"short")


def test_scanner_finds_real_looking_values():
    text = "\n".join([
        "name,rrn,phone,email,card",
        "홍길동,900101-1234567,010-1234-5678,hong@gmail.com,4111-1111-1111-1111",
    ])
    kinds = {f.kind for f in scan_fixture(text)}
    assert kinds == {"주민등록번호", "휴대전화번호", "이메일", "카드번호"}
    assert all(f.line == 2 for f in scan_fixture(text))
    assert all("1234567" not in f.excerpt for f in scan_fixture(text))  # 리포트에 원문을 남기지 않음


def test_scanner_allows_obvious_fakes():
    text = "테스트00001,010-0000-1234,user-abc@example.invalid,qa@example.com,order 1234-5678-9012-3456"
    assert scan_fixture(text) == []
    [row] = DumpTransformer(POLICIES, KEY).transform("users", [USER])
    assert scan_fixture(str(row)) == []  # 변환 결과는 스캐너를 통과해야 한다
