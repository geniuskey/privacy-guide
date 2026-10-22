"""필드 단위 암호화, 키 순환, 블라인드 인덱스 검색.

- 고시 제7조 대상(주민등록번호·여권번호·계좌번호 등)을 컬럼 단위로 AES-256-GCM 암호화한다.
- 암호문에 키 ID를 함께 저장해, 새 키로 순환한 뒤에도 옛 암호문을 복호화하고 점진적으로 재암호화한다.
- AAD(추가 인증 데이터)에 "테이블.컬럼:레코드ID"를 묶어, 암호문을 다른 행·컬럼에 복사해 붙이는 공격을 막는다.
- 암호화한 컬럼은 동등 검색이 안 되므로, 별도 키의 HMAC으로 만든 블라인드 인덱스로 찾는다.
- 키는 코드·DB에 두지 않는다. 운영에서는 KMS/HSM이 데이터 키를 관리하고, 여기서는 KeyRing이 그 역할을 흉내 낸다.

알고리즘·키 길이·순환 주기는 예시다. 고시 제7조와 안전성 확보조치 기준 안내서, 조직의 암호 정책으로 확정해야 한다.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import os
import re
from dataclasses import dataclass, field

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

FORMAT = "enc:v1"
NONCE_BYTES = 12


class DecryptionError(Exception):
    """키가 없거나, 암호문·AAD가 변조되었을 때."""


def _b64(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def _unb64(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


@dataclass
class KeyRing:
    """키 ID → 256비트 데이터 키. active 키로만 암호화하고, 등록된 모든 키로 복호화한다."""

    keys: dict[str, bytes] = field(default_factory=dict)
    active: str | None = None

    def add(self, key_id: str, key: bytes, *, activate: bool = True) -> None:
        if len(key) != 32:
            raise ValueError("AES-256 키는 32바이트여야 한다")
        if ":" in key_id:
            raise ValueError("키 ID에 ':'를 쓸 수 없다")
        self.keys[key_id] = key
        if activate:
            self.active = key_id

    def retire(self, key_id: str) -> None:
        """재암호화가 끝난 키를 폐기한다. 이후 그 키의 암호문은 복호화할 수 없다."""
        if key_id == self.active:
            raise ValueError("활성 키는 폐기할 수 없다")
        self.keys.pop(key_id, None)

    @staticmethod
    def generate() -> bytes:
        return AESGCM.generate_key(bit_length=256)


def _aad(table: str, column: str, record_id: str) -> bytes:
    return f"{table}.{column}:{record_id}".encode()


class FieldCipher:
    def __init__(self, keyring: KeyRing) -> None:
        self._ring = keyring

    def encrypt(self, plaintext: str, *, table: str, column: str, record_id: str) -> str:
        kid = self._ring.active
        if kid is None:
            raise RuntimeError("활성 키가 없다")
        nonce = os.urandom(NONCE_BYTES)  # GCM은 같은 키에서 nonce를 재사용하면 안 된다
        ct = AESGCM(self._ring.keys[kid]).encrypt(nonce, plaintext.encode(), _aad(table, column, record_id))
        return f"{FORMAT}:{kid}:{_b64(nonce)}:{_b64(ct)}"

    def decrypt(self, token: str, *, table: str, column: str, record_id: str) -> str:
        kid, nonce, ct = self._parse(token)
        key = self._ring.keys.get(kid)
        if key is None:
            raise DecryptionError(f"키 {kid}가 키링에 없다")
        try:
            return AESGCM(key).decrypt(nonce, ct, _aad(table, column, record_id)).decode()
        except InvalidTag as e:
            raise DecryptionError("암호문 또는 AAD가 일치하지 않는다") from e

    def key_id_of(self, token: str) -> str:
        return self._parse(token)[0]

    def needs_rotation(self, token: str) -> bool:
        return self.key_id_of(token) != self._ring.active

    def rotate(self, token: str, *, table: str, column: str, record_id: str) -> str:
        """옛 키 암호문을 활성 키로 다시 암호화한다. 이미 활성 키면 그대로 둔다(멱등)."""
        if not self.needs_rotation(token):
            return token
        plain = self.decrypt(token, table=table, column=column, record_id=record_id)
        return self.encrypt(plain, table=table, column=column, record_id=record_id)

    @staticmethod
    def _parse(token: str) -> tuple[str, bytes, bytes]:
        parts = token.split(":")
        if len(parts) != 5 or ":".join(parts[:2]) != FORMAT:
            raise DecryptionError("지원하지 않는 암호문 형식")
        return parts[2], _unb64(parts[3]), _unb64(parts[4])


def normalize_digits(value: str) -> str:
    """'010-1234-5678', '010 1234 5678'이 같은 인덱스를 갖도록 숫자만 남긴다."""
    return re.sub(r"\D", "", value)


class BlindIndex:
    """암호화 컬럼의 동등 검색용 HMAC 인덱스.

    - 암호화 키와 다른 키를 쓴다. 인덱스 키가 유출돼도 복호화는 안 되지만,
      값의 범위가 좁은 데이터(전화번호 등)는 대입 공격으로 역산될 수 있으므로 인덱스 키도 KMS로 관리한다.
    - 컬럼마다 다른 컨텍스트를 섞어, 다른 컬럼의 인덱스끼리 비교할 수 없게 한다.
    - 앞부분만 잘라 저장하면 충돌이 생기는 대신 역산 단서가 줄어든다. 충돌은 복호화 후 재확인으로 걸러낸다.
    """

    def __init__(self, key: bytes, *, column: str, bits: int = 64) -> None:
        if len(key) < 32:
            raise ValueError("인덱스 키는 32바이트 이상이어야 한다")
        self._key, self._column, self._bytes = key, column, bits // 8

    def of(self, value: str) -> str:
        mac = hmac.new(self._key, f"{self._column}\x00{value}".encode(), hashlib.sha256).digest()
        return _b64(mac[: self._bytes])


@dataclass
class CustomerRow:
    id: str
    name: str
    phone_enc: str
    phone_bidx: str


class CustomerRepository:
    """전화번호를 암호화해 저장하고 블라인드 인덱스로 찾는 저장소."""

    TABLE = "customers"

    def __init__(self, cipher: FieldCipher, phone_index: BlindIndex) -> None:
        self._cipher, self._index = cipher, phone_index
        self._rows: dict[str, CustomerRow] = {}

    def add(self, customer_id: str, name: str, phone: str) -> CustomerRow:
        phone = normalize_digits(phone)
        row = CustomerRow(
            id=customer_id,
            name=name,
            phone_enc=self._cipher.encrypt(phone, table=self.TABLE, column="phone", record_id=customer_id),
            phone_bidx=self._index.of(phone),
        )
        self._rows[customer_id] = row
        return row

    def phone_of(self, customer_id: str) -> str:
        row = self._rows[customer_id]
        return self._cipher.decrypt(row.phone_enc, table=self.TABLE, column="phone", record_id=row.id)

    def find_by_phone(self, phone: str) -> list[CustomerRow]:
        phone = normalize_digits(phone)
        bidx = self._index.of(phone)
        candidates = [r for r in self._rows.values() if r.phone_bidx == bidx]  # 운영: WHERE phone_bidx = ?
        return [r for r in candidates if self.phone_of(r.id) == phone]  # 잘린 인덱스의 충돌 제거

    def rotate_all(self, batch_size: int = 100) -> int:
        """키 순환 배치. 활성 키가 아닌 암호문만 다시 암호화하고 처리한 행 수를 돌려준다."""
        done = 0
        for row in list(self._rows.values()):
            if done >= batch_size:
                break
            if self._cipher.needs_rotation(row.phone_enc):
                row.phone_enc = self._cipher.rotate(row.phone_enc, table=self.TABLE, column="phone", record_id=row.id)
                done += 1
        return done

    def raw(self, customer_id: str) -> CustomerRow:
        return self._rows[customer_id]
