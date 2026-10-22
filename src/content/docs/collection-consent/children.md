---
title: 만 14세 미만 아동 — 법정대리인 동의와 연령 확인 설계
description: 개인정보 보호법 제22조의2와 시행령 제17조의2에 따라 만 14세 미만 아동의 개인정보를 처리할 때 필요한 법정대리인 동의, 동의 확인 방법, 연령 확인 흐름과 데이터 모델을 정리합니다.
category: collection-consent
status: review-required
lastVerified: 2026-10-23
tags: [아동, 법정대리인, 연령 확인, 동의, 회원가입]
related: [collection-consent/consent-ui, collection-consent/lawful-basis, collection-consent/privacy-policy, app-security/data-subject-rights, case-studies/signup-service, ai-llm/automated-decisions]
sources: [pipa, pipa-decree, pipc-integrated-guide]
legalBasis:
  - source: pipa
    article: 제22조의2제1항
    kind: law
    summary: 만 14세 미만 아동의 개인정보를 처리하기 위해 이 법에 따른 동의를 받아야 할 때는 법정대리인의 동의를 받고, 법정대리인이 동의하였는지를 확인해야 함
    status: verified
  - source: pipa
    article: 제22조의2제2항
    kind: law
    summary: 법정대리인 동의를 받기 위해 필요한 최소한의 정보로서 대통령령으로 정하는 정보는 법정대리인 동의 없이 아동으로부터 직접 수집 가능
    status: verified
  - source: pipa
    article: 제22조의2제3항
    kind: law
    summary: 만 14세 미만 아동에게 개인정보 처리 관련 고지 등을 할 때는 이해하기 쉬운 양식과 명확하고 알기 쉬운 언어를 사용해야 함
    status: verified
  - source: pipa-decree
    article: 제17조의2제1항
    kind: decree
    summary: 법정대리인 동의 확인 방법 7가지(문자 확인 통지, 카드정보, 휴대전화 본인인증, 서면, 전자우편, 전화, 준하는 방법)
    status: verified
  - source: pipa-decree
    article: 제17조의2제2항·제3항
    kind: decree
    summary: 아동으로부터 직접 수집 가능한 정보는 법정대리인의 성명 및 연락처. 매체 특성상 동의 내용을 전부 표시하기 어려우면 확인 방법(인터넷주소, 전화번호)을 안내 가능
    status: verified
  - source: pipa
    article: 제38조제2항
    kind: law
    summary: 만 14세 미만 아동의 법정대리인은 그 아동의 개인정보 열람등요구를 할 수 있음
    status: verified
  - source: pipa
    article: 제64조의2제1항제2호, 제71조제3호
    kind: law
    summary: 법정대리인 동의 없이 만 14세 미만 아동의 개인정보를 처리하면 과징금·형사처벌 대상이 될 수 있음
    status: verified
  - source: pipa-decree
    article: 제44조의4제1항제4호
    kind: decree
    summary: 자동화된 결정 과정에서 14세 미만 아동의 개인정보를 처리하는 경우 그 목적과 항목을 공개해야 함
    status: verified
  - source: pipc-integrated-guide
    kind: guide
    summary: 연령 확인 방법의 적정 수준, 법정대리인 동의 기록 보관 등에 대한 해석(원문 쪽수 확인 필요)
    status: review-required
---

## 한 문장 결론

**동의를 근거로** 만 14세 미만 아동의 개인정보를 처리하려면 아동이 아니라 **법정대리인의 동의를 받고 그 동의가 진짜 법정대리인의 것인지 시행령 제17조의2의 방법으로 확인**해야 하며, 그 전에는 동의 요청에 필요한 법정대리인의 성명·연락처만 아동에게서 받을 수 있습니다.

## 적용 조건과 예외

| 조건 | 내용 |
| --- | --- |
| 대상 | 만 14세 미만 아동 |
| 트리거 | 이 법에 따른 **동의**를 받아야 할 때(제22조의2제1항). 제15조제1항제1호 동의, 제17조 제공 동의, 제23조·제24조 별도 동의 등 |
| 동의 주체 | 법정대리인 (제22조 본문의 "정보주체"에 법정대리인이 포함됨) |
| 확인 의무 | 법정대리인이 동의하였는지를 **확인**해야 함 |
| 사전 수집 예외 | 법정대리인 동의를 받기 위해 필요한 최소 정보 = **법정대리인의 성명 및 연락처**(시행령 제17조의2제2항) |
| 고지 방식 | 아동에게 고지할 때 이해하기 쉬운 양식과 알기 쉬운 언어(제22조의2제3항) |

경계 사례:

- **동의가 아닌 근거로 처리하는 정보**(예: 계약 이행, 법령상 의무)에 대해 제22조의2제1항이 어떻게 적용되는지, 특히 아동이 단독으로 계약 당사자가 될 수 있는지는 민법상 행위능력 문제와 얽혀 있어 법무 검토가 필요합니다(`review-required`).
- **"만 14세"의 계산 기준일**(가입일 기준 만 나이)은 법문상 "만 14세 미만"으로 명확하지만, 서비스 이용 중 만 14세가 되는 경우 기존 법정대리인 동의를 어떻게 다룰지는 안내서 확인이 필요합니다(`review-required`).
- 제58조제2항에 따라 공개된 장소의 고정형 영상정보처리기기로 처리되는 개인정보에는 제22조의2가 적용되지 않습니다.

## 실제 법적 근거

- 제22조의2제1항: "개인정보처리자는 만 14세 미만 아동의 개인정보를 처리하기 위하여 이 법에 따른 동의를 받아야 할 때에는 그 법정대리인의 동의를 받아야 하며, 법정대리인이 동의하였는지를 확인하여야 한다."
- 시행령 제17조의2제1항 — 법정대리인 동의 확인 방법:

| 호 | 방법 | 구현 형태 |
| --- | --- | --- |
| 1 | 동의 내용 게재 사이트에 법정대리인이 동의 표시 + 처리자가 그 동의 표시를 확인했음을 **법정대리인 휴대전화 문자**로 알림 | 웹 동의 + SMS 확인 통지 |
| 2 | 동의 표시 + 법정대리인의 **신용카드·직불카드 등 카드정보** 제공 | 카드 인증 |
| 3 | 동의 표시 + 법정대리인 **휴대전화 본인인증** 등으로 본인 여부 확인 | 본인확인기관 연동 |
| 4 | 동의 서면을 직접·우편·팩스로 전달, 법정대리인이 **서명날인 후 제출** | 서면 업로드·접수 |
| 5 | 동의 내용 **전자우편** 발송, 법정대리인의 동의 의사표시 전자우편 회신 | 이메일 회신 |
| 6 | **전화**로 알리고 동의, 또는 인터넷주소 안내 후 재통화로 동의 | 콜센터 |
| 7 | 그 밖에 1~6호에 준하는 방법 | 별도 검토 |

- 시행령 제17조의2제2항: 제22조의2제2항의 "대통령령으로 정하는 정보"는 **법정대리인의 성명 및 연락처**.
- 시행령 제17조의2제3항: 매체 특성상 동의 내용을 전부 표시하기 어려우면 인터넷주소 또는 사업장 전화번호 등 확인 방법을 법정대리인에게 안내할 수 있음.
- 제38조제2항: 법정대리인은 아동의 개인정보 **열람등요구**(열람·전송·정정·삭제·처리정지·동의 철회·자동화된 결정 거부·설명 요구)를 할 수 있음.
- 제재: 제64조의2제1항제2호(과징금), 제71조제3호(5년 이하 징역 또는 5천만원 이하 벌금).

(현행 법률 제21445호·시행령 제36671호 기준. 국가법령정보센터 원문과 대조함.)

## 개발자용 실무 해설

1. **연령 확인이 먼저입니다.** 법정대리인 동의 의무는 "만 14세 미만"일 때 생기므로, 가입 첫 단계에서 연령 구간을 확인해야 분기할 수 있습니다. 생년월일 전체가 필요 없다면 "만 14세 이상입니다 / 미만입니다" 선택 또는 생년만 받는 방식이 최소 수집(제16조)에 부합합니다. 다만 자기 신고 방식만으로 충분한지는 서비스 위험도에 따라 달라지므로 `review-required`입니다.
2. **"대기 상태" 계정을 설계합니다.** 법정대리인 동의 전에는 아동의 개인정보를 동의 기반으로 처리할 수 없습니다. 아동이 입력한 프로필을 미리 저장해 두는 대신, 법정대리인 성명·연락처만 저장한 `PENDING_GUARDIAN` 상태를 두고, 동의 완료 후에 아동 정보를 입력받는 흐름이 안전합니다.
3. **사전 수집 정보는 동의가 이루어지지 않으면 지웁니다.** 법정대리인 성명·연락처는 동의 요청 목적으로만 받은 것이므로 일정 기간 내 동의가 없으면 파기합니다. 기간은 법에 정해져 있지 않으므로 프로젝트에서 정하고 처리방침에 적습니다(권장사항).
4. **확인 증거를 남깁니다.** 어떤 방법(제17조의2제1항 몇 호)으로 확인했는지, 확인 시각, 본인인증 트랜잭션 ID 등을 기록해야 "확인하였는지"를 입증할 수 있습니다. 카드번호나 본인인증 결과의 원본 데이터는 필요한 최소 범위로만 보관합니다.
5. **아동용 고지 문구를 따로 만듭니다.** 제22조의2제3항은 이해하기 쉬운 양식과 언어를 요구합니다. 성인용 고지문을 그대로 쓰지 말고 아동용 요약본을 별도 버전으로 관리하세요.
6. **법정대리인 계정과 아동 계정을 연결합니다.** 제38조제2항에 따라 법정대리인이 아동 정보의 열람·삭제를 요청할 수 있어야 하므로, 법정대리인 인증 후 아동 계정을 관리할 수 있는 경로가 필요합니다.
7. **자동화된 결정에 아동 정보가 들어가면 공개 항목이 늘어납니다.** 시행령 제44조의4제1항제4호. → [자동화된 결정](/ai-llm/automated-decisions/)

## 권장 설계

```text
가입 흐름
1. 연령 구간 확인 ───────────────┐
   ├─ 만 14세 이상 → 일반 가입      │
   └─ 만 14세 미만                  │
2. 법정대리인 성명·연락처만 입력 (영 제17조의2제2항)
3. 법정대리인에게 동의 요청 발송 (아동용·보호자용 고지문 각각)
4. 법정대리인이 동의 + 확인 (영 제17조의2제1항 1~7호 중 하나)
5. 확인 완료 → 아동 계정 활성화 → 아동 정보 입력
6. N일 내 미완료 → 2단계 정보 파기
```

```text
GuardianConsent
├─ child_account_id
├─ guardian_name, guardian_contact      (암호화, 동의 실패 시 파기)
├─ method: SMS_NOTICE | CARD | MOBILE_AUTH | PAPER | EMAIL | PHONE | OTHER
├─ verification_ref                     (본인인증 거래 ID 등, 원본 미보관)
├─ purposes[]                           (구분 동의 — 제22조제1항)
├─ notice_version_guardian, notice_version_child
├─ verified_at
└─ expires_pending_at                   (대기 상태 만료 시각)
```

## 위험한 설계

- 아동이 "보호자 동의함" 체크박스를 직접 누르게 하는 방식 — 법정대리인 동의 **확인**이 없습니다
- 법정대리인 동의 전에 아동의 이름, 학교, 사진 등을 먼저 저장
- 연령 확인을 위해 주민등록번호를 수집 — 제24조의2 위반 소지가 큽니다 → [고유식별정보](/sensitive-data/unique-identifiers/)
- 법정대리인 연락처를 동의 요청 외의 마케팅 목적으로 재사용
- 동의 확인 방법·시각을 기록하지 않음
- 성인용 고지문을 아동에게 그대로 표시

## Python/TypeScript 구현 예제

```python
# 만 나이 계산과 가입 분기 (FastAPI)
from datetime import date
from enum import Enum
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()
CHILD_AGE_LIMIT = 14  # 제22조의2제1항: 만 14세 미만

def international_age(birth: date, today: date) -> int:
    had_birthday = (today.month, today.day) >= (birth.month, birth.day)
    return today.year - birth.year - (0 if had_birthday else 1)

class Status(str, Enum):
    ACTIVE = "active"
    PENDING_GUARDIAN = "pending_guardian"

class SignupStart(BaseModel):
    birth_date: date
    guardian_name: str | None = None
    guardian_phone: str | None = None

@app.post("/signup/start")
def signup_start(body: SignupStart):
    age = international_age(body.birth_date, date.today())
    if age >= CHILD_AGE_LIMIT:
        return {"status": Status.ACTIVE, "next": "/signup/profile"}
    if not (body.guardian_name and body.guardian_phone):
        return {"status": Status.PENDING_GUARDIAN, "next": "/signup/guardian"}
    # 영 제17조의2제2항: 법정대리인 성명·연락처만 저장, 아동 프로필은 아직 받지 않음
    return {"status": Status.PENDING_GUARDIAN, "next": "/signup/wait-guardian"}
```

```ts
// 법정대리인 동의 확인 방법을 시행령 제17조의2제1항 각 호로 제한한다
const METHODS = ['SMS_NOTICE', 'CARD', 'MOBILE_AUTH', 'PAPER', 'EMAIL', 'PHONE'] as const;
type GuardianMethod = (typeof METHODS)[number];

interface GuardianVerification {
  method: GuardianMethod;
  verificationRef: string; // 본인인증 거래 ID 등
  verifiedAt: string;
}

export function activateChild(v: GuardianVerification | null): 'active' | 'pending_guardian' {
  if (!v || !METHODS.includes(v.method) || !v.verificationRef) return 'pending_guardian';
  return 'active';
}
```

전체 실행 가능한 예제는 [구현 예제](/tools/examples/)를 참고하세요.

## 개발 체크리스트

- [ ] 가입 첫 단계에서 만 14세 미만 여부를 확인하고 분기한다
- [ ] 법정대리인 동의 전에는 법정대리인 성명·연락처 외 정보를 받지 않는다
- [ ] 법정대리인 동의 확인 방법이 시행령 제17조의2제1항 중 하나이고, 방법·시각·증거 ID가 기록된다
- [ ] 동의가 완료되지 않으면 사전 수집 정보를 정해진 기간 후 파기한다
- [ ] 아동용 고지문이 별도로 있고 버전 관리된다
- [ ] 법정대리인이 아동 정보 열람·삭제·동의 철회를 요청할 수 있다(제38조제2항)
- [ ] 연령 확인에 주민등록번호를 사용하지 않는다
- [ ] 자기 신고 연령 확인의 적정성, 만 14세 도달 시 처리 방법은 법무 검토를 요청했다 (`review-required`)

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 법률 제22조의2·제38조·제64조의2·제71조와 시행령 제17조의2·제44조의4는 2026-10-23에 국가법령정보센터 Open API 현행본과 대조했습니다. 연령 확인 수준과 만 14세 도달 시 처리에 관한 해석은 안내서 원문 대조 전이라 `review-required`입니다.
