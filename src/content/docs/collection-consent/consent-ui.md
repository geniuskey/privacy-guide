---
title: 동의 화면과 동의 기록 설계 — 제22조 구분 동의 구현하기
description: 개인정보 보호법 제22조와 시행령 제17조에 따른 구분 동의, 중요 내용 표시, 동의 없이 처리하는 정보의 구분 고지, 마케팅 동의를 UI와 동의 기록 데이터 모델로 구현하는 방법을 정리합니다.
category: collection-consent
status: review-required
lastVerified: 2026-10-23
tags: [동의, 동의 UI, 마케팅 동의, 동의 기록, 회원가입, 처리근거]
related: [collection-consent/marketing-messages, collection-consent/lawful-basis, collection-consent/children, collection-consent/privacy-policy, laws/related-laws, app-security/data-subject-rights, case-studies/signup-service]
sources: [pipa, pipa-decree, pipc-integrated-guide, network-act]
legalBasis:
  - source: pipa
    article: 제22조제1항
    kind: law
    summary: 각각의 동의 사항을 구분하여 명확하게 인지할 수 있도록 알리고 동의를 받아야 하며, 수집·이용, 제3자 제공, 목적 외 이용·제공, 민감정보, 고유식별정보, 홍보·판매 권유 등은 각각 동의를 받아야 함
    status: verified
  - source: pipa
    article: 제22조제2항
    kind: law
    summary: 서면(전자문서 포함)으로 동의를 받을 때 대통령령으로 정하는 중요한 내용을 보호위원회 고시 방법에 따라 명확히 표시하여 알아보기 쉽게 해야 함
    status: verified
  - source: pipa
    article: 제22조제3항
    kind: law
    summary: 동의 없이 처리할 수 있는 개인정보는 항목과 법적 근거를 동의 기반 정보와 구분하여 처리방침으로 공개하거나 서면등의 방법으로 알려야 하며 입증책임은 처리자에게 있음
    status: verified
  - source: pipa
    article: 제22조제5항
    kind: law
    summary: 선택 동의 사항, 목적 외 이용·제공 동의(제1항제3호), 홍보·판매 권유 동의(제1항제7호)를 하지 않는다는 이유로 재화·서비스 제공을 거부할 수 없음
    status: verified
  - source: pipa
    article: 제15조제2항, 제16조제2항·제3항
    kind: law
    summary: 동의 시 목적·항목·보유기간·거부권과 불이익을 알려야 하고, 최소한의 정보 외 수집에 동의하지 않을 수 있다는 사실을 구체적으로 알려야 하며, 이를 이유로 서비스 제공을 거부할 수 없음
    status: verified
  - source: pipa-decree
    article: 제17조제1항·제2항
    kind: decree
    summary: 동의의 4가지 조건(자유로운 의사, 구체적·명확한 내용, 쉽게 읽을 수 있는 문구, 명확한 표시 방법)과 동의를 받는 6가지 방법(서면, 전화, 전화+인터넷, 홈페이지, 전자우편, 준하는 방법)
    status: verified
  - source: pipa-decree
    article: 제17조제3항·제4항·제5항
    kind: decree
    summary: 명확히 표시할 중요한 내용(홍보·판매 권유 연락 사실, 민감정보, 여권·운전면허·외국인등록번호, 보유기간, 제공받는 자와 그 목적)과 선택 가능 사실 표시, 제22조제3항의 서면등의 방법
    status: verified
  - source: network-act
    article: 제50조제1항, 제3항
    kind: law
    summary: 광고성 정보 전송에는 개인정보 처리 동의와 별도로 수신자의 명시적 사전 동의가 필요하고, 오후 9시~오전 8시 전송은 별도 동의 필요(전자우편 예외, 시행령 제61조제2항)
    status: verified
  - source: pipc-integrated-guide
    kind: guide
    summary: 동의 화면 구성 예시와 "필수/선택" 표기 관행에 대한 해석(원문 쪽수 확인 필요)
    status: review-required
---

## 한 문장 결론

동의는 **목적별로 쪼개서 각각 받고**(제22조제1항), 동의 없이 처리하는 정보는 **동의 화면 밖에서 구분해 알리며**(제22조제3항), 동의 기록에는 **어떤 고지문 버전에 어떤 방법으로 무엇을 선택했는지**를 남겨야 나중에 입증할 수 있습니다.

## 적용 조건과 예외

### 언제 동의 화면이 필요한가

동의 화면은 처리 근거가 **동의**인 경우에만 필요합니다. 계약 이행(제15조제1항제4호), 법령상 의무(제2호), 정당한 이익(제6호)으로 처리하는 정보는 동의를 받는 대상이 아니라 **구분해서 알리는 대상**입니다. 근거를 먼저 고르세요. → [처리 근거 고르기](/collection-consent/lawful-basis/)

### 반드시 따로 받아야 하는 동의 (제22조제1항 각 호)

| 호 | 동의 대상 | 근거 조문 | UI에서 |
| --- | --- | --- | --- |
| 1 | 수집·이용 | 제15조제1항제1호 | 목적 단위로 체크박스 분리 |
| 2 | 제3자 제공 | 제17조제1항제1호 | 제공받는 자별로 분리 권장 |
| 3 | 목적 외 이용·제공 | 제18조제2항제1호 | 별도 화면·별도 시점 |
| 4 | 제공받은 자의 목적 외 이용·제공 | 제19조제1호 | 제공받은 쪽이 받음 |
| 5 | 민감정보 처리 | 제23조제1항제1호 | 다른 동의와 별도 |
| 6 | 고유식별정보 처리 | 제24조제1항제1호 | 다른 동의와 별도 |
| 7 | 재화·서비스 홍보, 판매 권유 | 제22조제1항제7호 | 마케팅 동의, 선택 |
| 8 | 그 밖에 대통령령으로 정하는 경우 | 시행령 | 현행 시행령 제17조에서 별도 항목을 확인하지 못함(`review-required`) |

### 동의하지 않아도 서비스를 거부할 수 없는 것 (제22조제5항, 제16조제3항)

- 선택적으로 동의할 수 있는 사항
- 목적 외 이용·제공 동의(제1항제3호)
- 홍보·판매 권유 동의(제1항제7호)
- 필요한 최소한의 정보 외의 개인정보 수집(제16조제3항)

마케팅 동의를 하지 않았다고 회원가입을 막거나 쿠폰 외의 기본 기능을 제한하면 이 조항과 충돌할 수 있습니다. 혜택 제공과 연결할 때는 법무 검토를 받으세요(`review-required`).

### 광고 전송은 별도 법률도 확인

제22조제1항제7호는 홍보·판매 권유를 위한 **개인정보 처리**에 대한 동의입니다. 이메일·문자·푸시로 광고를 **전송**하는 행위에는 정보통신망법 제50조가 따로 적용됩니다. 채널별 명시적 사전 동의, 야간(21~08시) 별도 동의, 수신거부 처리, 2년마다 동의 확인이 필요합니다. → [광고성 정보 전송과 마케팅 수신동의](/collection-consent/marketing-messages/)

## 실제 법적 근거

- 제22조제1항: 동의를 받을 때 **각각의 동의 사항을 구분하여** 정보주체가 명확하게 인지할 수 있도록 알리고 동의를 받아야 합니다. 법정대리인(제22조의2제1항)도 포함됩니다.
- 제22조제2항: 서면(전자문서 포함)으로 받을 때 대통령령으로 정하는 **중요한 내용**을 보호위원회 고시 방법에 따라 **명확히 표시**해야 합니다.
- 시행령 제17조제1항: 동의는 ① 자유로운 의사 ② 구체적이고 명확한 내용 ③ 쉽게 읽고 이해할 수 있는 문구 ④ 동의 여부를 명확하게 표시할 수 있는 방법 — **네 조건을 모두** 충족해야 합니다.
- 시행령 제17조제2항: 동의 방법은 서면 서명·날인(1호), 전화(2호), 전화 + 인터넷주소 확인 후 재전화(3호), **인터넷 홈페이지 게재 후 동의 여부 표시(4호)**, 전자우편 회신(5호), 이에 준하는 방법(6호).
- 시행령 제17조제3항(중요한 내용): ① 홍보·판매 권유 등을 위해 **연락할 수 있다는 사실** ② 민감정보, 여권번호·운전면허번호·외국인등록번호 ③ 보유 및 이용 기간 ④ 제공받는 자와 그 이용 목적.
- 시행령 제17조제4항: 제22조제1항 각 호의 동의를 받을 때 **동의 여부를 선택할 수 있다는 사실**을 명확하게 알 수 있도록 표시해야 합니다.
- 시행령 제17조제5항: 제22조제3항의 "대통령령으로 정하는 방법"은 서면, 전자우편, 팩스, 전화, 문자전송 또는 이에 상당하는 방법(서면등의 방법).
- 제15조제2항: 동의 시 알릴 4가지 — 목적, 항목, 보유·이용 기간, 거부권과 불이익. 변경 시 다시 알리고 동의.

(현행 법률 제21445호·시행령 제36671호 기준. 국가법령정보센터 원문과 대조함. 제22조제2항이 위임한 표시 방법 고시는 출처 레지스트리에 없고 원문도 확인하지 못했습니다 — `review-required`.)

## 개발자용 실무 해설

1. **동의 단위 = 목적 단위입니다.** "서비스 이용약관 및 개인정보 처리 전체 동의" 하나로 묶으면 제22조제1항의 구분 요건을 충족하기 어렵습니다. "전체 동의" 버튼은 편의 기능으로 둘 수 있지만, 개별 항목이 펼쳐져 있고 각각 해제 가능해야 합니다(구체 UI 기준은 안내서 확인 필요, `review-required`).
2. **사전 체크는 "자유로운 의사"(시행령 제17조제1항제1호)와 "선택 가능 사실 표시"(제4항)에 비추어 위험합니다.** 선택 동의는 기본값을 미체크로 둡니다.
3. **중요한 내용은 화면에서 눈에 띄게 표시합니다.** 시행령 제17조제3항 항목(마케팅 연락, 민감정보, 여권번호 등, 보유기간, 제공받는 자)은 접힌 약관 본문 안에만 두지 말고 요약 영역에 노출합니다. 글씨 크기·색상 등 구체 방법은 보호위원회 고시를 확인해야 합니다(`review-required`).
4. **동의 없이 처리하는 정보는 동의 화면에 섞지 않습니다.** 계약 이행에 필요한 항목은 "필수 동의" 체크박스가 아니라 "서비스 제공을 위해 처리하는 정보" 안내로 구분 표시하고 처리방침에 근거와 함께 공개합니다(제22조제3항).
5. **동의는 이벤트로 저장합니다.** 현재 상태 컬럼(`marketing_opt_in=true`)만 두면 언제, 어떤 문구에, 어떤 채널로 동의했는지 입증할 수 없습니다. 추가 전용(append-only) 이벤트 로그 + 현재 상태 뷰로 설계합니다.
6. **고지문이 바뀌면 재동의가 필요할 수 있습니다.** 제15조제2항 후단에 따라 목적·항목·기간·거부권 중 하나라도 바뀌면 다시 알리고 동의를 받아야 합니다. 고지문 버전을 해시로 관리하면 영향 받는 사용자를 쿼리로 찾을 수 있습니다.

## 권장 설계

```text
ConsentPurpose (정의 — 코드 저장소에서 버전 관리)
├─ id: "marketing-email"
├─ article: "제22조제1항제7호"
├─ required: false                  ← 선택 동의 (제22조제5항)
├─ items: ["email", "name"]
├─ purpose_text, retention_text, refusal_text   ← 제15조제2항 4개 고지
├─ highlight: ["contact_for_marketing", "retention"]  ← 시행령 제17조제3항
└─ notice_version: sha256(고지문 전체)

ConsentEvent (append-only)
├─ subject_id, purpose_id, notice_version
├─ action: GRANT | WITHDRAW
├─ method: WEB_FORM | EMAIL | PHONE | PAPER     ← 시행령 제17조제2항
├─ actor: SELF | LEGAL_GUARDIAN                  ← 제22조의2
├─ occurred_at, channel, ip_hash (선택)
└─ evidence_ref (서면 스캔본, 통화 녹취 ID 등)
```

화면 구성 예시:

```text
[ ] 전체 동의 (아래 선택 항목 포함)          ← 편의 기능
────────────────────────────────────────
서비스 제공을 위해 처리하는 정보 (동의 대상 아님, 제15조제1항제4호)
  이메일, 비밀번호 — 계정 생성·로그인 · 탈퇴 시까지   [자세히]
────────────────────────────────────────
[ ] (선택) 맞춤 추천을 위한 관심사 수집·이용     [목적·항목·기간·거부권 보기]
[ ] (선택) 이벤트·혜택 안내를 위한 개인정보 이용  ← 연락할 수 있다는 사실을 강조 표시
     동의하지 않아도 회원가입과 서비스 이용에 제한이 없습니다.
```

## 위험한 설계

- "필수 동의"에 계약 이행 항목과 마케팅 항목을 함께 넣고 하나의 체크박스로 처리
- 선택 동의 체크박스가 기본으로 체크된 상태
- 마케팅 미동의 시 가입 버튼 비활성화
- 동의 상태를 `users.marketing_opt_in` boolean 하나로만 저장하고 이력·고지문 버전이 없음
- 고지문을 CMS에서 수정해도 버전이 바뀌지 않아 누가 어느 문구에 동의했는지 알 수 없음
- 동의 철회 버튼이 동의 버튼보다 찾기 어려운 위치에 있음(제38조제4항은 권리행사 절차가 수집 절차보다 어렵지 않도록 요구)

## Python/TypeScript 구현 예제

```python
# FastAPI: 동의 이벤트 기록 (append-only) + 고지문 버전 검증
from datetime import datetime, timezone
from enum import Enum
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class Action(str, Enum):
    GRANT = "grant"
    WITHDRAW = "withdraw"

PURPOSES = {
    "marketing-email": {"required": False, "notice_version": "9f2c…"},
    "interest-profile": {"required": False, "notice_version": "41ab…"},
}

class ConsentIn(BaseModel):
    purpose_id: str
    action: Action
    notice_version: str

EVENTS: list[dict] = []  # 실제로는 INSERT 전용 테이블

@app.post("/me/consents")
def record_consent(body: ConsentIn, subject_id: str = "from-session"):
    purpose = PURPOSES.get(body.purpose_id)
    if purpose is None:
        raise HTTPException(404, "알 수 없는 동의 목적")
    if body.action is Action.GRANT and body.notice_version != purpose["notice_version"]:
        # 사용자가 본 고지문이 최신이 아니면 다시 보여준다 (제15조제2항 후단)
        raise HTTPException(409, "고지문이 변경되었습니다")
    EVENTS.append({
        "subject_id": subject_id,
        "purpose_id": body.purpose_id,
        "action": body.action.value,
        "notice_version": body.notice_version,
        "method": "WEB_FORM",  # 시행령 제17조제2항제4호
        "occurred_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"ok": True}
```

```ts
// 현재 동의 상태는 이벤트에서 계산한다. 선택 동의 미동의가 가입을 막지 않는지 테스트한다.
type ConsentEvent = {
  purposeId: string;
  action: 'grant' | 'withdraw';
  noticeVersion: string;
  occurredAt: string;
};

export function currentConsents(events: ConsentEvent[]): Map<string, ConsentEvent> {
  const state = new Map<string, ConsentEvent>();
  for (const e of [...events].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))) {
    if (e.action === 'grant') state.set(e.purposeId, e);
    else state.delete(e.purposeId);
  }
  return state;
}

export function canSignUp(form: { email: string; password: string }): boolean {
  // 선택 동의 여부는 가입 가능 여부에 영향을 주지 않는다 (제22조제5항)
  return Boolean(form.email && form.password);
}
```

전체 실행 가능한 예제와 테스트는 [구현 예제](/tools/examples/)를 참고하세요.

## 개발 체크리스트

- [ ] 동의 대상 항목과 동의 없이 처리하는 항목이 화면과 처리방침에서 구분되어 있다
- [ ] 수집·이용, 제3자 제공, 민감정보, 고유식별정보, 마케팅 동의가 각각 분리되어 있다
- [ ] 각 동의에 목적·항목·보유기간·거부권과 불이익(제15조제2항)이 표시된다
- [ ] 시행령 제17조제3항의 중요한 내용이 요약 영역에 강조 표시된다 (표시 방법 고시는 `review-required`)
- [ ] 선택 동의는 기본 미체크이고, 미동의해도 가입·기본 기능이 동작한다(테스트 있음)
- [ ] 동의 이벤트에 고지문 버전, 방법, 시각, 주체(본인/법정대리인)가 저장된다
- [ ] 고지문 변경 시 영향 받는 사용자를 찾아 재동의를 받는 절차가 있다
- [ ] 동의 철회가 동의만큼 쉽게 가능하다
- [ ] 광고 전송 수신동의를 채널별로 받고, 야간 수신동의를 따로 받는다 (정보통신망법 제50조제1항·제3항)

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 법률 제15조·제16조·제22조와 시행령 제17조는 2026-10-23에 국가법령정보센터 Open API 현행본과 대조했습니다. 정보통신망법 제50조도 같은 날 현행 원문과 대조했습니다. 제22조제2항의 표시 방법 고시와 안내서의 화면 예시는 원문 대조 전이라 `review-required`입니다.
