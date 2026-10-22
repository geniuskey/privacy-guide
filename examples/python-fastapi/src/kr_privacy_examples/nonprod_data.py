"""개발·테스트 환경용 데이터: 운영 덤프 변환과 픽스처 검사.

- 운영 데이터를 개발·스테이징으로 복사해야 할 때, 모든 컬럼에 처리 규칙(삭제·대체·가명·유지)을 명시하게 한다.
  규칙이 없는 컬럼이 하나라도 있으면 변환을 멈춘다(fail closed). 스키마에 새 컬럼이 생기면 정책을 먼저 고쳐야 한다.
- 가명 대체는 키 있는 HMAC으로 결정적으로 만들어, 같은 원본은 같은 대체값이 되도록(조인·외래키 유지) 한다.
  키는 덤프 작업에서만 쓰고 개발 환경에 두지 않는다. 키가 있으면 대입으로 원본을 확인할 수 있기 때문이다.
- 저장소에 들어가는 픽스처·시드 파일에 실제처럼 보이는 주민등록번호·카드번호·휴대전화번호가 없는지 CI에서 검사한다.

가명처리된 운영 데이터도 가명정보, 즉 개인정보다. 개발·테스트 목적의 가명정보 처리가 법 제28조의2의
"과학적 연구 등"에 해당하는지는 사안별 검토가 필요하다(review-required). 기본값은 합성 데이터다.
"""

from __future__ import annotations

import hashlib
import hmac
import re
from collections.abc import Callable, Iterable, Mapping
from dataclasses import dataclass
from enum import StrEnum
from typing import Any


class Rule(StrEnum):
    DROP = "drop"  # 컬럼 자체를 내보내지 않음
    NULL = "null"  # 컬럼은 두고 값만 비움 (NOT NULL 아닌 경우)
    PSEUDONYM = "pseudonym"  # HMAC 기반 결정적 대체값
    FAKE = "fake"  # 형식만 맞춘 가짜 값
    KEEP = "keep"  # 개인정보가 아닌 컬럼 (상태 코드, 생성일 등)


class UnclassifiedColumnError(Exception):
    pass


@dataclass(frozen=True)
class ColumnPolicy:
    rule: Rule
    fake: Callable[[str], Any] | None = None  # FAKE: 결정적 토큰을 받아 가짜 값 생성


def _token(key: bytes, table: str, column: str, value: Any) -> str:
    return hmac.new(key, f"{table}.{column}\x00{value}".encode(), hashlib.sha256).hexdigest()


def fake_email(token: str) -> str:
    return f"user-{token[:12]}@example.invalid"  # .invalid: 실제로 발송될 수 없는 도메인(RFC 2606)


def fake_phone(token: str) -> str:
    return f"010-0000-{int(token[:8], 16) % 10000:04d}"  # 실제 번호와 겹치지 않도록 국번 0000


def fake_name(token: str) -> str:
    return f"테스트{int(token[:6], 16) % 100000:05d}"


class DumpTransformer:
    def __init__(self, policies: Mapping[str, Mapping[str, ColumnPolicy]], key: bytes) -> None:
        if len(key) < 32:
            raise ValueError("가명 키는 32바이트 이상이어야 한다")
        self._policies, self._key = policies, key

    def check_schema(self, schema: Mapping[str, Iterable[str]]) -> None:
        """운영 스키마의 모든 컬럼에 정책이 있는지 확인한다. 덤프 전에 CI에서 실행한다."""
        missing = [f"{t}.{c}" for t, cols in schema.items() for c in cols if c not in self._policies.get(t, {})]
        if missing:
            raise UnclassifiedColumnError(f"정책이 없는 컬럼: {', '.join(sorted(missing))}")

    def transform(self, table: str, rows: Iterable[Mapping[str, Any]]) -> list[dict[str, Any]]:
        policy = self._policies.get(table)
        if policy is None:
            raise UnclassifiedColumnError(f"정책이 없는 테이블: {table}")
        out = []
        for row in rows:
            unknown = set(row) - set(policy)
            if unknown:
                raise UnclassifiedColumnError(f"정책이 없는 컬럼: {', '.join(f'{table}.{c}' for c in sorted(unknown))}")
            new: dict[str, Any] = {}
            for col, value in row.items():
                p = policy[col]
                if p.rule is Rule.DROP:
                    continue
                if value is None or p.rule is Rule.KEEP:
                    new[col] = value
                elif p.rule is Rule.NULL:
                    new[col] = None
                else:
                    tok = _token(self._key, table, col, value)
                    new[col] = p.fake(tok) if p.rule is Rule.FAKE and p.fake else f"p_{tok[:16]}"
            out.append(new)
        return out


# 픽스처 검사: 실제처럼 보이는 값을 찾는다. 예시 도메인·0000 국번처럼 명백한 가짜는 허용한다.
_PATTERNS: dict[str, re.Pattern[str]] = {
    "주민등록번호": re.compile(r"(?<!\d)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])-?[1-8]\d{6}(?!\d)"),
    "휴대전화번호": re.compile(r"(?<!\d)01[016789]-?(?!0000)\d{3,4}-?\d{4}(?!\d)"),
    "카드번호": re.compile(r"(?<!\d)(?:\d{4}[- ]?){3}\d{4}(?!\d)"),
    "이메일": re.compile(r"[A-Za-z0-9._%+-]+@(?!example\.(?:com|org|net|invalid)\b)(?![A-Za-z0-9-]+\.invalid\b)[A-Za-z0-9.-]+\.[A-Za-z]{2,}"),
}


def _luhn_ok(digits: str) -> bool:
    total = 0
    for i, ch in enumerate(reversed(digits)):
        d = int(ch) * (2 if i % 2 else 1)
        total += d - 9 if d > 9 else d
    return total % 10 == 0


@dataclass(frozen=True)
class Finding:
    line: int
    kind: str
    excerpt: str  # 원문을 그대로 보여주지 않고 앞부분만


def scan_fixture(text: str) -> list[Finding]:
    findings = []
    for no, line in enumerate(text.splitlines(), start=1):
        for kind, pat in _PATTERNS.items():
            for m in pat.finditer(line):
                if kind == "카드번호" and not _luhn_ok(re.sub(r"\D", "", m.group())):
                    continue  # 체크섬이 맞지 않는 16자리는 주문번호 등일 가능성이 높다
                findings.append(Finding(no, kind, m.group()[:4] + "…"))
    return findings
