from dataclasses import replace

import pytest

from kr_privacy_examples.field_encryption import (
    BlindIndex, CustomerRepository, DecryptionError, FieldCipher, KeyRing,
)

CTX = {"table": "customers", "column": "rrn", "record_id": "c-1"}


@pytest.fixture
def ring() -> KeyRing:
    r = KeyRing()
    r.add("k1", KeyRing.generate())
    return r


@pytest.fixture
def repo(ring) -> CustomerRepository:
    return CustomerRepository(FieldCipher(ring), BlindIndex(b"i" * 32, column="customers.phone"))


def test_roundtrip_and_no_plaintext_in_ciphertext(ring):
    c = FieldCipher(ring)
    token = c.encrypt("900101-1234567", **CTX)
    assert "900101" not in token and token.startswith("enc:v1:k1:")
    assert c.decrypt(token, **CTX) == "900101-1234567"


def test_same_plaintext_gives_different_ciphertext(ring):
    c = FieldCipher(ring)
    assert c.encrypt("x", **CTX) != c.encrypt("x", **CTX)  # 무작위 nonce


def test_ciphertext_bound_to_row_and_column(ring):
    c = FieldCipher(ring)
    token = c.encrypt("900101-1234567", **CTX)
    with pytest.raises(DecryptionError):
        c.decrypt(token, **{**CTX, "record_id": "c-2"})  # 다른 행으로 복사
    with pytest.raises(DecryptionError):
        c.decrypt(token, **{**CTX, "column": "passport_no"})


def test_tampered_ciphertext_is_rejected(ring):
    c = FieldCipher(ring)
    token = c.encrypt("secret", **CTX)
    head, last = token.rsplit(":", 1)
    flipped = ("A" if last[0] != "A" else "B") + last[1:]
    with pytest.raises(DecryptionError):
        c.decrypt(f"{head}:{flipped}", **CTX)
    with pytest.raises(DecryptionError):
        c.decrypt("plain-text-value", **CTX)


def test_key_rotation_keeps_old_data_readable_until_retired(ring):
    c = FieldCipher(ring)
    old = c.encrypt("110-123-456789", **CTX)
    ring.add("k2", KeyRing.generate())
    assert c.decrypt(old, **CTX) == "110-123-456789"  # 옛 키 암호문도 읽힘
    assert c.needs_rotation(old)

    new = c.rotate(old, **CTX)
    assert c.key_id_of(new) == "k2"
    assert c.rotate(new, **CTX) == new  # 멱등

    ring.retire("k1")
    assert c.decrypt(new, **CTX) == "110-123-456789"
    with pytest.raises(DecryptionError):
        c.decrypt(old, **CTX)


def test_cannot_retire_active_key_or_use_wrong_key_size(ring):
    with pytest.raises(ValueError):
        ring.retire("k1")
    with pytest.raises(ValueError):
        ring.add("short", b"too-short")


def test_blind_index_search_with_normalization(repo):
    repo.add("c-1", "김가명", "010-1234-5678")
    repo.add("c-2", "이가명", "010-9999-0000")
    assert [r.id for r in repo.find_by_phone("01012345678")] == ["c-1"]
    assert [r.id for r in repo.find_by_phone("010 1234 5678")] == ["c-1"]
    assert repo.find_by_phone("010-0000-0000") == []


def test_stored_row_has_no_plaintext_phone(repo):
    row = repo.add("c-1", "김가명", "010-1234-5678")
    assert "5678" not in row.phone_enc and "5678" not in row.phone_bidx
    assert repo.phone_of("c-1") == "01012345678"


def test_blind_index_differs_per_column_and_key():
    a = BlindIndex(b"i" * 32, column="customers.phone").of("01012345678")
    b = BlindIndex(b"i" * 32, column="orders.phone").of("01012345678")
    c = BlindIndex(b"j" * 32, column="customers.phone").of("01012345678")
    assert len({a, b, c}) == 3


def test_truncated_index_collision_is_filtered_by_decryption(repo):
    repo.add("c-1", "김가명", "010-1234-5678")
    repo.add("c-2", "이가명", "010-9999-0000")
    # 인덱스 충돌을 흉내 낸다: c-2의 인덱스를 c-1과 같게 만든다
    repo._rows["c-2"] = replace(repo.raw("c-2"), phone_bidx=repo.raw("c-1").phone_bidx)
    assert [r.id for r in repo.find_by_phone("010-1234-5678")] == ["c-1"]


def test_rotate_all_in_batches(ring, repo):
    for i in range(5):
        repo.add(f"c-{i}", "가명", f"010-0000-000{i}")
    ring.add("k2", KeyRing.generate())
    assert repo.rotate_all(batch_size=3) == 3
    assert repo.rotate_all(batch_size=3) == 2
    assert repo.rotate_all() == 0
    ring.retire("k1")
    assert repo.phone_of("c-4") == "01000000004"
