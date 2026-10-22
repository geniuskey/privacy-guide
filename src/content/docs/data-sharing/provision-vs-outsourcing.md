---
title: 제3자 제공과 업무위탁 구분하기 — SaaS·클라우드·외부 API
description: 개인정보를 외부로 보내는 연동이 제3자 제공(제17조)인지 처리위탁(제26조)인지에 따라 필요한 근거와 공개·계약 의무가 달라집니다. 판단 흐름과 수탁자 관리 체크를 정리합니다.
category: data-sharing
status: review-required
lastVerified: 2026-10-23
tags: [제3자제공, 위탁, 수탁자, 외부API, SaaS, 처리방침]
related: [data-sharing/cross-border-transfer, data-sharing/public-data-and-downloads, collection-consent/privacy-policy, collection-consent/lawful-basis, ai-llm/llm-api-integration]
sources: [pipa, pipa-decree, safety-notice, pipc-integrated-guide]
legalBasis:
  - source: pipa
    article: 제17조제1항, 제2항
    kind: law
    summary: 제3자 제공(공유 포함)은 동의 또는 제15조제1항제2호·제3호·제5호~제7호에 따라 수집한 목적 범위에서 가능. 동의 시 제공받는 자, 이용 목적, 항목, 보유·이용 기간, 거부권·불이익을 고지
    status: verified
  - source: pipa
    article: 제17조제4항
    kind: law
    summary: 당초 수집 목적과 합리적으로 관련된 범위에서 대통령령(시행령 제14조의2)에 따라 동의 없이 제공 가능
    status: verified
  - source: pipa
    article: 제18조
    kind: law
    summary: 제17조제1항 범위를 초과한 제3자 제공 금지와 예외(별도 동의, 다른 법률의 특별한 규정 등), 별도 동의 시 고지 사항
    status: verified
  - source: pipa
    article: 제19조
    kind: law
    summary: 제공받은 자는 별도 동의나 다른 법률의 특별한 규정이 없으면 제공받은 목적 외 이용·제3자 제공 금지
    status: verified
  - source: pipa
    article: 제26조
    kind: law
    summary: 위탁은 목적 외 처리 금지·보호조치 등을 포함한 문서로 하고, 위탁 업무와 수탁자를 공개하며, 수탁자를 교육·감독. 재위탁은 위탁자 동의 필요
    status: verified
  - source: pipa-decree
    article: 제28조
    kind: decree
    summary: 위탁 문서에 포함할 사항(목적·범위, 재위탁 제한, 접근 제한 등 안전조치, 관리 현황 점검 등 감독, 손해배상 책임)과 홈페이지 지속 게재 등 공개 방법
    status: verified
  - source: pipa
    article: 제30조제1항제3호, 제4호
    kind: law
    summary: 처리방침에 제3자 제공에 관한 사항과 처리 위탁에 관한 사항(해당 시) 포함
    status: verified
  - source: safety-notice
    article: 제4조제1항제16호
    kind: notice
    summary: 내부 관리계획에 수탁자에 대한 관리 및 감독에 관한 사항 포함
    status: verified
  - source: pipc-integrated-guide
    kind: guide
    summary: 제공과 위탁의 구분 기준(누구의 이익·업무를 위해 처리되는가 등)에 대한 해석(원문 쪽수 확인 필요)
    status: review-required
---

## 한 문장 결론

외부로 개인정보를 보내는 연동은 **"받는 쪽이 자기 목적·이익을 위해 쓰는가(제3자 제공, 제17조)"** 아니면 **"우리 업무를 대신 처리하는가(업무위탁, 제26조)"** 로 나뉘고, 제공이면 별도 근거(대개 동의)가, 위탁이면 **문서 계약·수탁자 공개·감독**이 필요합니다. 특정 연동이 어디에 해당하는지는 계약 구조와 실제 데이터 이용 방식에 따라 달라지므로 법무 확인이 필요합니다(`review-required`).

## 적용 조건과 예외

| 질문 | 제3자 제공 쪽 신호 | 업무위탁 쪽 신호 |
| --- | --- | --- |
| 누구의 업무인가 | 받는 자의 사업 (예: 제휴사 마케팅) | 우리 서비스 운영 (예: 메일 발송, 호스팅, 결제 대행 일부) |
| 받는 자가 데이터를 자기 목적에 쓰는가 | 쓴다 (자체 분석, 자사 서비스 제공) | 계약상 금지되고 우리 지시대로만 처리 |
| 관리·감독 | 우리가 통제하지 않음 | 우리가 교육·감독 (제26조제4항) |
| 근거 | 제17조제1항 (동의 등) | 제26조 문서·공개 (별도 동의 규정 없음) |
| 받은 뒤의 제한 | 제19조: 제공받은 목적 외 이용 금지 | 제26조제5항: 위탁 업무 범위 초과 이용 금지 |

자주 나오는 연동 (판단은 모두 `review-required`, 계약서와 실제 처리 방식 확인 필요):

| 연동 | 흔한 분류 | 확인 포인트 |
| --- | --- | --- |
| IaaS/PaaS 클라우드 (서버, DB, 스토리지) | 위탁 또는 위탁·보관으로 다루는 경우가 많음 | 사업자가 데이터에 접근·이용하는지, 리전이 국외인지 → [국외 이전](/data-sharing/cross-border-transfer/) |
| 이메일·SMS 발송 서비스 | 위탁 | 발송 후 데이터 보관 기간, 재위탁(하위 처리자) |
| 고객지원 SaaS (헬프데스크, 채팅) | 위탁 | 벤더의 제품 개선용 데이터 이용 조항 |
| 결제대행(PG) | 위탁과 제공이 섞일 수 있음 | PG사가 자기 의무(법령)로 처리하는 부분 |
| 광고·분석 SDK | 제공 소지 있음 | SDK 사업자가 자기 목적(타깃팅, 학습)으로 쓰는지 |
| 외부 LLM API | 약관에 따라 다름 | 입력 데이터 학습 이용 여부, 보관 기간 → [LLM API 연동](/ai-llm/llm-api-integration/) |
| 계열사·제휴사로 회원 정보 전달 | 제공 | 동의 항목에 제공받는 자·목적·항목·기간 |

## 실제 법적 근거

- 「개인정보 보호법」 제17조
  - 제1항: 정보주체의 동의를 받은 경우(1호), 제15조제1항제2호·제3호·제5호~제7호에 따라 수집한 목적 범위에서 제공하는 경우(2호)에 제3자에게 제공(공유 포함)할 수 있습니다. 2호의 목록에 **제15조제1항제4호(계약 체결·이행)가 빠져 있다**는 점에 주의하세요. 계약 이행 근거로 수집한 정보를 그 근거만으로 제3자에게 제공할 수 있다고 보기는 어렵습니다.
  - 제2항: 동의를 받을 때 ① 제공받는 자 ② 제공받는 자의 이용 목적 ③ 제공 항목 ④ 제공받는 자의 보유·이용 기간 ⑤ 거부권과 불이익을 알립니다.
  - 제4항: 당초 수집 목적과 합리적으로 관련된 범위에서 시행령 제14조의2의 고려사항(관련성, 예측 가능성, 부당한 침해 여부, 가명처리·암호화 등)에 따라 동의 없이 제공할 수 있습니다.
- 같은 법 제18조: 제17조제1항 범위를 초과한 제공은 금지되며, 별도 동의, 다른 법률의 특별한 규정, 급박한 생명·신체·재산 이익 등 제2항 각 호의 경우에만 예외가 됩니다(제5호~제9호는 공공기관 한정).
- 같은 법 제19조: 제공받은 자는 별도 동의나 다른 법률의 특별한 규정이 없으면 목적 외 이용이나 제3자 재제공을 할 수 없습니다.
- 같은 법 제26조
  - 제1항: 위탁은 ① 위탁 목적 외 처리 금지 ② 기술적·관리적 보호조치 ③ 대통령령으로 정한 사항을 포함한 **문서**로 합니다.
  - 제2항: 위탁 업무 내용과 수탁자(재수탁자 포함)를 정보주체가 언제든지 쉽게 확인할 수 있게 공개합니다.
  - 제3항: 홍보·판매 권유 업무 위탁은 정보주체에게 알려야 합니다(시행령 제28조제4항: 서면등의 방법).
  - 제4항: 수탁자를 교육하고 처리 현황 점검 등으로 감독합니다.
  - 제5항·제6항: 수탁자는 위탁 범위를 넘어 이용·제공할 수 없고, 재위탁하려면 위탁자의 동의를 받아야 합니다.
- 시행령 제28조제1항: 위탁 문서에 ① 위탁업무의 목적·범위 ② 재위탁 제한 ③ 접근 제한 등 안전성 확보 조치 ④ 관리 현황 점검 등 감독 ⑤ 수탁자 의무 위반 시 손해배상 등 책임을 포함합니다. 제2항: 공개는 위탁자 홈페이지에 지속 게재하는 방법으로 합니다.
- 같은 법 제30조제1항제3호·제4호: 처리방침에 제3자 제공, 처리 위탁에 관한 사항(해당 시)을 적습니다.
- 안전성 확보조치 기준 제4조제1항제16호: 내부 관리계획에 수탁자 관리·감독 사항을 포함합니다.

(2026-10-23 원문 대조. 제공·위탁 구분 기준에 대한 통합 안내서의 해석은 원문 대조 전.)

## 개발자용 실무 해설

1. **연동마다 "데이터 흐름 카드"를 만듭니다.** 수신자, 보내는 항목, 목적, 분류(제공/위탁/국외 이전), 근거, 계약 문서 링크, 처리방침 반영 여부를 한 장에 둡니다. 새 SDK·API를 추가하는 PR에서 이 카드를 요구하세요.
2. **보내는 항목을 코드로 고정합니다.** 외부 클라이언트 함수는 전체 사용자 객체가 아니라 허용된 필드만 받는 타입을 씁니다. 위탁 계약의 "범위"를 코드가 넘지 않게 하는 장치입니다.
3. **벤더 약관의 "서비스 개선" 조항을 확인합니다.** 수탁자가 받은 데이터를 자기 제품 개선·학습에 쓰면 위탁 범위를 넘거나(제26조제5항) 제공으로 볼 여지가 생깁니다. 이 판단은 법무 검토 대상입니다(`review-required`).
4. **하위 처리자 목록을 추적합니다.** 수탁자가 다른 업체에 재위탁하면 위탁자 동의가 필요하고(제26조제6항), 공개 대상에도 포함됩니다(제2항 괄호). 벤더의 sub-processor 목록 변경 알림을 구독하세요.
5. **처리방침과 코드가 같은 원천을 보게 합니다.** 연동 레지스트리에서 처리방침의 위탁·제공 표를 생성하면 누락을 줄일 수 있습니다. → [처리방침](/collection-consent/privacy-policy/)

## 권장 설계

```yaml
# data-flows/sendgrid.yaml (예시)
recipient: "메일 발송 대행사"
classification: outsourcing          # outsourcing | provision | (+ cross_border)
legal_basis: "pipa-26"
fields: [email, display_name]
purpose: "가입 확인·비밀번호 재설정 메일 발송"
contract:
  document: "DPA-2026-03.pdf"
  includes: [purpose_scope, subcontract_limit, safeguards, audit, liability]  # 시행령 제28조제1항
sub_processors_url: "https://vendor.example/subprocessors"
cross_border: { country: "US", see: "data-sharing/cross-border-transfer" }
privacy_policy_section: "위탁"
review: { status: review-required, owner: "privacy@company" }
```

- CI에서 외부 HTTP 클라이언트 모듈이 추가되면 대응하는 `data-flows/*.yaml`이 있는지 검사합니다.
- 제공으로 분류된 흐름은 동의 레코드(제17조제2항 5개 항목 고지 버전)가 있는 사용자만 전송합니다.
- 수탁자 점검(제26조제4항)을 위해 연 1회 등 주기를 정하고 점검 결과를 기록합니다(주기는 내부 관리계획).

## 위험한 설계

- `analytics.track(user)`처럼 사용자 객체 전체를 외부 SDK로 전송
- 벤더 계약서에 목적 외 처리 금지, 재위탁 제한, 감독 조항이 없음
- 처리방침의 위탁 표가 실제 연동과 맞지 않음
- 제휴사 제공을 "업무 위탁"으로 표기해 동의를 생략
- 계약 이행 근거로 수집한 정보를 동의 없이 제휴사에 제공 (제17조제1항제2호 목록에 4호 없음)
- 수탁사 직원에게 공유 계정으로 관리 콘솔 접근 허용 → [RBAC 접근권한](/auth-access/access-control/)

## Python/TypeScript 구현 예제

```python
# 외부 전송 게이트: 등록된 데이터 흐름의 허용 필드만 보내고, 제공은 동의를 확인한다
from dataclasses import dataclass
from typing import Literal

@dataclass(frozen=True)
class DataFlow:
    recipient: str
    classification: Literal["outsourcing", "provision"]
    fields: frozenset[str]
    consent_purpose: str | None = None   # provision일 때 필수

FLOWS = {
    "mailer": DataFlow("메일 발송 대행사", "outsourcing", frozenset({"email", "display_name"})),
    "partner_coupon": DataFlow("제휴사", "provision", frozenset({"email"}), "partner-share"),
}

def outbound_payload(flow_id: str, user: dict, consents: set[str]) -> dict:
    flow = FLOWS[flow_id]                         # 미등록 흐름은 KeyError → 전송 불가
    if flow.classification == "provision" and flow.consent_purpose not in consents:
        raise PermissionError(f"{flow.recipient} 제공 동의가 없습니다 (제17조제1항제1호)")
    return {k: user[k] for k in flow.fields if k in user}
```

```ts
// 수탁자 레지스트리 → 처리방침 위탁 표 생성 (제26조제2항, 시행령 제28조제2항)
type Processor = { name: string; task: string; subProcessors: string[]; country?: string };

export function renderOutsourcingTable(ps: Processor[]): string {
  const rows = ps.map((p) => `| ${p.name} | ${p.task} | ${p.subProcessors.join(', ') || '-'} |`);
  return ['| 수탁자 | 위탁 업무 | 재수탁자 |', '| --- | --- | --- |', ...rows].join('\n');
}
```

전체 실행 가능한 예제와 테스트는 [구현 예제](/tools/examples/)를 참고하세요.

## 개발 체크리스트

- [ ] 개인정보를 외부로 보내는 모든 연동이 레지스트리에 등록되어 있다
- [ ] 연동마다 제공/위탁 분류와 근거가 있고, 분류 판단은 법무 확인을 받았다 (`review-required`)
- [ ] 위탁 계약 문서에 시행령 제28조제1항 5개 사항이 포함되어 있다
- [ ] 수탁자와 재수탁자가 처리방침(홈페이지)에 공개되어 있다
- [ ] 제공 흐름은 제17조제2항 5개 사항을 고지한 동의가 있는 경우에만 실행된다
- [ ] 외부 전송 코드는 허용 필드만 보낸다
- [ ] 수탁자 교육·점검 주기와 결과 기록이 있다
- [ ] 국외 수신자는 국외 이전 요건도 확인했다

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 법률·시행령·고시 조문은 2026-10-23 원문과 대조했습니다. 제공과 위탁의 구분 기준에 대한 행정기관 해석과 개별 서비스의 분류는 `review-required`입니다.
