---
title: 자동화된 결정 — 거부·설명 요구에 응답할 수 있는 시스템 만들기
description: 개인정보 보호법 제37조의2와 시행령 제44조의2~제44조의4에 따른 자동화된 결정의 거부·설명·검토 요구 처리와 기준 공개를 LLM 기반 채용 스크리닝, 이상거래 판정 등에 적용하는 방법을 정리합니다.
category: ai-llm
status: review-required
lastVerified: 2026-10-23
tags: [자동화된결정, 생성형AI, 정보주체권리, 설명가능성, 처리방침]
related: [app-security/data-subject-rights, ai-llm/llm-api-integration, collection-consent/privacy-policy, internal-admin/employee-data, case-studies/internal-hr-dashboard, case-studies/llm-support-chatbot]
sources: [pipa, pipa-decree, pipc-genai-guide, pipc-hr-guide, labor-standards-act]
legalBasis:
  - source: pipa
    article: 제4조제6호
    kind: law
    summary: 정보주체는 완전히 자동화된 개인정보 처리에 따른 결정을 거부하거나 그에 대한 설명 등을 요구할 권리를 가진다
    status: verified
  - source: pipa
    article: 제37조의2제1항
    kind: law
    summary: 완전히 자동화된 시스템(AI 포함)으로 개인정보를 처리해 이루어지는 결정이 권리·의무에 중대한 영향을 미치면 거부할 수 있다. 단, 제15조제1항제1호·제2호·제4호에 따른 경우는 거부권 제외. 행정청의 자동적 처분은 제외
    status: verified
  - source: pipa
    article: 제37조의2제2항~제5항
    kind: law
    summary: 자동화된 결정에 대해 설명 등을 요구할 수 있고, 처리자는 정당한 사유가 없으면 결정 미적용 또는 인적 개입에 의한 재처리·설명 등을 해야 하며, 결정의 기준·절차·처리 방식을 공개해야 한다
    status: verified
  - source: pipa-decree
    article: 제44조의2
    kind: decree
    summary: 거부는 처리자가 공개한 방법·절차에 따르고, 설명(기준·처리 과정) 또는 검토(정보주체가 제출한 의견의 반영 검토)를 요구할 수 있다. 방법·절차는 수집 절차보다 어렵지 않게(제41조제2항 준용)
    status: verified
  - source: pipa-decree
    article: 제44조의3
    kind: decree
    summary: 거부 시 결정 미적용 또는 인적 개입 재처리, 설명 요구 시 결과·주요 개인정보 유형·주요 기준·절차를 담은 간결하고 의미있는 설명, 검토 요구 시 반영 여부 통지. 요구를 받은 날부터 30일 이내 서면등의 방법(2회, 각 30일 연장 가능)
    status: verified
  - source: pipa-decree
    article: 제44조의4
    kind: decree
    summary: 자동화된 결정 사실·목적·대상 범위, 주요 개인정보 유형과 결정의 관계, 고려사항·처리 절차, 민감정보·14세 미만 아동 정보 처리 시 목적·항목, 거부·설명등요구 방법을 홈페이지 등에 공개
    status: verified
  - source: pipa
    article: 제38조제1항·제5항
    kind: law
    summary: 거부·설명 등의 요구는 열람등요구에 포함되며, 거절 등 조치에 불복할 수 있도록 이의제기 절차를 마련·안내해야 한다
    status: verified
  - source: project
    kind: best-practice
    summary: 특정 시스템이 "완전히 자동화된" 결정인지, "중대한 영향"이 있는지, 거부권 제외(제15조제1항제1호·제2호·제4호)에 해당하는지는 사안별 판단이며 법무 검토가 필요하다
    status: review-required
  - source: pipc-genai-guide
    kind: guide
    summary: AI 활용 단계의 정보주체 권리 보장 관련 권고. 자동화된 결정 해석 사례 포함 여부와 세부 내용은 원문 대조 필요
    status: review-required
  - source: pipc-hr-guide
    kind: guide
    summary: 채용·인사 평가에서 개인정보 처리 관련 권고. 자동화 평가 관련 내용 여부는 원문 대조 필요
    status: review-required
  - source: labor-standards-act
    kind: law
    summary: 채용·인사 결정에 자동화 시스템을 쓸 때 근로관계 법령상 쟁점이 있을 수 있음. 조문 미확인
    status: review-required
---

## 한 문장 결론

AI·규칙 엔진이 **사람 개입 없이** 정보주체의 권리·의무에 영향을 주는 결정을 내린다면, **결정 기준을 공개하고(제37조의2제4항), 거부·설명·검토 요구를 받아 30일 안에 사람이 재처리하거나 설명할 수 있는 경로**를 처음부터 시스템에 넣어야 합니다.

## 적용 조건과 예외

제37조의2제1항의 요소를 하나씩 확인합니다. 각 요소에 해당하는지는 사안별 판단이며 이 표는 검토 출발점일 뿐입니다(`review-required`).

| 요소 | 조문 문언 | 개발 현장에서 확인할 질문 |
| --- | --- | --- |
| 완전히 자동화된 시스템 | "완전히 자동화된 시스템(인공지능 기술을 적용한 시스템을 포함한다)" | 결과가 사람 검토 없이 그대로 확정·통보되는가? 사람이 형식적으로 승인 버튼만 누르는가? |
| 개인정보 처리 | "개인정보를 처리하여 이루어지는 결정" | 입력에 지원서, 거래 내역, 행동 로그 등 개인정보가 쓰이는가? |
| 중대한 영향 | "자신의 권리 또는 의무에 중대한 영향을 미치는 경우" | 채용 탈락, 계정 정지, 거래 차단, 서비스 이용 제한처럼 결과가 큰가? |
| 거부권 제외 | 제15조제1항제1호(동의)·제2호(법률·법령상 의무)·제4호(계약)에 따른 경우 | 결정의 근거가 이 세 호 중 하나인가? |
| 행정청 제외 | 「행정기본법」 제20조에 따른 자동적 처분 | 공공기관의 행정처분인가?(다른 법률이라 조문 내용은 별도 확인) |

주의할 점:

- **거부권이 제외되어도 설명 요구권은 남습니다.** 제1항 단서는 "거부할 수 있는 권리"에만 붙어 있고, 제2항은 "자동화된 결정을 한 경우" 설명 등을 요구할 수 있다고 정합니다. 시행령 제44조의3제2항 단서는 중대한 영향이 없는 결정에 대한 설명 요구에는 제44조의4제1항제2호·제3호 사항을 알리는 방식으로 대응할 수 있게 합니다.
- **공개 의무(제4항)는 거부권 여부와 별개**로 자동화된 결정을 하는 처리자에게 적용됩니다.
- **"사람이 최종 확인한다"는 주장은 실제 개입이 있을 때만 의미가 있습니다.** 검토자가 모델 점수를 바꿀 권한·정보·시간이 없다면 완전히 자동화된 결정으로 평가될 위험이 있습니다(`review-required`).
- **신용평가·대출 심사**는 「신용정보의 이용 및 보호에 관한 법률」에 별도 규정이 있을 수 있습니다. 이 저장소의 출처 레지스트리에는 아직 없으므로 원문을 따로 확인하세요(`review-required`).
- **채용·인사 평가**는 근로관계 법령, 채용 절차 관련 법령의 쟁점이 겹칠 수 있습니다(`review-required`). → [직원 정보](/internal-admin/employee-data/)

## 실제 법적 근거

- 「개인정보 보호법」 제4조제6호: 정보주체는 "완전히 자동화된 개인정보 처리에 따른 결정을 거부하거나 그에 대한 설명 등을 요구할 권리"를 가집니다.
- 제37조의2제1항: 자동화된 결정이 권리·의무에 중대한 영향을 미치면 거부할 수 있습니다. 다만 제15조제1항제1호·제2호·제4호에 따라 이루어지는 경우는 제외됩니다.
- 같은 조 제2항: 자동화된 결정을 한 경우 설명 등을 요구할 수 있습니다.
- 같은 조 제3항: 거부·설명 요구가 있으면 **정당한 사유가 없는 한** 자동화된 결정을 적용하지 않거나 **인적 개입에 의한 재처리·설명** 등 필요한 조치를 해야 합니다.
- 같은 조 제4항: 자동화된 결정의 **기준과 절차, 개인정보가 처리되는 방식** 등을 쉽게 확인할 수 있도록 공개해야 합니다.
- 시행령 제44조의2: 거부, 설명(기준·처리 과정), 검토(정보주체가 개인정보 추가 등 의견을 제출하고 그 반영 여부를 검토) 요구는 처리자가 공개한 방법·절차에 따릅니다. 그 방법·절차는 제41조제2항을 준용해 **수집 방법보다 어렵지 않게** 마련해야 합니다.
- 시행령 제44조의3:
  - 거부 → 결정 미적용 또는 인적 개입에 의한 재처리 후 결과 통지(제1항)
  - 설명 → ① 결정 결과 ② 사용된 주요 개인정보 유형 ③ 그 유형이 결정에 미친 영향 등 주요 기준 ④ 주요 개인정보의 처리 과정 등 절차를 포함한 **간결하고 의미있는 설명**(제2항)
  - 검토 → 제출 의견 반영 여부 검토와 결과 통지(제3항)
  - 거절 → 사유를 지체 없이 서면등의 방법으로 통지(제4항)
  - 기한 → 요구를 받은 날부터 **30일 이내** 서면등의 방법, 정당한 사유가 있으면 **2회에 한정해 각 30일 범위**에서 연장(제5항). 세부 사항은 보호위원회 고시로 정합니다(제6항, 고시 원문 미확인 `review-required`).
- 시행령 제44조의4제1항: ① 자동화된 결정이 이루어진다는 사실, 목적, 대상 정보주체 범위 ② 주요 개인정보 유형과 결정의 관계 ③ 고려사항과 처리 절차 ④ 민감정보 또는 14세 미만 아동 개인정보를 처리하면 그 목적과 구체적 항목 ⑤ 거부·설명등요구 방법과 절차를 홈페이지 등에 공개합니다. 제2항은 표준화된 용어 사용과 도표 등 시각적 방법 활용을 정합니다.
- 제38조제1항·제5항: 제37조의2에 따른 거부·설명 등 요구는 "열람등요구"에 포함되고, 거절 등에 대한 이의제기 절차를 마련·안내해야 합니다.

(현행 법률 제21445호, 시행령 제36671호 기준. 조문은 국가법령정보센터 원문과 대조함.)

## 개발자용 실무 해설

1. **결정 지점을 목록으로 만듭니다.** 모델 출력이 "추천"에서 끝나는지, 그대로 "확정"되는지를 기능별로 표시합니다. 같은 모델이라도 채용 서류 자동 탈락은 확정, 면접관에게 보여주는 요약은 추천입니다.
2. **결정 로그를 설명 가능한 형태로 남깁니다.** 시행령 제44조의3제2항의 설명 항목(결과, 주요 개인정보 유형, 주요 기준, 절차)을 나중에 재구성할 수 있어야 합니다. 최소한 결정 ID, 정보주체 ID, 모델·프롬프트·규칙 버전, 입력 특성 요약(값 자체가 아닌 사용 항목), 점수와 임계값, 주요 기여 요인, 결과, 시각을 기록합니다.
3. **LLM 판정은 재현성이 약합니다.** 같은 입력에도 결과가 달라질 수 있으므로 모델 버전, 프롬프트 해시, 온도 등 파라미터를 로그에 고정하고, 판정 근거 문장을 구조화된 필드(예: `criteria_met: [...]`)로 받도록 출력 스키마를 정합니다. 모델이 만든 "이유" 문장은 실제 계산 근거와 다를 수 있으니 설명 자료로 그대로 쓰기 전에 검증합니다.
4. **사람 검토 경로는 큐와 SLA로 구현합니다.** 거부·설명·검토 요구가 들어오면 티켓을 만들고 30일 기한을 계산하며, 검토자는 원래 결정을 뒤집을 수 있는 권한과 입력 자료 열람 권한(최소한)을 가져야 합니다. 검토 결과도 결정 로그에 이어 붙입니다.
5. **설명 로그도 개인정보입니다.** 지원서 전문이나 거래 상세를 로그에 복사하지 말고 원본 참조 ID와 사용 항목 목록을 남기세요. 보존 기간은 이의제기 가능 기간 등을 고려해 정하고 근거를 문서화합니다. → [보존·파기](/storage-retention/retention-destruction/)
6. **공개 문구는 처리방침 또는 별도 페이지로 관리합니다.** 시행령 제44조의4제1항 5개 항목을 코드 옆 YAML로 관리하고, 모델 교체 시 함께 갱신되도록 합니다. → [처리방침](/collection-consent/privacy-policy/)

## 권장 설계

```text
DecisionRecord
├─ decision_id, subject_id, feature: "resume-screening"
├─ automation_level: FULLY_AUTOMATED | HUMAN_IN_THE_LOOP | ADVISORY
├─ basis: CONSENT | LEGAL_OBLIGATION | CONTRACT | OTHER   ← 거부권 제외 판단 입력(review-required)
├─ significant_effect: true (판단 근거 문서 링크)
├─ model: { name, version, prompt_sha256, params }
├─ inputs_used: ["경력 기간", "자격증 보유 여부"]        ← 값이 아니라 항목
├─ score: 0.42, threshold: 0.5, top_factors: [...]
├─ outcome: "REJECT"
└─ reviews: [ { request_type: OBJECT|EXPLAIN|RECONSIDER, received_at, due_at, reviewer, result } ]

공개 페이지 (시행령 제44조의4제1항)
1. 사실·목적·대상 범위   2. 주요 개인정보 유형과 결정의 관계
3. 고려사항·처리 절차    4. 민감정보/14세 미만 정보 처리 시 목적·항목
5. 거부·설명등요구 방법·절차 (신청 버튼 링크)
```

- 이상거래 탐지처럼 즉시 차단이 필요한 경우, 자동 차단 후 **빠른 사람 검토 경로**와 결과 통지를 같이 설계합니다. 자동 차단을 "임시 조치"로 두고 확정은 사람 검토 후에 하는 구조가 위험을 줄입니다(프로젝트 권장사항).
- 거부 요청이 수용되면 같은 정보주체에 대해 해당 자동화 경로를 우회하는 플래그를 둡니다(`skip_automation_for_subject`).

## 위험한 설계

- LLM이 지원서를 읽고 "불합격"을 반환하면 그대로 탈락 메일 발송
- 결정 로그 없이 최종 결과만 저장해 설명 요구 시 근거를 재구성할 수 없음
- 검토자 화면에 모델 점수만 있고 원 자료나 기준이 없어 사실상 승인만 가능
- 모델·프롬프트를 바꾸면서 공개된 결정 기준을 갱신하지 않음
- 거부·설명 요청 창구가 고객센터 전화뿐이라 온라인 가입 절차보다 어려움(시행령 제44조의2제3항, 제41조제2항 준용)
- 설명 응답으로 "AI가 종합적으로 판단했습니다" 같은 의미 없는 문구만 제공

## Python/TypeScript 구현 예제

```python
# 결정 기록 + 거부·설명 요구 처리 기한 계산 (시행령 제44조의3제5항: 30일, 2회 각 30일 연장)
from dataclasses import dataclass, field
from datetime import date, timedelta
from enum import Enum

class RequestType(str, Enum):
    OBJECT = "object"          # 거부
    EXPLAIN = "explain"        # 설명
    RECONSIDER = "reconsider"  # 의견 반영 검토

@dataclass
class RightsRequest:
    decision_id: str
    type: RequestType
    received_on: date
    extensions: int = 0
    extension_reasons: list[str] = field(default_factory=list)

    @property
    def due_on(self) -> date:
        return self.received_on + timedelta(days=30 * (1 + self.extensions))

    def extend(self, reason: str) -> None:
        if self.extensions >= 2:
            raise ValueError("연장은 2회까지만 가능")
        self.extensions += 1
        self.extension_reasons.append(reason)  # 정보주체에게 사유를 알려야 한다

def build_explanation(record: dict) -> dict:
    """시행령 제44조의3제2항 4개 항목을 결정 로그에서 구성한다."""
    return {
        "result": record["outcome"],
        "personal_data_types": record["inputs_used"],
        "main_criteria": record["top_factors"],
        "procedure": record["procedure_summary"],
    }
```

```ts
// 자동화된 결정 적용 전에 "거부 수용" 플래그를 확인하고, 사람 검토 큐로 보낸다
type Outcome = { status: 'APPROVED' | 'REJECTED' | 'PENDING_HUMAN_REVIEW'; decisionId: string };

export async function decide(
  subjectId: string,
  runModel: () => Promise<{ score: number; factors: string[] }>,
  deps: {
    hasObjected: (subjectId: string) => Promise<boolean>;
    enqueueHumanReview: (subjectId: string, reason: string) => Promise<string>;
    record: (r: object) => Promise<string>;
  },
): Promise<Outcome> {
  if (await deps.hasObjected(subjectId)) {
    const id = await deps.enqueueHumanReview(subjectId, 'subject-objected');
    return { status: 'PENDING_HUMAN_REVIEW', decisionId: id };
  }
  const { score, factors } = await runModel();
  const status = score >= 0.5 ? 'APPROVED' : 'REJECTED';
  const decisionId = await deps.record({ subjectId, score, factors, status, automation: 'FULLY_AUTOMATED' });
  return { status, decisionId };
}
```

전체 실행 가능한 예제(개인정보 열람·삭제 요청 처리 흐름)와 테스트는 [구현 예제](/tools/examples/)를 참고하세요.

## 개발 체크리스트

- [ ] 모델·규칙 엔진의 출력이 확정 결정인지 추천인지 기능별로 분류되어 있다
- [ ] 완전 자동화·중대한 영향·거부권 제외 여부에 대한 판단 문서가 있고 법무 검토를 받았다 (`review-required`)
- [ ] 결정 로그에 모델·프롬프트 버전, 사용 항목, 점수·임계값, 주요 요인, 결과가 남는다
- [ ] 시행령 제44조의4제1항 5개 항목이 홈페이지 등에 공개되어 있다
- [ ] 거부·설명·검토 요구 창구가 온라인 가입 절차보다 어렵지 않다
- [ ] 요구 접수 시 30일 기한(연장 2회, 각 30일)이 계산되고 연장 사유가 통지된다
- [ ] 거부 시 해당 정보주체에 대해 자동화된 결정을 적용하지 않거나 사람이 재처리한다
- [ ] 설명 응답에 결과·주요 개인정보 유형·주요 기준·절차가 포함된다
- [ ] 거절 시 사유 통지와 이의제기 절차가 안내된다
- [ ] 신용·채용 등 다른 법령 규정이 있는 영역은 해당 법령을 확인했다 (`review-required`)

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 법률 제37조의2와 시행령 제44조의2~제44조의4는 2026-10-23에 국가법령정보센터 Open API로 받은 현행 원문과 대조했습니다. 시행령 제44조의3제6항에 따른 보호위원회 고시, 신용정보법·근로관계 법령, 안내서 해석은 원문 대조 전이라 `review-required`입니다.
