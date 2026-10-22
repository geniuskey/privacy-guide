---
title: 사용자 데이터로 학습·파인튜닝·RAG 인덱싱하기
description: 서비스 운영 중 쌓인 개인정보를 모델 학습, 파인튜닝, RAG 인덱스에 쓸 때 목적 외 이용, 추가적 이용, 가명정보 특례, 삭제 전파, 데이터 계보를 어떻게 설계할지 정리합니다.
category: ai-llm
status: review-required
lastVerified: 2026-10-23
tags: [생성형AI, 가명정보, 목적외이용, 파기, RAG, 데이터계보]
related: [ai-llm/llm-api-integration, sensitive-data/pseudonymization, storage-retention/retention-destruction, app-security/data-subject-rights, collection-consent/lawful-basis, data-sharing/public-data-and-downloads]
sources: [pipa, pipa-decree, pipc-genai-guide, pipc-integrated-guide, copyright-act]
legalBasis:
  - source: pipa
    article: 제3조제2항
    kind: law
    summary: 처리 목적에 필요한 범위에서 적합하게 처리하고 목적 외의 용도로 활용해서는 안 된다
    status: verified
  - source: pipa
    article: 제18조제1항·제2항
    kind: law
    summary: 제15조제1항 범위를 초과한 이용은 금지되며, 예외는 별도 동의, 다른 법률의 특별한 규정, 급박한 생명·신체·재산 이익 등이다(제5호~제9호는 공공기관 한정)
    status: verified
  - source: pipa
    article: 제15조제3항
    kind: law
    summary: 당초 수집 목적과 합리적으로 관련된 범위에서 불이익 여부, 암호화 등 안전조치 여부를 고려해 대통령령에 따라 동의 없이 이용할 수 있다
    status: verified
  - source: pipa-decree
    article: 제14조의2제1항·제2항
    kind: decree
    summary: 추가적 이용 시 당초 목적과의 관련성, 예측 가능성, 부당한 이익 침해 여부, 가명처리·암호화 등 조치 여부를 고려하고, 지속적이면 판단 기준을 처리방침에 공개하고 보호책임자가 점검해야 한다
    status: verified
  - source: pipa
    article: 제2조제1호의2·제8호, 제28조의2제1항
    kind: law
    summary: 가명처리의 정의, "과학적 연구"(기술의 개발과 실증 포함)의 정의, 통계작성·과학적 연구·공익적 기록보존 등을 위한 동의 없는 가명정보 처리
    status: verified
  - source: pipa
    article: 제28조의4, 제28조의5
    kind: law
    summary: 가명정보는 추가 정보 분리 보관 등 안전조치, 처리 기록 작성·보관(파기 후 3년 이상)을 해야 하고, 특정 개인을 알아보기 위한 처리는 금지되며 식별 가능한 정보가 생성되면 즉시 중지·회수·파기해야 한다
    status: verified
  - source: pipa-decree
    article: 제29조의5
    kind: decree
    summary: 가명정보와 추가정보의 분리 보관, 접근 권한 분리, 처리 목적·항목·이용내역 등 기록 사항
    status: verified
  - source: pipa
    article: 제28조의7
    kind: law
    summary: 가명정보에는 제20조, 제20조의2, 제27조, 제34조제1항·제2항, 제35조, 제35조의2, 제36조, 제37조를 적용하지 않는다
    status: verified
  - source: pipa
    article: 제21조, 제36조, 제37조
    kind: law
    summary: 불필요해진 개인정보의 지체 없는 파기, 정정·삭제 요구 처리, 처리정지·동의 철회 시 파기 등 조치
    status: verified
  - source: pipa
    article: 제58조의2
    kind: law
    summary: 시간·비용·기술을 합리적으로 고려할 때 다른 정보를 사용해도 더 이상 개인을 알아볼 수 없는 정보에는 법을 적용하지 않는다
    status: verified
  - source: pipc-genai-guide
    kind: guide
    summary: 생성형 AI 학습 데이터 확보 단계의 처리 근거, 공개된 개인정보 활용 시 고려사항, 가명처리 활용 등에 관한 권고. 세부 기준과 쪽수는 원문 대조 필요
    status: review-required
  - source: pipc-integrated-guide
    kind: guide
    summary: 추가적 이용·가명정보 처리의 판단 사례. 원문 대조 필요
    status: review-required
  - source: copyright-act
    kind: law
    summary: 학습 데이터 중 저작물이 포함될 경우의 별도 쟁점. 조문 미확인
    status: review-required
---

## 한 문장 결론

"서비스를 위해 모은 데이터"를 학습·파인튜닝·RAG 인덱스에 넣는 순간 **새로운 처리 목적**이 생길 수 있으므로, 데이터셋마다 **근거(별도 동의 / 추가적 이용 / 가명정보 특례 / 익명정보)**를 정해 기록하고, **원본 삭제가 파생 데이터까지 전파되는 계보**를 갖춰야 합니다.

## 적용 조건과 예외

| 활용 형태 | 개인정보가 남는 곳 | 검토할 근거 |
| --- | --- | --- |
| RAG 인덱싱(고객 문서·상담 기록을 벡터DB에 저장) | 청크 원문, 메타데이터, 임베딩 | 당초 목적 범위인지(제15조제1항), 아니면 제15조제3항·제18조 |
| 파인튜닝(상담 기록으로 응답 스타일 학습) | 학습 데이터셋, 체크포인트, 평가셋 | 제18조제2항제1호 별도 동의, 제15조제3항, 제28조의2 |
| 사전학습·범용 모델 개발 | 대규모 코퍼스, 모델 가중치 | 제28조의2(과학적 연구 해당 여부), 공개된 개인정보 활용 기준(안내서) |
| 평가·품질 분석(샘플링해 사람이 검토) | 샘플 export, 라벨링 도구 | 목적 범위, 접근통제 |
| 익명화된 집계·합성 데이터만 사용 | 없음(제58조의2 충족 시) | 재식별 가능성 검증 결과 |

판단 포인트:

- **RAG는 "학습"이 아니어도 처리입니다.** 상담 답변 품질을 위해 **같은 고객의 과거 상담**을 검색하는 것과 **다른 고객의 상담**을 검색해 답변에 쓰는 것은 목적·노출 위험이 다릅니다. 후자는 타인 정보 노출 경로가 됩니다. → [LLM 상담 챗봇 사례](/case-studies/llm-support-chatbot/)
- **제15조제3항(추가적 이용)**은 시행령 제14조의2의 4가지 고려사항을 모두 따져야 하고, 지속적으로 발생하면 판단 기준을 처리방침에 공개해야 합니다. 모델 학습처럼 반복되는 처리는 "지속적" 쪽에 가깝습니다. 학습이 "당초 목적과 합리적으로 관련된 범위"인지는 사안별 판단이며 법무 검토 대상입니다(`review-required`).
- **제18조제2항**의 예외 중 민간 사업자가 현실적으로 쓸 수 있는 것은 제1호(별도 동의), 제2호(다른 법률의 특별한 규정), 제3호(급박한 이익), 제10호(공중위생 등 긴급) 정도입니다. 제5호~제9호는 공공기관에 한정됩니다.
- **가명정보 특례(제28조의2)**는 통계작성·과학적 연구·공익적 기록보존 "등"을 위한 것입니다. 제2조제8호가 과학적 연구에 "기술의 개발과 실증"을 포함하지만, 특정 상업용 모델 학습이 여기에 해당하는지는 안내서 기준과 함께 검토해야 합니다(`review-required`).
- **공개된 개인정보**(웹에 공개된 게시물 등)를 수집해 학습에 쓰는 기준은 법 조문에 직접 규정되어 있지 않고 생성형 AI 안내서 등의 해석에 의존합니다. 이 문서는 기준을 단정하지 않습니다(`review-required`). 저작권 쟁점도 별도입니다.
- **민감정보**가 섞인 데이터(상담 중 건강 언급 등)는 제23조의 별도 요건이 있습니다. 학습 전 필터링 대상으로 다루세요. → [민감정보 구분](/sensitive-data/sensitive-vs-personal/)

## 실제 법적 근거

- 「개인정보 보호법」 제3조제2항: 처리 목적에 필요한 범위에서 적합하게 처리하고 **목적 외의 용도로 활용하여서는 아니 된다**.
- 제18조제1항: 제15조제1항에 따른 범위를 초과하여 이용해서는 안 되며, 제2항 각 호의 경우에 한해 "정보주체 또는 제3자의 이익을 부당하게 침해할 우려가 있을 때를 제외하고" 목적 외 이용이 가능합니다. 제2항제1호 동의를 받을 때는 제3항의 5가지 사항을 알려야 하고, 제22조제1항제3호에 따라 다른 동의와 **구분해** 받아야 합니다.
- 제15조제3항 + 시행령 제14조의2제1항: ① 당초 수집 목적과의 관련성 ② 수집 정황·처리 관행에 비춘 예측 가능성 ③ 정보주체 이익의 부당한 침해 여부 ④ 가명처리 또는 암호화 등 안전조치 여부를 고려합니다. 제2항: 지속적으로 발생하면 판단 기준을 **처리방침에 공개**하고 **개인정보 보호책임자가 점검**해야 합니다.
- 제28조의2제1항: 통계작성, 과학적 연구, 공익적 기록보존 등을 위해 동의 없이 가명정보를 처리할 수 있습니다.
- 제28조의4: 추가 정보 분리 보관 등 안전조치(시행령 제29조의5: 분리 보관, 접근 권한 분리), 처리 기간을 별도로 정할 수 있고(제2항), 처리 기록을 작성·보관하며 **파기한 날부터 3년 이상** 보관해야 합니다(제3항).
- 제28조의5: 특정 개인을 알아보기 위한 목적의 처리 금지, 처리 중 식별 가능한 정보가 생성되면 **즉시 처리 중지, 지체 없이 회수·파기**.
- 제28조의7: 가명정보에는 열람(제35조), 전송(제35조의2), 정정·삭제(제36조), 처리정지(제37조) 등이 적용되지 않습니다. 가명처리된 학습셋에는 개별 삭제 요구 처리 의무가 원칙적으로 미치지 않지만, **가명처리 전 원본과 RAG 인덱스처럼 가명처리되지 않은 파생물**에는 그대로 적용됩니다.
- 제21조, 제36조, 제37조: 보유기간 경과·목적 달성 시 파기, 삭제 요구 시 복구·재생되지 않도록 삭제, 동의 철회 시 파기 등 조치.
- 제58조의2: 합리적으로 고려할 때 더 이상 개인을 알아볼 수 없는 정보에는 법이 적용되지 않습니다. 익명 처리를 주장하려면 재식별 검증 결과가 필요합니다.

(현행 법률 제21445호, 시행령 제36671호 기준. 조문은 국가법령정보센터 원문과 대조함. 안내서 내용은 `review-required`.)

## 개발자용 실무 해설

1. **데이터셋은 "근거가 붙은 스냅샷"으로 만듭니다.** 학습·인덱싱에 들어가는 데이터는 원본 테이블을 직접 읽지 말고, 근거(`basis`), 원천 테이블, 필터 조건, 생성 시각, 포함된 정보주체 ID 목록(또는 그 해시)을 가진 매니페스트로 만듭니다. 이 매니페스트가 데이터 계보의 출발점입니다.
2. **RAG 인덱스는 삭제 전파 대상입니다.** 원본 문서나 사용자가 삭제되면 벡터DB의 청크와 메타데이터도 지워야 합니다. 청크마다 `subject_ids`, `source_doc_id`를 메타데이터로 넣고, 삭제 이벤트를 구독하는 워커가 해당 청크를 제거하게 하세요. 캐시된 검색 결과와 대화 메모리도 함께 지웁니다.
3. **모델 가중치에서 개별 삭제는 현실적으로 어렵습니다.** 그래서 학습 전에 줄이는 것이 핵심입니다: 직접 식별자 제거, 가명처리, 민감 주제 필터링, 동의 철회자 제외. 철회·삭제 요구가 누적되면 다음 학습 주기에서 제외하고 재학습하는 정책을 문서화합니다(프로젝트 권장사항). 이 정책이 법적으로 충분한지는 `review-required`입니다.
4. **가명처리와 추가정보 키는 분리합니다.** 가명 ID 매핑 테이블(추가정보)은 학습 파이프라인 계정이 읽을 수 없는 별도 저장소에 두고, 접근 권한도 분리합니다(시행령 제29조의5). → [가명처리](/sensitive-data/pseudonymization/)
5. **재식별 감시를 둡니다.** 파인튜닝 모델이 학습 데이터를 그대로 출력하는지(암기) 평가셋으로 점검하고, 식별 가능한 출력이 발견되면 제28조의5제2항에 따른 중지·회수·파기 절차를 런북에 연결합니다.
6. **사람 검토용 export는 별도 통제합니다.** 라벨링·품질 평가용 샘플은 마스킹된 뷰로 제공하고, 다운로드 권한과 접속기록을 남깁니다. → [접속기록](/storage-retention/access-logs/)

## 권장 설계

```text
DatasetManifest
├─ id: "support-ft-2026q4"
├─ purpose: "상담 응답 초안 모델 파인튜닝"
├─ basis: PSEUDONYM_RESEARCH (제28조의2) | ADDITIONAL_USE (제15조제3항) | SEPARATE_CONSENT (제18조제2항제1호)
├─ basis_assessment: "docs/assessments/support-ft.md"   ← 시행령 제14조의2 4요소 / 법무 검토 링크
├─ sources: [tickets@2026-10-01 snapshot]
├─ filters: [consent_withdrawn = false, sensitive_topic = false]
├─ pseudonymization: { key_store: "kms://pseudo-keys/support", key_access_role: "privacy-officer" }
├─ subject_index: "s3://lineage/support-ft-2026q4/subjects.parquet"
├─ retention_until: 2027-12-31
└─ derived: [model:support-v3, eval:support-v3-holdout]

RagChunk.metadata = { source_doc_id, subject_ids[], tenant_id, acl[], indexed_at }
```

- 원본 삭제 → `subject_index` 조회 → RAG 청크 삭제, 다음 학습 주기 제외 목록 등록, 작업 결과를 감사 로그에 기록.
- 가명정보 처리 기록(목적, 항목, 이용내역, 제공받는 자, 처리 기간)은 매니페스트에서 자동 생성해 파기 후 3년 이상 보관합니다(제28조의4제3항).
- RAG 청크에는 원문 문서의 ACL을 복사해 검색 시 필터로 씁니다. → [객체 단위 권한](/auth-access/object-level-authorization/)

## 위험한 설계

- 운영 DB 덤프를 그대로 파인튜닝 데이터로 사용
- 처리방침에 "서비스 개선"만 적고 모델 학습을 그 안에 포함된 것으로 간주
- 벡터DB에 문서를 넣을 때 출처·정보주체 메타데이터를 남기지 않아, 삭제 요구 시 어느 청크를 지워야 할지 모름
- 가명 ID 매핑 테이블을 학습 데이터와 같은 버킷에 저장
- 동의 철회자·탈퇴자를 학습셋 생성 쿼리에서 제외하지 않음
- 웹 크롤링한 게시물을 "공개된 정보라 괜찮다"는 판단만으로 학습에 사용

## Python/TypeScript 구현 예제

```python
# RAG 인덱스 삭제 전파: 정보주체 삭제 이벤트 → 관련 청크 제거 + 다음 학습 제외 목록 등록
from dataclasses import dataclass
from typing import Protocol

class VectorStore(Protocol):
    def delete(self, where: dict) -> int: ...

class ExclusionList(Protocol):
    def add(self, subject_id: str, reason: str) -> None: ...

@dataclass
class ErasureResult:
    subject_id: str
    chunks_deleted: int
    excluded_from_training: bool

def propagate_erasure(subject_id: str, store: VectorStore, exclusions: ExclusionList,
                      audit: list[dict]) -> ErasureResult:
    deleted = store.delete(where={"subject_ids": {"$contains": subject_id}})
    exclusions.add(subject_id, reason="erasure-request")
    result = ErasureResult(subject_id, deleted, True)
    audit.append({"event": "rag_erasure", "subject": subject_id, "chunks": deleted})
    return result
```

```ts
// 데이터셋 매니페스트 검증: 근거 평가 문서와 동의 철회 필터가 없으면 학습 파이프라인을 멈춘다
type Basis = 'PSEUDONYM_RESEARCH' | 'ADDITIONAL_USE' | 'SEPARATE_CONSENT' | 'ANONYMOUS';

interface DatasetManifest {
  id: string;
  basis: Basis;
  basisAssessment?: string;      // 시행령 제14조의2 판단 / 법무 검토 문서
  filters: string[];
  pseudonymKeyStore?: string;    // 학습 데이터와 다른 저장소여야 한다
  dataLocation: string;
}

export function validateManifest(m: DatasetManifest): string[] {
  const errors: string[] = [];
  if (!m.basisAssessment) errors.push('근거 판단 문서가 없음');
  if (!m.filters.includes('consent_withdrawn = false')) errors.push('동의 철회자 제외 필터 없음');
  if (m.basis === 'PSEUDONYM_RESEARCH') {
    if (!m.pseudonymKeyStore) errors.push('추가정보(가명 키) 저장소 미지정');
    else if (m.pseudonymKeyStore.split('/')[2] === m.dataLocation.split('/')[2]) {
      errors.push('추가정보가 학습 데이터와 같은 저장소에 있음');
    }
  }
  return errors;
}
```

전체 실행 가능한 예제(보존기간 만료 삭제, 삭제 요청 처리)와 테스트는 [구현 예제](/tools/examples/)를 참고하세요.

## 개발 체크리스트

- [ ] 학습·파인튜닝·RAG에 쓰는 데이터셋마다 근거와 판단 문서가 연결된 매니페스트가 있다
- [ ] 추가적 이용(제15조제3항)을 근거로 하면 시행령 제14조의2 4요소 판단이 기록되어 있고, 지속적이면 처리방침에 기준이 공개되어 있다
- [ ] 별도 동의가 근거이면 제18조제3항 5가지 사항을 알리고 다른 동의와 구분해 받았다
- [ ] 가명정보로 처리하면 추가정보 분리 보관, 접근 권한 분리, 처리 기록(파기 후 3년 이상 보관)이 구현되어 있다
- [ ] 상업용 모델 학습이 "과학적 연구 등"에 해당하는지 법무 검토를 받았다 (`review-required`)
- [ ] RAG 청크에 출처 문서·정보주체 메타데이터와 ACL이 저장된다
- [ ] 원본 삭제·탈퇴·동의 철회가 RAG 인덱스, 캐시, 다음 학습 주기 제외 목록까지 전파된다
- [ ] 민감정보·고유식별정보가 학습 전에 필터링된다
- [ ] 모델의 학습 데이터 암기·재식별 출력을 평가하고, 발견 시 중지·회수·파기 절차가 있다
- [ ] 공개된 개인정보·크롤링 데이터 사용은 안내서 기준과 저작권 쟁점을 확인했다 (`review-required`)

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 법률·시행령 조문은 2026-10-23에 국가법령정보센터 Open API로 받은 현행 원문과 대조했습니다. 생성형 AI 안내서의 공개된 개인정보 활용 기준과 가명정보 활용 해석, 저작권법 쟁점은 원문 대조 전이라 `review-required`입니다.
