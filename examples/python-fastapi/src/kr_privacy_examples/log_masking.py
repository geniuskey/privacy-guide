"""개인정보 로그 마스킹.

- 메시지 본문뿐 아니라 `extra=` 로 전달된 구조화 필드, 예외 트레이스까지 마스킹한다.
- 필터는 로거가 아니라 "핸들러"에 붙인다. 로거 필터는 하위 로거에서 전파된 레코드에 적용되지 않는다.
- 정규식 마스킹은 최후 방어선이다. 애초에 개인정보를 로그에 넣지 않는 것이 우선이다.
"""

from __future__ import annotations

import logging
import re
from typing import Any, Callable

# (라벨, 패턴, 마스킹 함수). 순서가 중요하다: 긴 숫자 패턴(주민번호/카드)을 전화번호보다 먼저 처리.
# 한글 뒤에 바로 숫자가 붙는 경우("주민번호900101-...")를 위해 \b 대신 숫자 lookaround 를 쓴다.
PiiPattern = tuple[str, re.Pattern[str], Callable[[re.Match[str]], str]]

PII_PATTERNS: list[PiiPattern] = [
    ("TOKEN", re.compile(r"(?i)\bbearer\s+[A-Za-z0-9\-._~+/]+=*"), lambda m: "Bearer [REDACTED]"),
    ("TOKEN", re.compile(r"\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*"), lambda m: "[REDACTED_JWT]"),
    (
        "EMAIL",
        re.compile(r"([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)"),
        lambda m: f"{m.group(1)}***@{m.group(2)}",
    ),
    # 주민등록번호/외국인등록번호: 6자리-7자리 (뒷자리 첫 숫자 1~8)
    ("RRN", re.compile(r"(?<!\d)(\d{6})[-\s]?([1-8])\d{6}(?!\d)"), lambda m: f"{m.group(1)}-{m.group(2)}******"),
    ("CARD", re.compile(r"(?<!\d)(?:\d{4}[-\s]?){3}(\d{4})(?!\d)"), lambda m: f"****-****-****-{m.group(1)}"),
    (
        "PHONE",
        re.compile(r"(?<!\d)(01[016789])[-\s.]?\d{3,4}[-\s.]?(\d{4})(?!\d)"),
        lambda m: f"{m.group(1)}-****-{m.group(2)}",
    ),
]

# 값 전체를 가려야 하는 키 (구조화 로그 필드명 기준, 소문자 비교)
SENSITIVE_KEYS = frozenset({
    "password", "passwd", "secret", "token", "access_token", "refresh_token",
    "authorization", "cookie", "set-cookie", "session", "resident_number", "rrn", "card_number",
})

REDACTED = "[REDACTED]"


def mask_text(text: str) -> str:
    for _, pattern, repl in PII_PATTERNS:
        text = pattern.sub(repl, text)
    return text


def mask_value(value: Any, key: str | None = None) -> Any:
    if key is not None and key.lower() in SENSITIVE_KEYS:
        return REDACTED
    if isinstance(value, str):
        return mask_text(value)
    if isinstance(value, dict):
        return {k: mask_value(v, str(k)) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return type(value)(mask_value(v) for v in value)
    if isinstance(value, (set, frozenset)):
        return [mask_value(v) for v in value]
    return value


_STANDARD_ATTRS = frozenset(logging.LogRecord("x", 0, "", 0, "", None, None).__dict__) | {"message", "asctime"}


class PIIMaskingFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        # args 를 먼저 합친 뒤 마스킹한다("%s" 포맷 인자에 개인정보가 들어오는 경우가 가장 흔하다).
        record.msg = mask_text(record.getMessage())
        record.args = None
        for key, value in list(record.__dict__.items()):
            if key not in _STANDARD_ATTRS:
                setattr(record, key, mask_value(value, key))
        if record.exc_info and not record.exc_text:
            record.exc_text = mask_text(logging.Formatter().formatException(record.exc_info))
        elif record.exc_text:
            record.exc_text = mask_text(record.exc_text)
        if record.stack_info:
            record.stack_info = mask_text(record.stack_info)
        return True


def install_masking(handler: logging.Handler) -> logging.Handler:
    handler.addFilter(PIIMaskingFilter())
    return handler
