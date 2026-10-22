---
title: 인증·세션 보안 — 비밀번호 저장부터 세션 만료까지
description: 안전성 확보조치 기준 고시의 인증·접근통제·암호화 조항과 OWASP ASVS 5.0 V6·V7·V9를 로그인, MFA, 세션 쿠키, 토큰 설계에 매핑합니다.
category: auth-access
status: review-required
lastVerified: 2026-10-23
tags: [인증, 세션, 비밀번호, 접근통제, MFA, 암호화]
related: [auth-access/access-control, auth-access/object-level-authorization, internal-admin/admin-vs-data-access, storage-retention/encryption, storage-retention/access-logs, app-security/owasp-asvs-mapping]
sources: [pipa, pipa-decree, safety-notice, pipc-safety-guide, owasp-asvs-5]
legalBasis:
  - source: pipa
    article: 제29조
    kind: law
    summary: 개인정보가 유출등이 되지 않도록 대통령령으로 정하는 바에 따라 기술적·관리적·물리적 안전조치를 해야 한다
    status: verified
  - source: pipa-decree
    article: 제30조제1항제2호나목, 제4호가목
    kind: decree
    summary: 정당한 권한을 가진 자인지 확인하는 인증수단 적용 기준의 설정·운영, 비밀번호 일방향 암호화 저장 등 인증정보 암호화
    status: verified
  - source: safety-notice
    article: 제5조제4항~제6항
    kind: notice
    summary: 개인정보취급자별 계정 발급(공유 금지), 인증수단의 안전한 적용·관리, 일정 횟수 이상 인증 실패 시 접근 제한
    status: verified
  - source: safety-notice
    article: 제6조제2항, 제6조제4항
    kind: notice
    summary: 외부에서 개인정보처리시스템에 접속하는 취급자에게 인증서·보안토큰·일회용 비밀번호 등 안전한 인증수단 적용, 일정시간 업무처리가 없으면 자동 접속 차단
    status: verified
  - source: safety-notice
    article: 제7조제1항
    kind: notice
    summary: 비밀번호·생체인식정보 등 인증정보는 저장·송수신 시 안전한 암호 알고리즘으로 암호화하고, 비밀번호는 복호화되지 않도록 일방향 암호화하여 저장
    status: verified
  - source: pipc-safety-guide
    kind: guide
    summary: 실패 횟수, 자동 차단 시간, 비밀번호 작성규칙 등 구체적 수치에 대한 해설(현행 고시와 대응하는 안내서 판과 내용 확인 필요)
    status: review-required
  - source: owasp-asvs-5
    article: V6 Authentication
    kind: standard
    summary: 비밀번호 정책, 무차별 대입 방어, 다중 인증, 인증 복구 흐름 등 인증 검증 요구사항
    status: verified
  - source: owasp-asvs-5
    article: V7 Session Management
    kind: standard
    summary: 세션 토큰 생성, 만료(유휴·절대), 로그아웃·재인증 시 무효화 요구사항
    status: verified
  - source: owasp-asvs-5
    article: V9 Self-contained Tokens
    kind: standard
    summary: JWT 등 자체 포함 토큰의 서명 검증, 알고리즘 허용 목록, 만료·대상(audience) 검증
    status: verified
---

## 한 문장 결론

비밀번호는 **일방향 암호화(해시)로만 저장**하고(고시 제7조제1항), 개인정보를 다루는 내부 사용자(개인정보취급자)에게는 **개인 계정, 실패 횟수 제한, 외부 접속 시 추가 인증수단, 유휴 시 자동 차단**을 적용해야 합니다(고시 제5조·제6조). 일반 회원 세션의 구체적인 만료 시간과 쿠키 속성은 법령이 정한 수치가 아니라 OWASP ASVS와 서비스 위험도에 맞춰 정하는 설계 선택입니다.

## 적용 조건과 예외

| 대상 | 법령상 요구 (고시 제2026-9호) | 기술 표준·권장 |
| --- | --- | --- |
| 모든 사용자의 비밀번호·생체인식정보 등 인증정보 | 저장·송수신 시 암호화, 비밀번호는 일방향 암호화 (제7조제1항) | ASVS V6, V11: 느린 해시(Argon2id, scrypt, bcrypt 등) |
| 개인정보취급자 계정 (운영자, CS, 관리자) | 개인별 계정·공유 금지(제5조제4항), 인증수단 안전 관리(제5조제5항), 실패 시 접근 제한(제5조제6항) | ASVS V6 |
| 취급자의 **외부** 접속 | 인증서·보안토큰·일회용 비밀번호 등 안전한 인증수단(제6조제2항) | MFA (TOTP, WebAuthn) |
| 취급자의 유휴 상태 | 일정시간 이상 업무처리가 없으면 자동 접속 차단 등(제6조제4항) | ASVS V7 유휴 만료 |
| 일반 회원(정보주체) 로그인·세션 | 제6조제2항·제4항은 취급자 대상. 회원 세션은 제29조의 일반 안전조치와 제7조 암호화 범위에서 판단 | ASVS V7 만료·무효화, V9 토큰 검증 |

예외와 경계:

- **제6조제2항 단서**: 이용자가 아닌 정보주체(예: 직원, 거래처 담당자)의 개인정보만 처리하는 시스템은 외부 접속에 가상사설망(VPN) 등 안전한 접속수단 **또는** 안전한 인증수단을 적용할 수 있습니다. 사내 HR 시스템이 여기에 해당하는지 확인하세요. → [직원 정보 처리](/internal-admin/employee-data/)
- **제5조제4항 "정당한 사유"**: 공유 계정을 허용하는 정당한 사유가 무엇인지는 원문에 열거되어 있지 않습니다. 배치 작업용 서비스 계정 등은 사유를 문서로 남기세요(`review-required`).
- **비밀번호 작성규칙**: 현행 고시(제2026-9호) 원문에서 비밀번호 길이·조합 규칙을 정한 별도 조항은 확인되지 않았습니다. 이전 판 고시나 안내서의 수치를 인용할 때는 현행 기준인지 확인이 필요합니다(`review-required`).
- **수치**: "일정 횟수", "일정시간"의 구체적 값은 고시에 없습니다. 안내서의 예시 수치는 원문 대조 전이므로 단정하지 않습니다(`review-required`).

## 실제 법적 근거

- 「개인정보 보호법」 제29조: 개인정보처리자는 개인정보가 유출등이 되지 아니하도록 내부 관리계획 수립, 접속기록 보관 등 대통령령으로 정하는 바에 따라 기술적·관리적 및 물리적 조치를 하여야 합니다.
- 시행령 제30조제1항제2호나목: "정당한 권한을 가진 자에 의한 접근인지를 확인하기 위해 필요한 인증수단 적용 기준의 설정 및 운영". 제4호가목: "비밀번호의 일방향 암호화 저장 등 인증정보의 암호화 저장 또는 이에 상응하는 조치".
- 안전성 확보조치 기준 제5조
  - 제4항: 계정은 정당한 사유가 없는 한 개인정보취급자별로 발급하고 다른 취급자와 공유되지 않도록 합니다.
  - 제5항: 개인정보취급자 또는 정보주체의 인증수단을 안전하게 적용하고 관리합니다.
  - 제6항: 일정 횟수 이상 인증에 실패한 경우 접근을 제한하는 등 필요한 조치를 합니다.
- 같은 기준 제6조
  - 제2항: 정당한 접근 권한을 가진 자(정보주체 제외)가 정보통신망을 통해 외부에서 접속하려는 경우 인증서, 보안토큰, 일회용 비밀번호 등 안전한 인증수단을 적용합니다.
  - 제4항: 개인정보취급자가 일정시간 이상 업무처리를 하지 않는 경우 자동으로 접속이 차단되도록 하는 등 필요한 조치를 합니다.
- 같은 기준 제7조제1항: 비밀번호, 생체인식정보 등 인증정보를 저장하거나 정보통신망으로 송·수신할 때 안전한 암호 알고리즘으로 암호화하고, 비밀번호는 복호화되지 않도록 일방향 암호화하여 저장합니다.
- 같은 기준 제2조제8호·제11호: "비밀번호"는 정보주체와 개인정보취급자가 접속할 때 식별자와 함께 입력하는 고유 문자열, "인증정보"는 접속을 요청하는 자의 신원을 검증하는 데 쓰는 정보입니다. 따라서 세션 토큰, API 키, 리프레시 토큰도 인증정보로 다루는 것이 안전합니다(이 해석은 프로젝트 권장).

(법률 제21445호, 시행령 대통령령 제36671호, 고시 제2026-9호 기준. 2026-10-23 국가법령정보센터 원문과 대조.)

## 개발자용 실무 해설

1. **"일방향 암호화"는 느린 해시로 구현합니다.** SHA-256 한 번은 일방향이지만 무차별 대입에 약합니다. ASVS V6/V11은 Argon2id, scrypt, bcrypt, PBKDF2 같은 비밀번호 전용 함수를 요구합니다. 알고리즘과 파라미터는 해시 문자열에 함께 저장해 나중에 재해싱할 수 있게 합니다.
2. **회원과 취급자의 인증 정책을 분리합니다.** 같은 로그인 코드를 쓰더라도 관리 콘솔·CS 도구·DB 접근 경로에는 MFA 강제, 짧은 유휴 만료, IP 제한(고시 제6조제1항제1호)을 별도 정책으로 겁니다.
3. **"외부에서 접속"의 범위를 정의합니다.** 사내망 밖에서 관리 콘솔에 접근할 수 있다면 제6조제2항 대상입니다. 클라우드 콘솔, SaaS 관리자 화면, DB 클라이언트도 개인정보처리시스템 접속 경로인지 목록화하세요.
4. **세션은 서버에서 끊을 수 있어야 합니다.** 자동 차단(제6조제4항), 권한 변경 즉시 반영(제5조제2항), 퇴사자 말소를 하려면 세션 저장소에서 무효화할 수 있어야 합니다. 수명이 긴 JWT만으로는 이 요구를 맞추기 어렵습니다.
5. **실패 제한은 계정과 출발지를 함께 봅니다.** 계정 단위 잠금만 하면 공격자가 타인 계정을 잠그는 서비스 거부가 됩니다. 점진적 지연, CAPTCHA, 출발지 기반 속도 제한을 함께 쓰고, 잠금 해제 절차를 정합니다(ASVS V6).

## 권장 설계

```text
AuthPolicy
├─ audience: "member"            ← 정보주체
│   ├─ password_hash: argon2id
│   ├─ session: idle 30m / absolute 7d   (서비스 위험도에 따라 조정, 권장값)
│   └─ mfa: optional (고위험 작업 시 step-up)
└─ audience: "staff"             ← 개인정보취급자
    ├─ account: 개인별 발급, 공유 금지        (고시 제5조제4항)
    ├─ lockout: N회 실패 시 제한              (고시 제5조제6항, N은 내부 관리계획에)
    ├─ mfa: 외부 접속 시 필수                (고시 제6조제2항)
    ├─ idle_timeout: 내부 관리계획 값         (고시 제6조제4항)
    └─ ip_allowlist: 관리 콘솔               (고시 제6조제1항제1호)
```

- 세션 쿠키: `__Host-` 접두사, `Secure`, `HttpOnly`, `SameSite=Lax` 이상, `Path=/`, `Domain` 미지정.
- 로그인, 비밀번호 변경, 권한 상승 시 세션 ID를 재발급합니다(세션 고정 방지, ASVS V7).
- 액세스 토큰(JWT)을 쓰면 수명을 짧게(수 분 단위) 두고, 서명 알고리즘 허용 목록·`exp`·`aud`·`iss`를 검증합니다(ASVS V9). 폐기가 필요하면 리프레시 토큰을 서버 저장소로 관리합니다.
- 인증 실패·잠금·MFA 등록 변경은 감사로그로 남깁니다. → [접속기록](/storage-retention/access-logs/)
- 비밀번호 재설정 링크는 1회용·짧은 만료·해시 저장으로 다룹니다(재설정 토큰도 인증정보).

## 위험한 설계

- 비밀번호를 AES로 "암호화"해 저장하고 복호화 키를 애플리케이션이 보유 (고시 제7조제1항 단서와 충돌)
- `MD5(password)`, `SHA1(salt+password)`처럼 빠른 해시 한 번
- 운영팀이 `admin` 계정 하나를 공유 (고시 제5조제4항)
- 관리 콘솔을 인터넷에 열어 두고 ID/비밀번호만으로 로그인 (고시 제6조제2항)
- 만료 없는 JWT를 `localStorage`에 저장하고, 서버에서 폐기할 방법이 없음
- `alg: none` 또는 HS/RS 혼동을 허용하는 JWT 검증 코드 (ASVS V9)
- 로그인 실패 응답이 "존재하지 않는 계정"과 "비밀번호 오류"를 구분해 계정 존재 여부를 노출
- 세션 ID·토큰·비밀번호를 애플리케이션 로그에 그대로 기록 → [로그 마스킹](/app-security/log-masking/)

## Python/TypeScript 구현 예제

```python
# FastAPI: argon2id 해시 + 실패 횟수 제한 + __Host- 세션 쿠키
import secrets
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import FastAPI, HTTPException, Response

ph = PasswordHasher()  # argon2id 기본값. 파라미터는 해시 문자열에 포함된다
app = FastAPI()
MAX_FAILURES = 5        # 내부 관리계획에 정한 값으로 설정 (고시 제5조제6항)

def hash_password(raw: str) -> str:
    return ph.hash(raw)  # 일방향 암호화 (고시 제7조제1항 단서)

def verify_password(stored: str, raw: str) -> bool:
    try:
        return ph.verify(stored, raw)
    except VerifyMismatchError:
        return False

@app.post("/login")
def login(body: dict, response: Response):
    user = users.find(body["login_id"])          # 저장소 접근은 예시
    if user and user.failures >= MAX_FAILURES:
        raise HTTPException(423, "계정이 잠겼습니다. 재설정 절차를 이용하세요.")
    if not user or not verify_password(user.password_hash, body["password"]):
        if user:
            users.increment_failures(user.id)
        raise HTTPException(401, "아이디 또는 비밀번호가 올바르지 않습니다.")
    users.reset_failures(user.id)
    if ph.check_needs_rehash(user.password_hash):
        users.update_hash(user.id, hash_password(body["password"]))
    sid = secrets.token_urlsafe(32)               # 로그인마다 새 세션 ID
    sessions.create(sid, user.id, idle_seconds=1800, absolute_seconds=7 * 86400)
    response.set_cookie("__Host-sid", sid, httponly=True, secure=True,
                        samesite="lax", path="/")
    return {"ok": True}
```

```ts
// 세션 검증 미들웨어: 유휴·절대 만료를 서버에서 판단하고, 취급자 세션은 MFA를 요구한다
type Session = {
  userId: string;
  audience: 'member' | 'staff';
  mfaVerified: boolean;
  createdAt: number;
  lastSeenAt: number;
};

const POLICY = {
  member: { idleMs: 30 * 60_000, absoluteMs: 7 * 86_400_000 },
  staff: { idleMs: 15 * 60_000, absoluteMs: 12 * 3_600_000 }, // 내부 관리계획 값으로 교체 (고시 제6조제4항)
} as const;

export function checkSession(s: Session | undefined, now = Date.now()): 'ok' | 'expired' | 'mfa-required' {
  if (!s) return 'expired';
  const p = POLICY[s.audience];
  if (now - s.lastSeenAt > p.idleMs || now - s.createdAt > p.absoluteMs) return 'expired';
  if (s.audience === 'staff' && !s.mfaVerified) return 'mfa-required'; // 고시 제6조제2항 (외부 접속)
  return 'ok';
}
```

전체 실행 가능한 예제와 테스트는 [구현 예제](/tools/examples/)를 참고하세요.

## 개발 체크리스트

- [ ] 비밀번호는 Argon2id·scrypt·bcrypt·PBKDF2 중 하나로만 저장되고, 복호화 가능한 형태가 어디에도 없다
- [ ] 인증정보(비밀번호, 토큰, 재설정 링크)는 TLS로만 전송된다
- [ ] 개인정보취급자 계정은 사람마다 따로 발급되고 공유 계정 목록과 사유가 문서화되어 있다
- [ ] 일정 횟수 인증 실패 시 접근이 제한되고, 그 횟수가 내부 관리계획에 적혀 있다
- [ ] 외부에서 관리 콘솔·DB에 접속하는 경로에 MFA(OTP, 보안토큰, 인증서 등)가 강제된다
- [ ] 취급자 세션은 유휴 시간이 지나면 서버에서 자동으로 끊긴다
- [ ] 로그인·권한 변경 시 세션 ID가 재발급되고, 로그아웃 시 서버 세션이 삭제된다
- [ ] 세션 쿠키에 `Secure`, `HttpOnly`, `SameSite`가 설정되어 있다
- [ ] JWT 검증 시 알고리즘 허용 목록, `exp`, `aud`, `iss`를 확인한다
- [ ] 실패 횟수·유휴 시간 등 수치는 안내서 원문 확인 전까지 `review-required`로 관리한다

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 법률·시행령·고시 조문은 2026-10-23 국가법령정보센터 Open API로 현행 원문을 확인했습니다. 안전성 확보조치 기준 안내서의 수치 예시와 OWASP ASVS 세부 요구사항 번호는 원문 대조 전이라 `review-required`입니다.
