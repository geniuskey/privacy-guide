---
title: 사례 — B2C 회원가입·로그인 서비스
description: 외부 이용자 대상 회원가입·로그인 기능을 처음부터 만들 때 수집 항목별 근거 매핑, 동의 UI, 만 14세 미만, 비밀번호·세션, 휴면·탈퇴 파기, 처리방침 동기화를 한 흐름으로 정리합니다.
category: case-studies
status: review-required
lastVerified: 2026-10-23
tags: [회원가입, 동의, 처리근거, 아동, 파기, 인증]
related: [collection-consent/lawful-basis, collection-consent/consent-ui, collection-consent/children, collection-consent/privacy-policy, auth-access/authentication-session, storage-retention/retention-destruction, storage-retention/encryption, sensitive-data/unique-identifiers]
sources: [pipa, pipa-decree, safety-notice, pipc-integrated-guide, pipc-privacy-policy-guide, owasp-asvs-5, network-act]
legalBasis:
  - source: pipa
    article: 제15조제1항·제2항
    kind: law
    summary: 수집 근거 7가지와 동의 시 알릴 4가지 사항(목적, 항목, 보유·이용 기간, 거부권과 불이익)
    status: verified
  - source: pipa
    article: 제16조
    kind: law
    summary: 목적에 필요한 최소한만 수집하고(입증책임은 처리자), 최소한 외 정보에 동의하지 않는다는 이유로 서비스 제공을 거부해서는 안 된다
    status: verified
  - source: pipa
    article: 제22조제1항·제3항·제5항
    kind: law
    summary: 동의 사항을 구분해 받고(홍보·판매 권유 목적 포함), 동의 없이 처리하는 항목은 근거와 함께 구분 공개하며, 선택 동의 거부를 이유로 서비스 제공을 거부해서는 안 된다
    status: verified
  - source: pipa
    article: 제22조의2
    kind: law
    summary: 만 14세 미만 아동은 법정대리인 동의를 받고 동의 여부를 확인해야 하며, 동의를 받기 위한 최소 정보는 아동에게서 직접 수집할 수 있다
    status: verified
  - source: pipa-decree
    article: 제17조의2
    kind: decree
    summary: 법정대리인 동의 확인 방법(문자 알림, 카드정보, 휴대전화 본인인증 등)과 아동에게서 직접 수집 가능한 정보(법정대리인 성명·연락처)
    status: verified
  - source: pipa
    article: 제24조의2제3항
    kind: law
    summary: 주민등록번호를 처리할 수 있는 경우에도 홈페이지 회원가입 단계에서는 주민등록번호 없이 가입할 수 있는 방법을 제공해야 한다
    status: verified
  - source: pipa-decree
    article: 제30조제1항제4호가목
    kind: decree
    summary: 비밀번호의 일방향 암호화 저장 등 인증정보의 암호화 저장
    status: verified
  - source: safety-notice
    article: 제5조제6항, 제7조제1항·제4항
    kind: notice
    summary: 일정 횟수 이상 인증 실패 시 접근 제한 등 조치, 비밀번호 일방향 암호화 저장, 인증정보·개인정보의 인터넷망 송수신 시 암호화
    status: verified
  - source: pipa
    article: 제21조, 제37조제3항
    kind: law
    summary: 목적 달성·보유기간 경과 시 지체 없이 파기(다른 법령상 보존은 분리 저장), 동의 철회 시 복구·재생할 수 없도록 파기 등 조치
    status: verified
  - source: pipa-decree
    article: 제16조, 제48조의5
    kind: decree
    summary: 전자적 파일은 복원 불가능한 방법으로 영구 삭제. 장기 미이용자 개인정보 파기·분리 보관을 정하던 제48조의5는 2023.9.12. 삭제됨
    status: verified
  - source: pipa
    article: 제26조제2항, 제30조
    kind: law
    summary: 위탁 업무·수탁자 공개, 처리방침에 처리 목적·보유기간·위탁·파기 절차 등을 포함해 공개
    status: verified
  - source: pipc-integrated-guide
    kind: guide
    summary: 회원가입 필수 항목을 계약 체결·이행 근거로 처리하는 해석, 장기 미이용자 관리 권고. 원문 대조 필요
    status: review-required
  - source: network-act
    kind: law
    summary: 광고성 정보 전송 시 수신 동의 등 정보통신망법상 별도 요건. 조문 미확인
    status: review-required
  - source: owasp-asvs-5
    article: V6 Authentication, V7 Session Management
    kind: standard
    summary: 비밀번호 저장·정책, 인증 실패 대응, 세션 생성·만료·무효화에 관한 검증 요구사항(장 단위 인용)
    status: verified
---

## 한 문장 결론

회원가입은 **"필드마다 근거를 붙이고, 근거별로 화면·저장·파기 경로를 다르게 설계하는"** 작업입니다. 필수 항목은 계약 이행(제15조제1항제4호)으로, 선택·마케팅 항목은 구분 동의로 처리하고, 탈퇴·동의 철회·보유기간 경과가 각각 어떤 데이터를 언제 지우는지 코드로 정의해야 합니다.

## 적용 조건과 예외

**가정한 서비스**: 국내 이용자 대상 웹·앱 서비스. 이메일 가입과 소셜 로그인, 마케팅 수신 선택, 만 14세 미만 가입 가능, 문자·이메일 발송 대행사 사용.

| 수집 항목 | 목적 | 근거(제안) | 비고 |
| --- | --- | --- | --- |
| 이메일 | 로그인 ID, 계정 알림 | 제15조제1항제4호 | 처리방침에 동의 없는 처리 항목으로 구분 공개(제22조제3항) |
| 비밀번호 | 인증 | 제15조제1항제4호 | 일방향 암호화 저장(시행령 제30조제1항제4호가목) |
| 닉네임 | 서비스 내 표시 | 제15조제1항제4호 | 공개 범위 표시 |
| 생년월일(또는 연령 구간) | 만 14세 미만 확인 | 제15조제1항제4호 또는 제2호 검토 | 연령 확인만 필요하면 "14세 이상 여부"만 받는 방안 검토(제16조) |
| 법정대리인 성명·연락처 | 법정대리인 동의 | 제22조의2제2항 | 동의 확인 전에만 직접 수집 가능한 최소 정보 |
| 휴대전화번호 | 본인확인·계정 복구 | 서비스 설계에 따라 4호 또는 동의 | 필수로 할 필요가 있는지 먼저 검토 |
| 마케팅 수신 여부·연락처 | 광고성 정보 발송 | 제15조제1항제1호 + 제22조제1항제7호 구분 동의 | 정보통신망법 별도 요건 `review-required` |
| 관심사·프로필 사진 | 맞춤 추천 | 제15조제1항제1호(선택 동의) | 거부해도 가입 가능해야 함(제16조제3항, 제22조제5항) |
| 접속 IP·기기 정보 | 부정 로그인 탐지 | 제15조제1항제6호 검토 | 정당한 이익 판단 기록 필요 → [처리 근거](/collection-consent/lawful-basis/) |

근거 열의 "제안"은 일반적인 매핑 예시입니다. 실제 서비스의 계약 내용과 기능에 따라 달라지므로 법무 검토가 필요합니다(`review-required`).

예외와 경계:

- **주민등록번호는 수집하지 않습니다.** 처리할 수 있는 법령 근거가 있어도 회원가입 단계에서는 주민등록번호 없이 가입할 방법을 제공해야 합니다(제24조의2제3항). → [고유식별정보](/sensitive-data/unique-identifiers/)
- **소셜 로그인**으로 받아오는 항목(이메일, 프로필 등)도 수집입니다. 제공자 동의 화면에 표시된다고 해서 우리 서비스의 고지가 대체되는지는 별도 검토가 필요합니다(`review-required`). 요청 scope를 필요한 항목으로 좁히세요.
- **휴면 계정**: 장기 미이용자 개인정보를 파기하거나 분리 보관하도록 정하던 시행령 제48조의5는 2023.9.12. 삭제되었습니다(원문 확인). 따라서 "1년 미이용 시 분리 보관"을 현행 법정 의무로 표시하지 마세요. 다만 제21조(불필요하게 된 때 파기)와 처리방침에 정한 보유기간은 그대로 적용되므로, 장기 미이용 계정 정책을 내부 기준으로 운영할지와 그 기간은 법무 검토로 정합니다(`review-required`).

## 실제 법적 근거

- 「개인정보 보호법」 제15조제1항·제2항: 수집 근거와 동의 시 고지 4가지 사항.
- 제16조: 최소 수집과 그 입증책임, 최소한 외 정보에 대한 동의 거부를 이유로 한 서비스 거부 금지.
- 제22조제1항: 동의 사항을 구분하여 각각 동의받아야 하는 경우에 제15조제1항제1호 동의와 "재화나 서비스를 홍보하거나 판매를 권유하기 위하여" 받는 동의(제7호)가 포함됩니다. 제3항: 동의 없이 처리하는 항목은 근거와 함께 구분 공개하며 입증책임은 처리자. 제5항: 선택 동의 또는 제7호 동의를 하지 않는다는 이유로 서비스 제공을 거부할 수 없습니다.
- 시행령 제17조제1항: 동의는 자유로운 의사, 구체적·명확한 내용, 쉬운 문구, 명확한 표시 방법을 모두 충족해야 합니다. 제4항: 동의 여부를 선택할 수 있다는 사실을 명확하게 표시해야 합니다.
- 제22조의2 + 시행령 제17조의2: 만 14세 미만은 법정대리인 동의와 그 확인(문자 알림, 카드정보, 휴대전화 본인인증, 서면, 이메일, 전화 등). 동의를 받기 위해 아동에게서 직접 수집할 수 있는 정보는 법정대리인의 성명·연락처입니다. 아동에게 고지할 때는 이해하기 쉬운 양식과 언어를 써야 합니다(제22조의2제3항).
- 제24조의2제3항: 회원가입 단계의 주민등록번호 대체 수단 제공.
- 시행령 제30조제1항제4호가목, 안전성 확보조치 기준 제7조제1항: 비밀번호는 복호화되지 않도록 일방향 암호화. 제7조제4항: 인터넷망 구간 송수신 암호화. 제5조제6항: 일정 횟수 이상 인증 실패 시 접근 제한 등 조치.
- 제21조제1항·제3항, 시행령 제16조: 불필요하게 된 때 지체 없이 파기, 다른 법령상 보존 대상은 분리 저장, 전자적 파일은 복원 불가능한 방법으로 영구 삭제.
- 제37조제1항·제3항: 동의 철회 시 지체 없이 파기 등 조치(제2항 각 호 사유가 있으면 예외).
- 제26조제2항, 시행령 제28조제2항: 문자·이메일 발송 대행 등 위탁 업무와 수탁자를 홈페이지에 지속 게재.
- 제30조제1항, 시행령 제31조: 처리방침에 처리 목적, 처리·보유 기간, 파기 절차·방법, 위탁, 권리 행사 방법, 처리 항목, 안전성 확보 조치 등을 포함.

(현행 법률 제21445호, 시행령 제36671호, 고시 제2026-9호 기준. 조문은 국가법령정보센터 원문과 대조함.)

## 개발자용 실무 해설

1. **필드 정책 레지스트리를 먼저 만듭니다.** 위 표를 코드(`FIELD_POLICIES`)로 옮기고, DB 마이그레이션·가입 폼·처리방침 생성이 같은 정의를 읽게 합니다. 정책이 없는 개인정보 컬럼이 추가되면 CI가 실패하게 합니다. → [처리 근거](/collection-consent/lawful-basis/)
2. **동의 화면은 "필수 동의" 체크박스를 최소화합니다.** 계약 이행 항목은 고지(처리방침 링크와 요약)로, 선택·마케팅은 각각 분리된 체크박스로 받고 기본값은 해제 상태로 둡니다. "전체 동의" 버튼을 둔다면 개별 항목을 펼쳐 확인·해제할 수 있어야 합니다. → [동의 UI](/collection-consent/consent-ui/)
3. **동의 기록은 고지문 버전과 함께 저장합니다.** 고지문을 바꾸면 버전을 올리고, 변경 내용이 제15조제2항 각 호에 해당하면 다시 알리고 동의를 받는 흐름을 만듭니다.
4. **14세 미만 분기는 상태 머신으로 구현합니다.** `PENDING_GUARDIAN_CONSENT` 상태에서는 법정대리인 성명·연락처 외의 정보를 저장하지 않고, 확인 완료 후 나머지 가입 정보를 받습니다. 일정 기간 안에 확인되지 않으면 받은 법정대리인 정보를 파기합니다(기간은 내부 기준, `review-required`). → [아동 개인정보](/collection-consent/children/)
5. **비밀번호와 세션은 표준을 따릅니다.** Argon2id·bcrypt 같은 적응형 해시, 로그인 실패 횟수 제한, 세션 ID 재발급(로그인 시), 로그아웃·비밀번호 변경 시 세션 무효화, 쿠키 `Secure`·`HttpOnly`·`SameSite`. 세부 요구사항은 ASVS V6·V7을 확인하세요. → [인증·세션](/auth-access/authentication-session/)
6. **탈퇴는 "삭제할 것 / 분리 보존할 것 / 익명화할 것"으로 나눕니다.** 계정·프로필·선택 정보는 파기, 다른 법령상 보존 의무가 있는 거래 기록 등은 분리 저장소로 이동(근거 법령과 기간 기록, 예: 전자상거래 관련 법령 `review-required`), 게시물 작성자 표시는 익명화. 백업·검색 인덱스·캐시·분석 도구의 사용자 ID도 파기 범위에 포함합니다. → [보존·파기](/storage-retention/retention-destruction/)
7. **처리방침은 생성물로 관리합니다.** 필드 정책, 위탁사 목록, 국외 이전 목록에서 처리방침의 해당 섹션을 생성하고 변경 이력을 남기면, 코드와 문서의 불일치를 줄일 수 있습니다(프로젝트 권장사항). → [처리방침](/collection-consent/privacy-policy/)

## 권장 설계

```text
가입 흐름
[연령 확인] ──14세 이상──▶ [필수 고지 + 선택 동의(개별)] ──▶ [계정 생성]
     │
     └─14세 미만──▶ [법정대리인 성명·연락처만 수집] ──▶ [대리인 동의 확인(시행령 제17조의2)]
                          │ 미확인 N일 경과 → 대리인 정보 파기
                          └ 확인 완료 → [아동용 쉬운 고지 + 가입 정보 입력] ──▶ [계정 생성]

데이터 수명
users(계약 이행)        ── 탈퇴 → 즉시 파기(백업은 보존 주기 후 소멸)
consents(동의 기록)     ── 철회 → 해당 목적 처리 중지, 기록은 입증용으로 보관(기간 review-required)
orders_archive(법정 보존) ── 분리 저장소, 근거 법령·만료일 컬럼, 만료 배치 파기
auth_events(보안 로그)  ── 보존 기간 정책에 따라 배치 파기
```

## 위험한 설계

- "약관 및 개인정보 수집·이용 전체 동의(필수)" 한 개의 체크박스로 마케팅까지 묶음
- 마케팅 수신 체크박스가 기본 체크 상태
- 선택 항목(관심사, 사진)을 입력하지 않으면 가입 버튼이 비활성화
- 연령 확인 없이 누구나 가입, 또는 "14세 이상입니다" 체크만으로 아동 처리 문제를 종결
- 비밀번호를 복호화 가능한 방식(AES 등)으로 저장하거나, 로그에 평문 비밀번호가 남음
- 탈퇴 시 `users.deleted = true`만 설정하고 개인정보 컬럼은 그대로 둠
- "1년 미이용 시 분리 보관합니다"를 현행 법정 의무처럼 처리방침에 기재
- 발송 대행사를 바꿨는데 처리방침의 위탁 항목은 예전 업체로 남아 있음

## Python/TypeScript 구현 예제

```python
# 가입 요청 검증: 선택 동의를 거부해도 가입되고, 14세 미만은 대리인 동의 대기 상태로만 생성
from datetime import date
from enum import Enum
from pydantic import BaseModel, EmailStr

class SignupState(str, Enum):
    ACTIVE = "active"
    PENDING_GUARDIAN_CONSENT = "pending_guardian_consent"

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    birth_date: date
    marketing_opt_in: bool = False      # 기본값 해제
    interests: list[str] | None = None  # 선택 항목
    guardian_name: str | None = None
    guardian_phone: str | None = None

def age_on(birth: date, today: date) -> int:
    return today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))

def decide_state(req: SignupRequest, today: date) -> SignupState:
    if age_on(req.birth_date, today) < 14:
        if not (req.guardian_name and req.guardian_phone):
            raise ValueError("법정대리인 성명·연락처가 필요합니다")
        return SignupState.PENDING_GUARDIAN_CONSENT
    return SignupState.ACTIVE

def fields_to_persist(req: SignupRequest, state: SignupState) -> dict:
    if state is SignupState.PENDING_GUARDIAN_CONSENT:
        # 대리인 동의 확인 전에는 대리인 정보와 최소 계정 식별 정보만 저장 (제22조의2제2항)
        return {"email": req.email, "guardian_name": req.guardian_name,
                "guardian_phone": req.guardian_phone, "birth_date": req.birth_date}
    data = {"email": req.email, "birth_date": req.birth_date}
    if req.interests:
        data["interests"] = req.interests
    return data
```

위 예제에서 대리인 동의 확인 전에 저장하는 항목(이메일, 생년월일)이 허용되는 최소 범위인지는 서비스 구조에 따라 검토가 필요합니다(`review-required`). 비밀번호는 동의 확인 후 계정 생성 단계에서 해시해 저장합니다.

```ts
// 탈퇴 처리: 파기 / 분리 보존 / 익명화를 한 트랜잭션 계획으로 만든다
type ErasurePlan = { delete: string[]; archive: { table: string; legalBasis: string; until: string }[]; anonymize: string[] };

export function planAccountDeletion(userId: string, hasOrders: boolean): ErasurePlan {
  return {
    delete: ['users', 'profiles', 'optional_interests', 'sessions', 'push_tokens', 'search_index:user'],
    archive: hasOrders
      ? [{ table: 'orders_archive', legalBasis: 'REVIEW_REQUIRED: 거래기록 보존 근거 법령', until: 'TBD' }]
      : [],
    anonymize: ['posts.author_id', 'comments.author_id'],
  };
}
```

전체 실행 가능한 예제(세션·인증정보 보안, 보존기간 만료 삭제, 삭제 요청 처리)와 테스트는 [구현 예제](/tools/examples/)를 참고하세요.

## 개발 체크리스트

- [ ] 가입·로그인에서 수집하는 모든 필드가 근거·목적·보유기간과 함께 필드 정책에 등록되어 있다
- [ ] 계약 이행 항목은 처리방침에 동의 없는 처리 항목으로 구분 공개되어 있다
- [ ] 선택 항목과 마케팅 동의는 개별 체크박스이고 기본값이 해제이며, 거부해도 가입된다
- [ ] 동의 기록에 고지문 버전·시각·채널이 저장된다
- [ ] 만 14세 미만은 법정대리인 동의 확인 전까지 대리인 성명·연락처 외 정보를 받지 않는다 (예제의 최소 범위는 `review-required`)
- [ ] 주민등록번호를 수집하지 않으며, 본인확인이 필요하면 대체 수단을 쓴다
- [ ] 비밀번호는 적응형 일방향 해시로 저장되고 로그·에러 메시지에 남지 않는다
- [ ] 로그인 실패 횟수 제한, 세션 재발급·무효화, 쿠키 보안 속성이 적용되어 있다 (ASVS V6·V7)
- [ ] 탈퇴 시 파기·분리 보존·익명화 대상이 정의되어 있고 백업·인덱스·캐시까지 포함된다
- [ ] 법정 보존 데이터는 근거 법령과 만료일을 가진 분리 저장소에 있다 (근거 법령 `review-required`)
- [ ] 장기 미이용 계정 정책을 법정 의무로 표시하지 않았고, 내부 기준과 기간은 법무 검토를 받았다
- [ ] 발송 대행사 등 수탁자 목록이 처리방침과 일치한다
- [ ] 광고성 정보 발송은 정보통신망법 요건을 확인했다 (`review-required`)

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 개인정보 보호법·시행령·안전성 확보조치 기준 조문(시행령 제48조의5 삭제 사실 포함)은 2026-10-23에 국가법령정보센터 Open API로 받은 현행 원문과 대조했습니다. 통합 안내서·처리방침 작성지침의 해석과 정보통신망법, 전자상거래 관련 보존 의무는 원문 대조 전이라 `review-required`입니다.
