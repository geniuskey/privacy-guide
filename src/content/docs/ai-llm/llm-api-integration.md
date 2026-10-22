---
title: 외부 LLM API 연동 — 프롬프트도 개인정보 처리다
description: 사용자 입력과 내부 데이터를 서비스형 LLM API로 보낼 때 처리 근거, 위탁·제3자 제공 판단, 국외 이전, 전송 전 필터링을 기능 설계 단계에서 정리합니다.
category: ai-llm
status: review-required
lastVerified: 2026-10-23
tags: [LLM, 생성형AI, 국외이전, 업무위탁, 마스킹, 처리근거]
related: [data-sharing/provision-vs-outsourcing, data-sharing/cross-border-transfer, app-security/log-masking, case-studies/llm-support-chatbot, collection-consent/privacy-policy, ai-llm/ai-training-data]
sources: [pipa, pipa-decree, safety-notice, pipc-genai-guide, pipc-privacy-policy-guide, pipc-integrated-guide, owasp-asvs-5]
legalBasis:
  - source: pipa
    article: 제15조제1항
    kind: law
    summary: 개인정보는 7가지 근거 중 하나에 해당할 때 수집하고 그 수집 목적의 범위에서 이용할 수 있다. LLM 호출도 이 목적 범위 안에 있어야 한다
    status: verified
  - source: pipa
    article: 제3조제1항·제7항
    kind: law
    summary: 목적에 필요한 최소한의 개인정보만 처리하고, 익명·가명으로도 목적을 달성할 수 있으면 익명(불가하면 가명)으로 처리되도록 해야 한다
    status: verified
  - source: pipa
    article: 제26조제1항·제2항·제4항
    kind: law
    summary: 처리 업무를 위탁할 때는 목적 외 처리 금지·기술적 관리적 보호조치 등을 포함한 문서로 하고, 위탁 업무와 수탁자를 공개하며, 수탁자를 교육·감독해야 한다
    status: verified
  - source: pipa
    article: 제17조제1항
    kind: law
    summary: 제3자 제공은 정보주체 동의 또는 제15조제1항제2호·제3호·제5호~제7호에 따라 수집한 목적 범위에서만 가능하다
    status: verified
  - source: pipc-integrated-guide
    kind: guide
    summary: 업무위탁과 제3자 제공을 누구의 업무·이익을 위해 처리되는지로 구분하는 해석. LLM 벤더가 입력 데이터를 자체 목적(모델 개선 등)으로 쓰는 경우 어느 쪽에 해당하는지는 원문 대조와 법무 검토 필요
    status: review-required
  - source: pipa
    article: 제28조의8제1항·제2항
    kind: law
    summary: 국외 이전(제공·처리위탁·보관)은 별도 동의, 계약 이행을 위한 처리위탁·보관으로서 제2항 사항을 처리방침에 공개하거나 알린 경우 등에만 가능하다. 제2항은 이전 항목, 국가·시기·방법, 이전받는 자, 이용목적·보유기간, 거부 방법을 정한다
    status: verified
  - source: pipa-decree
    article: 제29조의10
    kind: decree
    summary: 국외 이전 시 안전성 확보 조치, 고충처리·분쟁해결 조치 등을 하고 이를 이전받는 자와 미리 협의해 계약내용 등에 반영해야 한다
    status: verified
  - source: pipa-decree
    article: 제31조제1항제2호
    kind: decree
    summary: 국외 이전 시 그 근거와 법 제28조의8제2항 각 호의 사항을 개인정보 처리방침에 포함해야 한다
    status: verified
  - source: safety-notice
    article: 제7조제4항
    kind: notice
    summary: 개인정보를 정보통신망을 통해 인터넷망 구간으로 송·수신할 때는 안전한 암호 알고리즘으로 암호화해야 한다
    status: verified
  - source: pipc-genai-guide
    kind: guide
    summary: 생성형 AI 개발·활용 단계별 개인정보 처리 고려사항(서비스형 LLM 활용 시 입력 데이터 관리, 학습 이용 여부 확인 등)에 관한 권고. 세부 내용·쪽수는 원문 대조 필요
    status: review-required
  - source: pipc-privacy-policy-guide
    kind: guide
    summary: 생성형 AI 서비스의 입력·출력 데이터 처리에 관한 처리방침 공개 항목 권고. 구체 기재 항목은 원문 대조 필요
    status: review-required
  - source: owasp-asvs-5
    article: V14 Data Protection, V16 Security Logging and Error Handling
    kind: standard
    summary: 민감 데이터의 식별·분류·전송 최소화와 로그 내 민감정보 보호에 관한 검증 요구사항(장 단위 인용)
    status: verified
---

## 한 문장 결론

외부 LLM API에 보내는 프롬프트·첨부·검색 결과는 모두 **개인정보의 처리이자 외부 전송**이므로, 호출 경로마다 **처리 근거(제15조) → 벤더 관계(위탁인지 제3자 제공인지) → 국외 이전(제28조의8) → 전송 전 최소화**를 차례로 확인하고, 이 결과를 처리방침과 계약에 반영해야 합니다.

## 적용 조건과 예외

| 상황 | 개인정보 처리 해당 여부 | 먼저 볼 것 |
| --- | --- | --- |
| 사용자가 입력창에 자유 텍스트를 넣고 서버가 그대로 LLM에 전달 | 해당. 사용자가 자기 정보나 **타인 정보**를 넣을 수 있음 | 입력 필터링, 처리방침 공개 |
| 서버가 DB에서 고객 정보를 꺼내 프롬프트에 합침(요약, 답변 초안) | 해당. 처리자가 능동적으로 전송 | 필드 허용목록, 목적 범위 |
| 사내 문서를 임베딩 API로 보내 벡터화 | 문서에 개인정보가 있으면 해당 | 문서 분류, 인덱싱 범위 → [AI 학습·RAG 데이터](/ai-llm/ai-training-data/) |
| 자체 호스팅 모델(사내 GPU)만 사용 | 외부 전송은 없음. 처리 자체는 해당 | 접근통제, 로그 |
| 완전히 익명화된 통계 문장만 전송 | 제58조의2에 해당하면 법 적용 제외 | "더 이상 개인을 알아볼 수 없는지"를 실제로 검증 |

예외와 경계:

- **벤더 관계 판단은 이 문서가 확정하지 않습니다.** 벤더가 위탁받은 범위(우리 서비스 응답 생성)에서만 처리한다면 업무위탁(제26조)으로 볼 여지가 크고, 벤더가 입력을 **자체 모델 학습 등 자기 목적**에 쓴다면 제3자 제공(제17조) 쟁점이 생길 수 있습니다. 어느 쪽인지는 계약 조건과 실제 데이터 흐름을 놓고 법무 검토가 필요합니다(`review-required`).
- **민감정보·고유식별정보**(건강, 주민등록번호 등)는 제23조·제24조의 별도 요건이 있습니다. LLM 전송 목적으로 이런 정보를 새로 처리하는 설계는 피하는 편이 안전합니다. → [민감정보 구분](/sensitive-data/sensitive-vs-personal/), [고유식별정보](/sensitive-data/unique-identifiers/)
- **엔드포인트 리전이 국내여도** 로그·모니터링·장애 대응 등으로 국외에서 조회·보관될 수 있습니다. 벤더 문서로 실제 처리 위치를 확인해야 합니다. 제28조의8제1항은 "조회되는 경우를 포함"한다고 명시합니다.

## 실제 법적 근거

- 「개인정보 보호법」 제15조제1항: 개인정보는 7가지 근거 중 하나에 해당할 때 수집할 수 있고 **"그 수집 목적의 범위에서"** 이용할 수 있습니다. LLM 기능이 당초 목적 밖이라면 제15조제3항(추가적 이용)이나 제18조(목적 외 이용)를 따로 검토해야 합니다.
- 제3조제1항·제7항: 목적에 필요한 최소한만 처리하고, 익명 또는 가명으로 목적을 달성할 수 있으면 그렇게 처리되도록 해야 합니다. 전송 전 마스킹의 법적 연결고리입니다.
- 제26조제1항: 위탁은 ① 위탁업무 수행 목적 외 처리 금지 ② 기술적·관리적 보호조치 ③ 대통령령으로 정한 사항(시행령 제28조제1항: 목적·범위, 재위탁 제한, 접근 제한 등 안전성 확보 조치, 관리 현황 점검 등 감독, 손해배상 책임)을 포함한 **문서**로 해야 합니다. 같은 조 제2항은 위탁 업무와 수탁자(재수탁자 포함)를 공개하도록 하고, 시행령 제28조제2항은 그 방법을 홈페이지 지속 게재로 정합니다.
- 제17조제1항: 제3자 제공은 동의 또는 제15조제1항제2호·제3호·제5호~제7호에 따라 수집한 목적 범위에서만 가능합니다. 계약 이행(4호)으로 수집한 정보를 제3자에게 제공하는 근거는 제17조제1항에 열거되어 있지 않다는 점에 주의하세요.
- 제28조의8제1항: 국외 **제공(조회 포함)·처리위탁·보관**은 원칙적으로 금지되고, 별도 동의(1호), 계약 체결·이행을 위해 처리위탁·보관이 필요한 경우로서 제2항 사항을 처리방침에 공개하거나 서면등의 방법으로 알린 경우(3호, 시행령 제29조의7) 등에만 허용됩니다.
- 시행령 제29조의10: 국외 이전 시 안전성 확보 조치, 고충처리·분쟁해결 조치 등을 이전받는 자와 **미리 협의하고 계약내용 등에 반영**해야 합니다.
- 시행령 제31조제1항제2호: 국외 이전의 근거와 제28조의8제2항 각 호 사항은 처리방침 기재 사항입니다.
- 「개인정보의 안전성 확보조치 기준」 제7조제4항: 인터넷망 구간으로 개인정보를 송·수신할 때는 안전한 암호 알고리즘으로 암호화해야 합니다(TLS 적용).

행정기관 안내서(권고, `review-required`):

- 「생성형 인공지능(AI) 개발·활용을 위한 개인정보 처리 안내서」(2025.8.)는 서비스형 LLM을 활용하는 단계의 고려사항을 다룹니다. 이 문서에서 인용하는 취지(입력 데이터 관리, 벤더의 학습 이용 여부 확인)는 원문 쪽수 대조 전입니다.
- 「개인정보 처리방침 작성지침(2026)」의 생성형 AI 입력·출력 데이터 관련 공개 항목도 원문 대조 전입니다. 처리방침 문구를 확정하기 전에 지침 원문을 확인하세요.

(현행 법률 제21445호, 시행령 제36671호, 고시 제2026-9호 기준. 조문은 국가법령정보센터 원문과 대조함.)

## 개발자용 실무 해설

1. **호출 경로마다 "데이터 카드"를 만듭니다.** 기능 이름, 프롬프트에 들어가는 필드, 근거, 벤더, 엔드포인트 리전, 벤더 보존 기간, 학습 이용 여부를 한 장에 적습니다. 이 카드가 처리방침의 위탁·국외 이전 항목과 1:1로 대응해야 합니다.
2. **필드는 허용목록으로 고릅니다.** `user` 객체를 통째로 직렬화해 프롬프트에 넣지 마세요. 응답 생성에 필요한 필드만 명시적으로 고르는 빌더를 두면 새 컬럼이 추가돼도 자동으로 새지 않습니다.
3. **자유 텍스트는 전송 전에 탐지·마스킹합니다.** 정규식은 주민등록번호·전화번호·이메일·카드번호처럼 형식이 있는 값에 효과적이고, 이름·주소는 놓치기 쉽습니다. 탐지는 "완벽한 차단"이 아니라 "위험 감소" 장치라는 점을 설계 문서에 적어 두세요(프로젝트 권장사항).
4. **벤더 설정을 코드로 고정합니다.** 학습 이용 opt-out(또는 기본 미사용 여부), 데이터 보존 기간, 무보존(zero retention) 옵션, 리전은 콘솔 클릭이 아니라 계약서·벤더 문서·IaC 설정으로 확인하고, 확인일을 남깁니다. 벤더 약관은 바뀌므로 주기 점검 항목에 넣습니다.
5. **프롬프트·응답 로그도 개인정보 파일입니다.** 디버깅용으로 전문을 남기면 원본 DB보다 오래, 더 넓은 권한으로 보관되기 쉽습니다. 기본은 메타데이터(요청 ID, 토큰 수, 모델, 마스킹 건수)만 남기고, 전문은 짧은 보존 기간과 별도 권한으로 분리합니다. → [로그 마스킹](/app-security/log-masking/), [보존·파기](/storage-retention/retention-destruction/)
6. **응답도 검사합니다.** 모델이 프롬프트에 들어간 다른 사용자 정보나 검색 결과를 그대로 복창할 수 있습니다. 출력 단계에서도 같은 PII 탐지기를 돌리고, 화면에 노출할 수 있는 정보인지 확인합니다.

## 권장 설계

```text
[Client] ──입력──▶ [API 서버]
                    ├─ 1. 기능별 정책 조회 (LlmCallPolicy)
                    ├─ 2. 허용목록 필드만 컨텍스트에 포함
                    ├─ 3. 자유 텍스트 PII 탐지 → 마스킹/차단
                    ├─ 4. 벤더 호출 (TLS, 리전 고정, 학습 미사용 옵션)
                    ├─ 5. 응답 PII 재검사
                    └─ 6. 메타데이터 로그 (전문은 별도 저장소, 짧은 보존)

LlmCallPolicy
├─ feature: "ticket-summary"
├─ basis: CONTRACT (제15조제1항제4호, 상담 처리)
├─ vendor: "vendor-x" (위탁 / 제3자 제공 판단: review-required)
├─ region: "kr" | "us" ...  → 국외면 처리방침 제28조의8제2항 항목 기재
├─ allowed_fields: [ticket_text, product_name]
├─ vendor_retention: "30d (계약서 §x, 확인일 2026-10-23)"
├─ training_use: false (계약·설정 근거 링크)
└─ prompt_log_retention_days: 7
```

- 정책이 없는 기능에서 LLM 클라이언트를 호출하면 예외를 던지게 합니다.
- 벤더·리전·보존 기간이 바뀌면 처리방침 변경 PR이 함께 올라오도록 CODEOWNERS나 CI 검사로 묶습니다. → [처리방침](/collection-consent/privacy-policy/)
- 국외 이전에 해당하면 [국외 이전](/data-sharing/cross-border-transfer/) 문서의 공개 항목을 채웁니다.

## 위험한 설계

- `JSON.stringify(user)`를 프롬프트에 그대로 넣는 코드
- 개발자 개인 API 키·개인 계정(학습 이용 기본값이 켜져 있을 수 있음)으로 운영 데이터를 호출
- 프롬프트와 응답 전문을 APM·에러 트래커에 무기한 저장
- 벤더의 학습 이용·보존 정책을 확인하지 않고 "API는 학습에 안 쓴다더라"는 전언에 의존
- 국외 리전 벤더를 쓰면서 처리방침에 위탁·국외 이전 항목이 없음
- 사용자가 업로드한 파일(신분증 사진, 진단서 등)을 OCR 없이 멀티모달 모델로 바로 전송

## Python/TypeScript 구현 예제

```python
# 전송 전 PII 마스킹 + 기능별 정책 강제 (FastAPI 서비스 계층)
import re
from dataclasses import dataclass

PII_PATTERNS = {
    # 한글과 숫자가 붙어 있어도 잡히도록 \b 대신 숫자 경계를 쓴다
    "RRN": re.compile(r"(?<!\d)\d{6}-?[1-8]\d{6}(?!\d)"),   # 주민등록번호·외국인등록번호 형식
    "PHONE": re.compile(r"(?<!\d)01[016789]-?\d{3,4}-?\d{4}(?!\d)"),
    "EMAIL": re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"),
    "CARD": re.compile(r"(?<!\d)(?:\d{4}[- ]?){3}\d{4}(?!\d)"),
}

@dataclass(frozen=True)
class LlmCallPolicy:
    feature: str
    allowed_fields: frozenset[str]
    block_on: frozenset[str] = frozenset({"RRN", "CARD"})  # 발견 시 전송 자체를 막을 유형

POLICIES = {
    "ticket-summary": LlmCallPolicy("ticket-summary", frozenset({"ticket_text", "product_name"})),
}

class PiiBlocked(Exception):
    pass

def mask_pii(text: str, block_on: frozenset[str]) -> tuple[str, dict[str, int]]:
    counts: dict[str, int] = {}
    for label, pattern in PII_PATTERNS.items():
        text, n = pattern.subn(f"[{label}]", text)
        if n:
            counts[label] = n
            if label in block_on:
                raise PiiBlocked(label)
    return text, counts

def build_llm_context(feature: str, record: dict) -> tuple[dict, dict[str, int]]:
    policy = POLICIES.get(feature)
    if policy is None:
        raise PermissionError(f"LLM 호출 정책이 없는 기능: {feature}")
    context, total = {}, {}
    for field in policy.allowed_fields & record.keys():
        masked, counts = mask_pii(str(record[field]), policy.block_on)
        context[field] = masked
        for k, v in counts.items():
            total[k] = total.get(k, 0) + v
    return context, total  # total은 로그에 건수만 남긴다
```

```ts
// 벤더 설정 확인 결과를 코드로 고정하고, 미확인 상태면 운영 호출을 막는다
type VendorProfile = {
  vendor: string;
  region: 'kr' | 'jp' | 'us' | 'eu';
  trainingUse: false;          // true인 벤더는 타입 단계에서 거부
  retentionDays: number;       // 벤더 측 보존 기간
  evidence: string;            // 계약서 조항, 벤더 문서 URL
  verifiedAt: string;          // 확인일 (주기 점검)
};

export function assertVendorUsable(p: VendorProfile, today = new Date()): void {
  const ageDays = (today.getTime() - new Date(p.verifiedAt).getTime()) / 86_400_000;
  if (ageDays > 180) throw new Error(`${p.vendor}: 벤더 정책 재확인 필요`);
  if (p.region !== 'kr' && !p.evidence.includes('privacy-policy#cross-border')) {
    throw new Error(`${p.vendor}: 국외 이전 공개 근거가 연결되지 않음`);
  }
}
```

전체 실행 가능한 예제(외부 LLM 전송 데이터 필터링)와 테스트는 [구현 예제](/tools/examples/)를 참고하세요.

## 개발 체크리스트

- [ ] LLM을 호출하는 모든 기능에 정책(허용 필드, 근거, 벤더, 리전, 보존 기간)이 등록되어 있다
- [ ] 프롬프트에 객체 전체가 아닌 허용목록 필드만 들어간다
- [ ] 자유 텍스트 입력에 PII 탐지·마스킹이 적용되고, 주민등록번호·카드번호 형식은 전송이 차단된다
- [ ] 응답에도 PII 재검사가 적용된다
- [ ] 벤더의 학습 이용 여부, 보존 기간, 처리 리전을 계약서나 벤더 문서로 확인하고 확인일을 남겼다
- [ ] 벤더 관계(업무위탁 / 제3자 제공)에 대한 법무 판단을 받았다 (`review-required`)
- [ ] 위탁이면 제26조제1항 문서(계약)와 수탁자 공개가, 국외 이전이면 제28조의8제2항 항목이 처리방침에 있다
- [ ] 국외 이전 시 시행령 제29조의10의 보호조치가 계약에 반영되어 있다
- [ ] 프롬프트·응답 전문 로그는 기본 비활성이거나 짧은 보존 기간과 별도 권한으로 관리된다
- [ ] 개인 계정·개인 API 키로 운영 데이터를 호출하지 않도록 키 관리가 되어 있다
- [ ] 생성형 AI 안내서와 처리방침 작성지침의 해당 항목을 원문으로 확인했다 (`review-required`)

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 법률·시행령·고시 조문은 2026-10-23에 국가법령정보센터 Open API로 받은 현행 원문과 대조했습니다. 생성형 AI 개인정보 처리 안내서(2025.8.), 처리방침 작성지침(2026), 통합 안내서의 위탁·제공 구분 해석은 원문 대조 전이라 `review-required`입니다.
