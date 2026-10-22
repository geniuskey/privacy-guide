---
title: 데이터 공개 범위, 대량 다운로드, 공개 API
description: 전사·팀·개인 공개 범위 설계, 엑셀 내보내기 같은 대량 다운로드 통제, 공개 대시보드의 소규모 셀 억제와 익명 처리를 고시 제6조·제8조·제12조와 법 제58조의2에 맞춰 정리합니다.
category: data-sharing
status: review-required
lastVerified: 2026-10-23
tags: [다운로드, 엑셀내보내기, 공개범위, 익명처리, 접속기록, 공개API]
related: [data-sharing/provision-vs-outsourcing, auth-access/object-level-authorization, internal-admin/admin-vs-data-access, storage-retention/access-logs, sensitive-data/pseudonymization, app-security/minimal-response]
sources: [pipa, safety-notice, pipc-safety-guide, owasp-asvs-5]
legalBasis:
  - source: safety-notice
    article: 제12조
    kind: notice
    summary: 출력(인쇄, 화면표시, 파일생성 등) 시 용도를 특정하고 용도에 따라 출력 항목을 최소화하며, 출력·복사물을 안전하게 관리
    status: verified
  - source: safety-notice
    article: 제8조제2항
    kind: notice
    summary: 취급자의 접속기록 및 개인정보 다운로드 상황을 확인·점검하는 주기·방법·사후조치절차를 내부 관리계획으로 정하고 이행
    status: verified
  - source: safety-notice
    article: 제6조제3항
    kind: notice
    summary: 개인정보가 인터넷 홈페이지, P2P, 공유설정 등을 통하여 권한이 없는 자에게 공개되거나 유출되지 않도록 조치
    status: verified
  - source: safety-notice
    article: 제7조제5항
    kind: notice
    summary: 이용자의 개인정보 등을 취급자의 컴퓨터·모바일 기기·보조저장매체에 저장할 때 암호화
    status: verified
  - source: safety-notice
    article: 제6조의2제1항제2호
    kind: notice
    summary: 이용자 수 일일평균 100만명 이상인 처리자는 개인정보를 다운로드·파기할 수 있는 취급자의 컴퓨터 등에 인터넷망 차단 (위험 분석에 따른 예외 있음, 민감정보 등은 예외 불가)
    status: verified
  - source: pipa
    article: 제3조제7항
    kind: law
    summary: 익명 또는 가명으로 처리해도 목적을 달성할 수 있으면 익명(불가하면 가명)으로 처리
    status: verified
  - source: pipa
    article: 제58조의2
    kind: law
    summary: 시간·비용·기술 등을 합리적으로 고려할 때 다른 정보를 사용하여도 더 이상 개인을 알아볼 수 없는 정보에는 이 법을 적용하지 않음
    status: verified
  - source: pipa
    article: 제23조제3항
    kind: law
    summary: 서비스 과정에서 공개되는 정보에 민감정보가 포함되어 사생활 침해 위험이 있으면 공개 가능성과 비공개 선택 방법을 미리 알림
    status: verified
  - source: pipc-safety-guide
    kind: guide
    summary: 다운로드 사유 확인, 점검 주기 등 제8조제2항 이행 방법 해설(현행판 원문 대조 필요)
    status: review-required
  - source: owasp-asvs-5
    article: V14 Data Protection
    kind: standard
    summary: 민감 데이터 식별·분류, 응답·캐시·내보내기에서의 노출 최소화
    status: verified
---

## 한 문장 결론

개인정보가 담긴 화면·파일·API는 **기본 공개 범위를 가장 좁게** 두고, 엑셀 내보내기 같은 파일 생성은 **용도를 특정하고 항목을 최소화**하며(고시 제12조), **다운로드 상황을 점검할 수 있게 기록**해야 합니다(고시 제8조제2항). 외부 공개 통계·대시보드는 다른 정보와 결합해도 개인을 알아볼 수 없는 수준(제58조의2)인지 검증해야 하며, k-익명성이나 소규모 셀 억제는 이를 위한 **기술적 권장 수단**입니다.

## 적용 조건과 예외

| 공개·출력 형태 | 법령상 확인 | 권장 통제 |
| --- | --- | --- |
| 사내 화면 (목록, 상세) | 제12조제1항: 화면표시도 "출력". 용도별 항목 최소화 | 역할별 DTO, 기본 마스킹 |
| 엑셀/CSV 내보내기 | 제12조(파일생성), 제8조제2항(다운로드 점검), 제7조제5항(취급자 PC 저장 시 암호화) | 사유 입력, 항목 선택 최소화, 암호화 파일, 건수 상한 |
| 대량 다운로드 권한자 PC | 이용자 100만명 이상이면 제6조의2제1항제2호 인터넷망 차단 | 다운로드 권한자 최소화 |
| 전사 공개 문서·스프레드시트 공유 | 제6조제3항: 공유설정으로 권한 없는 자에게 공개 금지 | 링크 공유 기본 차단, 정기 스캔 |
| 공개 API | 제6조제3항, 법 제29조 | 인증, 필드 최소화, 속도 제한, 객체 권한 검증 |
| 외부 공개 통계·대시보드 | 제58조의2 해당 여부(익명정보인지) | 소규모 셀 억제, 일반화, k-익명성 검토 |
| 이용자 프로필 공개 (커뮤니티 등) | 제23조제3항: 민감정보 공개 가능성·비공개 방법 사전 고지 | 기본 비공개, 필드별 공개 설정 |

경계:

- **"다운로드 사유 확인"**: 현행 고시 제8조제2항 원문은 "개인정보 다운로드 상황을 확인하고 점검하는 주기·방법·사후조치절차"를 정하도록 할 뿐, 다운로드 **사유를 입력받으라는 문구는 없습니다**. 사유 입력은 점검을 쉽게 하기 위한 권장 수단이며, 안내서가 이를 어떻게 설명하는지는 원문 확인이 필요합니다(`review-required`).
- **익명정보 판단**: 제58조의2는 "시간·비용·기술 등을 합리적으로 고려할 때 다른 정보를 사용하여도 더 이상 개인을 알아볼 수 없는 정보"에 법을 적용하지 않는다고 합니다. 특정 기법(k 값 등)을 쓰면 자동으로 익명정보가 된다는 기준은 법령에 없습니다.
- **가명정보**는 여전히 개인정보입니다(제2조제1호다목). 가명처리한 데이터를 외부에 공개하는 것은 익명 공개와 다릅니다. → [가명처리](/sensitive-data/pseudonymization/)
- 외부 기관에 데이터를 넘기는 것은 공개가 아니라 제공 또는 위탁입니다. → [제공과 위탁](/data-sharing/provision-vs-outsourcing/)

## 실제 법적 근거

- 안전성 확보조치 기준 제12조
  - 제1항: 개인정보처리시스템에서 개인정보를 출력할 때(인쇄, 화면표시, 파일생성 등) 용도를 특정하고, 용도에 따라 출력 항목을 최소화합니다.
  - 제2항: 종이 인쇄물, 개인정보가 복사된 외부 저장매체 등 출력·복사물을 안전하게 관리하기 위한 조치를 합니다.
- 같은 기준 제8조제2항: 개인정보의 오·남용, 유출 등에 대응하기 위해 취급자의 접속기록 및 개인정보 다운로드 상황을 확인·점검하는 주기·방법·사후조치절차 등을 내부 관리계획으로 정하고 이행합니다.
- 같은 기준 제6조제3항: 개인정보가 인터넷 홈페이지, P2P, 공유설정 등을 통하여 권한이 없는 자에게 공개되거나 유출되지 않도록 시스템, 취급자의 컴퓨터·모바일 기기 등에 조치합니다.
- 같은 기준 제7조제5항: 이용자의 개인정보 또는 이용자가 아닌 정보주체의 고유식별정보·생체인식정보를 취급자의 컴퓨터, 모바일 기기, 보조저장매체 등에 저장할 때 암호화합니다.
- 같은 기준 제6조의2제1항제2호·제2항: 이용자 수 일일평균 100만명 이상인 처리자는 다운로드·파기 가능 취급자의 컴퓨터 등에 인터넷망 차단 조치를 하되, 위험 분석 결과에 따라 예외가 가능하고 민감정보·제7조제1항·제2항 정보를 다운로드·파기할 수 있는 경우는 예외가 되지 않습니다.
- 「개인정보 보호법」 제3조제7항: 익명 또는 가명으로 처리하여도 목적을 달성할 수 있으면 익명, 익명으로 안 되면 가명으로 처리될 수 있도록 합니다.
- 같은 법 제58조의2: 시간·비용·기술 등을 합리적으로 고려할 때 다른 정보를 사용하여도 더 이상 개인을 알아볼 수 없는 정보에는 이 법을 적용하지 않습니다.
- 같은 법 제23조제3항: 서비스 과정에서 공개되는 정보에 민감정보가 포함되어 사생활 침해 위험이 있다고 판단하면, 공개 가능성과 비공개 선택 방법을 미리 알기 쉽게 알립니다.

(2026-10-23 국가법령정보센터 원문 대조.)

## 개발자용 실무 해설

1. **공개 범위는 열거형으로 모델링합니다.** `PRIVATE < TEAM < ORG < PUBLIC_LINK < PUBLIC` 같은 단계를 두고 기본값을 가장 좁게 둡니다. 범위를 넓히는 변경은 감사로그를 남기고, `PUBLIC*`으로 바꿀 때는 경고를 띄웁니다.
2. **내보내기는 "목적 → 템플릿"으로 설계합니다.** 사용자가 칼럼을 마음대로 고르는 "전체 내보내기" 대신, 정산용·배송용처럼 용도별 템플릿이 필요한 칼럼만 포함하게 합니다. 이것이 제12조제1항의 "용도 특정, 항목 최소화"를 코드로 옮긴 형태입니다.
3. **다운로드 이벤트는 접속기록과 같은 수준으로 남깁니다.** 누가, 언제, 어떤 템플릿으로, 몇 건(가능하면 어떤 정보주체 범위)을 받았는지 기록하면 제8조제2항 점검에서 대량·반복·업무시간 외 다운로드를 찾을 수 있습니다. → [접속기록](/storage-retention/access-logs/)
4. **파일 자체도 보호합니다.** 취급자 PC에 저장되는 파일은 제7조제5항 암호화 대상일 수 있습니다. 암호화된 압축 파일, 만료되는 다운로드 링크, 워터마크(다운로더 ID)를 조합합니다.
5. **공개 API는 공개용 표현을 따로 둡니다.** 내부 모델을 그대로 직렬화하지 말고 공개 DTO를 정의합니다. 인증이 없는 엔드포인트는 열거 공격 대상이므로 속도 제한과 객체 권한 검증을 둡니다. → [객체 단위 소유권 검증](/auth-access/object-level-authorization/)
6. **공개 통계는 재식별 관점으로 검토합니다.** 소규모 셀(예: 특정 부서·연령대에 1~2명)은 억제하거나 범주를 합칩니다. 여러 표를 교차하면 차분 공격으로 값이 드러날 수 있으므로, 같은 데이터에서 여러 집계를 공개할 때는 조합까지 검토합니다. k-익명성, l-다양성, 차분 프라이버시는 **기술적 권장 수단**이고 법적 기준값은 아닙니다.

## 권장 설계

```text
Visibility: PRIVATE → TEAM → ORG → PUBLIC_LINK → PUBLIC   (기본값 PRIVATE, 확대 시 감사로그)

Export flow
  템플릿 선택(용도) ─▶ 권한 검사 ─▶ 사유 입력(권장) ─▶ 건수 상한 검사
        └▶ 파일 생성(템플릿 칼럼만, 암호화) ─▶ 만료 링크(예: 24h) ─▶ download_log
                                                         └▶ 점검 규칙: 대량/반복/야간

Public stats
  raw ─▶ 집계 ─▶ 소규모 셀 억제(count < K → "<K") ─▶ 범주 일반화 ─▶ 재식별 검토 ─▶ 공개
```

- K 값, 건수 상한, 링크 만료 시간은 조직이 위험도에 맞게 정하는 값입니다(프로젝트 권장사항).
- 다운로드 권한은 조회 권한과 분리된 별도 권한(`member:export`)으로 둡니다.

## 위험한 설계

- 관리자 목록 화면의 "전체 엑셀 다운로드"가 모든 칼럼(주민등록번호, 계좌 포함)을 내보냄
- 다운로드 기록이 없거나, 누가 받았는지만 있고 무엇을 몇 건 받았는지 없음
- 스프레드시트를 "링크가 있는 모든 사용자"로 공유하고 방치 (제6조제3항)
- 공개 API가 내부 사용자 모델을 그대로 직렬화해 이메일·전화번호 포함
- 공개 대시보드에 "부서 × 직급 × 성별" 표를 그대로 노출해 1인 셀이 생김
- "가명처리했으니 공개해도 된다"는 판단

## Python/TypeScript 구현 예제

```python
# 용도별 내보내기 템플릿 + 건수 상한 + 다운로드 기록 (고시 제12조, 제8조제2항)
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

router = APIRouter()
EXPORT_TEMPLATES = {
    "shipping": ["order_id", "recipient_name", "shipping_address", "phone_masked"],
    "settlement": ["order_id", "amount", "paid_at"],
}
MAX_ROWS = 5_000  # 조직이 정하는 값

class ExportRequest(BaseModel):
    template: str
    reason: str  # 권장: 점검을 돕는 사유 (고시 문구상 필수 아님)

@router.post("/admin/exports")
def create_export(body: ExportRequest, actor=Depends(require("order:export"))):
    columns = EXPORT_TEMPLATES.get(body.template)
    if columns is None:
        raise HTTPException(400, "허용되지 않은 내보내기 용도입니다.")
    rows = orders.query_for(actor, columns=columns, limit=MAX_ROWS + 1)
    if len(rows) > MAX_ROWS:
        raise HTTPException(422, "건수 상한을 초과했습니다. 범위를 좁히거나 승인을 요청하세요.")
    file_id = files.write_encrypted_xlsx(rows, columns)        # 제7조제5항 대비
    download_log.append(actor_id=actor.id, template=body.template, rows=len(rows),
                        reason=body.reason, at=datetime.now(timezone.utc), file_id=file_id)
    return {"url": files.signed_url(file_id, ttl_seconds=86_400)}
```

```ts
// 공개 통계: 소규모 셀 억제 (프로젝트 권장, K는 조직이 결정)
type Cell = { group: string; count: number };
const K = 5;

export function suppressSmallCells(cells: Cell[]): Array<{ group: string; count: number | `<${number}` }> {
  return cells.map((c) => ({ group: c.group, count: c.count < K ? (`<${K}` as const) : c.count }));
}

// 2차 억제: 억제된 셀이 하나뿐이면 합계에서 역산되므로 다음으로 작은 셀도 억제한다
export function needsSecondarySuppression(cells: Cell[]): boolean {
  return cells.filter((c) => c.count < K).length === 1;
}
```

전체 실행 가능한 예제와 테스트는 [구현 예제](/tools/examples/)를 참고하세요.

## 개발 체크리스트

- [ ] 개인정보를 포함하는 리소스의 공개 범위 기본값이 가장 좁은 단계다
- [ ] 공개 범위 확대 변경이 감사로그로 남는다
- [ ] 내보내기는 용도별 템플릿으로만 가능하고, 템플릿은 필요한 칼럼만 포함한다
- [ ] 다운로드마다 수행자, 시각, 템플릿, 건수가 기록되고 점검 규칙이 있다
- [ ] 점검 주기·방법·사후조치가 내부 관리계획에 정해져 있다
- [ ] 내보낸 파일은 암호화되고 링크는 만료된다
- [ ] 공개 API는 별도 공개 DTO, 인증 또는 속도 제한, 객체 권한 검증을 갖췄다
- [ ] 외부 공개 통계는 소규모 셀 억제와 교차 공개 검토를 거쳤다
- [ ] 익명정보라고 판단한 근거(제58조의2 관점)를 문서로 남겼다 (`review-required`)

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 고시와 법률 조문은 2026-10-23 원문과 대조했습니다. 다운로드 사유 확인 등 안내서의 이행 방법 해설은 `review-required`이며, k-익명성·소규모 셀 억제는 법령 기준이 아닌 기술적 권장사항입니다.
