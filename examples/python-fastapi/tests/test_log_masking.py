import logging

import pytest

from kr_privacy_examples.log_masking import install_masking, mask_text, mask_value


class ListHandler(logging.Handler):
    def __init__(self):
        super().__init__()
        self.records: list[logging.LogRecord] = []

    def emit(self, record):
        self.records.append(record)


@pytest.fixture
def capture():
    logger = logging.getLogger("test.masking.child")
    handler = install_masking(ListHandler())
    parent = logging.getLogger("test.masking")
    parent.addHandler(handler)
    parent.setLevel(logging.DEBUG)
    yield logger, handler
    parent.removeHandler(handler)


@pytest.mark.parametrize("raw, masked", [
    ("메일 hong.gildong@example.co.kr", "메일 h***@example.co.kr"),
    ("전화 010-1234-5678", "전화 010-****-5678"),
    ("전화 01012345678", "전화 010-****-5678"),
    ("주민번호900101-1234567", "주민번호900101-1******"),
    ("카드 1234-5678-9012-3456", "카드 ****-****-****-3456"),
    ("Authorization: Bearer abc.DEF-123_xyz", "Authorization: Bearer [REDACTED]"),
])
def test_patterns(raw, masked):
    assert mask_text(raw) == masked


def test_non_pii_numbers_untouched():
    assert mask_text("주문번호 20260101 금액 59000원") == "주문번호 20260101 금액 59000원"


def test_message_args_and_extra_fields_masked(capture):
    logger, handler = capture
    logger.info("user %s logged in from %s", "a@b.com", "010-9999-8888",
                extra={"password": "hunter2", "ctx": {"phone": "010-1111-2222", "token": "t"}})
    rec = handler.records[-1]
    out = rec.getMessage()
    assert "a@b.com" not in out and "9999" not in out
    assert rec.password == "[REDACTED]"
    assert rec.ctx == {"phone": "010-****-2222", "token": "[REDACTED]"}


def test_exception_traceback_masked(capture):
    logger, handler = capture
    try:
        raise ValueError("invalid rrn 900101-1234567")
    except ValueError:
        logger.exception("failed")
    formatted = logging.Formatter().format(handler.records[-1])
    assert "1234567" not in formatted and "900101-1******" in formatted


def test_mask_value_nested():
    assert mask_value({"items": [{"email": "x@y.com"}], "authorization": "Bearer z"}) == {
        "items": [{"email": "x***@y.com"}], "authorization": "[REDACTED]",
    }
