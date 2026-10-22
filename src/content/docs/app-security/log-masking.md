---
title: 로그·APM·에러 트래커 개인정보 마스킹
description: 애플리케이션 로그, APM, 에러 트래커에 개인정보와 인증정보가 새지 않도록 구조화 로깅과 마스킹 필터를 설계합니다. 개인정보 보호법 제29조, 안전성 확보조치 기준 제7조, OWASP ASVS V16을 근거로 정리합니다.
category: app-security
status: review-required
lastVerified: 2026-10-23
tags: [로그, 마스킹, 인증정보, 안전조치, 국외이전, OWASP]
related: [storage-retention/access-logs, app-security/minimal-response, data-sharing/cross-border-transfer, ai-llm/llm-api-integration]
sources: [pipa, pipa-decree, safety-notice, owasp-asvs-5]
legalBasis:
  - source: pipa
    article: 제29조
    kind: law
    summary: 개인정보가 유출등이 되지 아니하도록 기술적·관리적·물리적 안전조치 의무
    status: verified
  - source: pipa
    article: 제3조제1항, 제6항
    kind: law
    summary: 목적에 필요한 최소한의 개인정보 처리, 사생활 침해를 최소화하는 방법으로 처리
    status: verified
  - source: safety-notice
    article: 제2조제11호, 제7조제1항
    kind: notice
    summary: 인증정보(접속 요청자의 신원 검증에 쓰는 정보)와 비밀번호·생체인식정보 등은 저장 시 안전한 암호 알고리즘으로 암호화, 비밀번호는 일방향 암호화
    status: verified
  - source: safety-notice
    article: 제7조제2항
    kind: notice
    summary: 이용자의 주민등록번호·여권번호·운전면허번호·외국인등록번호·신용카드번호·계좌번호·생체인식정보는 저장 시 암호화
    status: verified
  - source: pipa
    article: 제26조, 제28조의8
    kind: law
    summary: 외부 APM·에러 트래커로 개인정보가 전송되면 업무위탁 또는 국외 이전 요건 검토 필요(해당 여부는 사안별 판단)
    status: review-required
  - source: owasp-asvs-5
    article: V16 Security Logging and Error Handling
    kind: standard
    summary: 로그에 민감 데이터·세션 토큰을 남기지 않고, 로그를 보호하며, 에러 메시지에 내부 정보를 노출하지 않는다(장 단위)
    status: verified
  - source: project
    kind: best-practice
    summary: 허용목록 기반 구조화 로깅, 토큰 해시 상관 ID, 에러 트래커 beforeSend 필터는 이 프로젝트의 권장사항
    status: review-required
---

## 한 문장 결론

애플리케이션 로그·APM·에러 트래커에는 **요청/응답 본문, 비밀번호, 토큰, 세션 ID, 고유식별정보를 남기지 않는 것을 기본값**으로 두고, 필요한 필드만 허용목록으로 구조화해 기록합니다. 개인정보처리시스템 접속기록은 이와 별도로 설계합니다.

## 적용 조건과 예외

| 데이터 | 기본 처리 | 근거 구분 |
| --- | --- | --- |
| 비밀번호, OTP, 생체인식정보 | **절대 기록 금지** | 고시 제7조제1항(인증정보 저장 시 암호화, 비밀번호 일방향) — 로그는 평문 저장이 됨 |
| 액세스 토큰, 리프레시 토큰, 세션 ID, API 키, 쿠키 | 기록 금지. 상관관계가 필요하면 짧은 해시(키 있는 HMAC 앞 8~12자) | 고시 제2조제11호 인증정보, ASVS V16·V7 |
| 주민등록번호·여권번호·운전면허번호·외국인등록번호·카드번호·계좌번호 | 기록 금지 또는 완전 마스킹 | 고시 제7조제2항(저장 시 암호화 대상) |
| 이메일, 전화번호, 이름, 주소, IP | 필요한 경우만 부분 마스킹 또는 내부 ID로 대체 | 법 제3조, 제29조 (위험 분석) |
| 내부 사용자 ID, 요청 ID | 기록 (상관 분석용) | — |
| 요청/응답 본문 | 기본 비활성화. 디버깅 시 허용목록 필드만, 짧은 보존 | 법 제3조 |

경계:

- **접속기록(고시 제8조)과 목적이 다릅니다.** 접속기록은 "처리한 정보주체 정보"를 남기고 1~2년 이상 보관해야 합니다. 애플리케이션 로그 마스킹 정책을 접속기록에 그대로 적용하면 필요한 정보가 빠지고, 반대로 하면 과다 보관이 됩니다. → [접속기록](/storage-retention/access-logs/)
- 로그 마스킹을 직접 명시한 법령 조문은 없습니다. 법 제29조의 안전조치 의무와 고시 제7조의 저장 시 암호화 요구를 로그 저장에도 적용해 보는 해석이며, 구체 기법은 OWASP와 이 프로젝트의 권장사항입니다.
- **외부 SaaS(APM, 에러 트래커, 로그 수집)**로 개인정보가 넘어가면 업무위탁(제26조)이나 국외 이전(제28조의8)에 해당하는지 검토가 필요합니다(`review-required`). 마스킹으로 개인정보 자체를 보내지 않는 것이 가장 단순한 해결책입니다. → [국외 이전](/data-sharing/cross-border-transfer/)

## 실제 법적 근거

- 「개인정보 보호법」 제29조: 개인정보가 유출등이 되지 아니하도록 안전성 확보에 필요한 기술적·관리적·물리적 조치 의무.
- 고시 제2조제11호: "인증정보"란 개인정보처리시스템 또는 정보통신망을 관리하는 시스템 등에 접속을 요청하는 자의 신원을 검증하는데 사용되는 정보.
- 고시 제7조제1항: "비밀번호, 생체인식정보 등 인증정보를 저장 또는 정보통신망을 통하여 송ㆍ수신하는 경우에 이를 안전한 암호 알고리즘으로 암호화하여야 한다. 다만, 비밀번호를 저장하는 경우에는 복호화되지 아니하도록 일방향 암호화하여 저장하여야 한다."
- 고시 제7조제2항: 이용자의 주민등록번호, 여권번호, 운전면허번호, 외국인등록번호, 신용카드번호, 계좌번호, 생체인식정보는 저장 시 암호화.

(법률 제21445호, 고시 제2026-9호 기준. 2026-10-23 원문 대조.)

## 개발자용 실무 해설

1. **로그 파일도 저장입니다.** 로그인 요청 본문을 디버그 로그로 남기면 비밀번호가 평문으로 저장됩니다. 고시 제7조제1항 단서(일방향 암호화 저장)와 정면으로 충돌하므로 로그 계층에서 원천 차단합니다.
2. **문자열 로그보다 구조화 로그**: `logger.info(f"user {user} paid")`는 객체의 `__repr__`에 무엇이 있는지 알 수 없습니다. 키-값 구조로 기록하고, 키 이름 기준 허용목록 필터를 적용합니다.
3. **허용목록 + 패턴 마스킹 두 겹**: 키 이름으로 1차 필터(`password`, `token`, `authorization`, `cookie`, `rrn` 등 차단), 값 패턴으로 2차 필터(주민등록번호·카드번호·이메일·전화번호 정규식). 패턴 매칭만으로는 누락이 생기므로 1차가 기본입니다.
4. **HTTP 계층**: `Authorization`, `Cookie`, `Set-Cookie` 헤더와 쿼리스트링의 `token`, `code`, `state` 값이 액세스 로그·리버스 프록시 로그·APM 트레이스에 남는지 확인합니다. URL에 토큰을 넣는 설계 자체를 피합니다.
5. **에러 트래커**: 예외 객체, 지역 변수, 요청 본문, 브레드크럼이 자동 수집됩니다. SDK의 기본 개인정보 수집 옵션을 끄고, 전송 전 훅(`before_send` 등)에서 필터링합니다.
6. **토큰 상관 ID**: 같은 세션의 요청을 묶어 보려면 원문 대신 HMAC(서버 비밀키) 해시의 앞부분을 씁니다. 키 없는 해시는 짧은 토큰이면 역산 위험이 있습니다.
7. **LLM·분석 도구로 로그를 보낼 때**도 같은 필터를 거칩니다. → [LLM API 연동](/ai-llm/llm-api-integration/)
8. **보존 기간과 접근권한**: 애플리케이션 로그는 짧게 보관하고, 로그 조회 권한을 개발자 전체가 아니라 필요한 인원으로 제한합니다.

## 권장 설계

```text
app code ──(structured kv)──▶ logging filter ──▶ stdout ──▶ collector ──▶ log store (보존 N일)
                                 │ 1) key denylist/allowlist
                                 │ 2) value pattern masking
                                 │ 3) token → hmac8
                                 ▼
                            APM / error tracker  (SDK 기본 PII 수집 off, before_send 필터)

access_log (개인정보처리시스템 접속기록) ── 별도 파이프라인, 1~2년+, append-only
```

## 위험한 설계

- 요청/응답 본문 전체 로깅을 프로덕션에서 켜 둠
- `Authorization` 헤더, 쿠키, 리프레시 토큰이 리버스 프록시 액세스 로그에 남음
- 예외 메시지에 `User(name=..., phone=..., rrn=...)` 형태의 객체 문자열 포함
- 에러 트래커 SDK의 "send default PII" 옵션 활성화
- 마스킹을 정규식 한 가지에만 의존하고 테스트 없음
- 비밀번호 재설정 링크(토큰 포함 URL)를 로그로 출력

## Python/TypeScript 구현 예제

```python
# 구조화 로깅 마스킹 필터 (structlog processor)
import hashlib, hmac, os, re

DENY_KEYS = {"password", "passwd", "otp", "token", "access_token", "refresh_token",
             "authorization", "cookie", "set-cookie", "session_id", "api_key", "rrn", "card_no"}
RRN = re.compile(r"\b\d{6}-?[1-8]\d{6}\b")
CARD = re.compile(r"\b(?:\d[ -]?){13,19}\b")
EMAIL = re.compile(r"([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*(@[A-Za-z0-9.-]+)")
PHONE = re.compile(r"\b(01[016789])-?\d{3,4}-?(\d{4})\b")
HMAC_KEY = os.environ["LOG_HMAC_KEY"].encode()

def token_ref(value: str) -> str:
    return "tok_" + hmac.new(HMAC_KEY, value.encode(), hashlib.sha256).hexdigest()[:10]

def mask_value(v: str) -> str:
    v = RRN.sub("[RRN]", v)
    v = CARD.sub("[CARD]", v)
    v = EMAIL.sub(r"\1***\2", v)
    return PHONE.sub(r"\1-****-\2", v)

def scrub(obj):
    if isinstance(obj, dict):
        return {k: ("[REDACTED]" if k.lower() in DENY_KEYS else scrub(v)) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [scrub(x) for x in obj]
    return mask_value(obj) if isinstance(obj, str) else obj

def pii_processor(_logger, _method, event_dict):
    if "session_id" in event_dict:
        event_dict["session_ref"] = token_ref(event_dict["session_id"])
    return scrub(event_dict)

# structlog.configure(processors=[pii_processor, structlog.processors.JSONRenderer()])
```

```ts
// pino redact + 에러 트래커 전송 전 필터
import pino from 'pino';

export const logger = pino({
  redact: {
    paths: [
      'req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]',
      '*.password', '*.token', '*.refreshToken', '*.rrn', '*.cardNo',
    ],
    censor: '[REDACTED]',
  },
});

// Sentry 등: sendDefaultPii는 false로 두고 beforeSend에서 요청 본문·쿠키 제거
export function beforeSend<E extends { request?: { data?: unknown; cookies?: unknown; headers?: Record<string, string> } }>(event: E): E {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    if (event.request.headers) delete event.request.headers['Authorization'];
  }
  return event;
}
```

마스킹 함수는 반드시 단위 테스트로 고정하세요(주민등록번호·카드번호·토큰이 포함된 샘플 로그가 출력에서 사라지는지). 전체 예제는 [구현 예제](/tools/examples/)를 참고하세요.

## 개발 체크리스트

- [ ] 비밀번호·OTP·토큰·세션 ID·API 키가 어떤 로그에도 남지 않는다(샘플 요청으로 테스트)
- [ ] `Authorization`, `Cookie`, `Set-Cookie` 헤더가 웹서버·프록시·APM에서 제거된다
- [ ] 고시 제7조제2항 대상 번호(주민등록번호, 카드번호, 계좌번호 등)가 로그에서 마스킹된다
- [ ] 로깅은 구조화되어 있고 키 기반 차단 + 값 패턴 마스킹이 모두 적용된다
- [ ] 에러 트래커의 기본 PII 수집이 꺼져 있고 전송 전 필터가 있다
- [ ] 요청/응답 본문 로깅이 프로덕션에서 기본 비활성화이다
- [ ] 애플리케이션 로그의 보존 기간과 조회 권한이 정해져 있다
- [ ] 외부 로그·APM SaaS 사용 시 위탁·국외 이전 해당 여부를 검토했다 (`review-required`)
- [ ] 접속기록은 별도 파이프라인으로 고시 제8조 요건을 충족한다

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 법 제3조·제29조와 고시 제2조·제7조는 2026-10-23에 국가법령정보센터 Open API로 현행 원문을 확인했습니다. 외부 SaaS 전송의 위탁·국외 이전 해당 여부와 구체 마스킹 기법은 `review-required` 또는 프로젝트 권장사항입니다.
