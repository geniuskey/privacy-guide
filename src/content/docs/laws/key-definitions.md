---
title: 핵심 용어 정의 — 제2조를 데이터 모델로 읽기
description: 개인정보(가·나·다목), 가명처리, 처리, 정보주체, 개인정보파일, 개인정보처리자, 개인정보취급자 등 제2조와 관련 조문의 정의를 DB 스키마·분류 체계 관점에서 정리하고, "쉽게 결합하여 알아볼 수 있는" 판단 기준을 설명합니다.
category: laws
status: review-required
lastVerified: 2026-10-23
sidebar:
  order: 2
tags: [개인정보 보호법, 개인정보 정의, 가명정보, 식별가능성, 데이터 분류, 개인정보처리자]
related: [laws/pipa-overview, sensitive-data/pseudonymization, sensitive-data/sensitive-vs-personal, sensitive-data/unique-identifiers, app-security/log-masking]
sources: [pipa, pipa-decree, safety-notice, pipc-integrated-guide]
legalBasis:
  - source: pipa
    article: 제2조제1호
    kind: law
    summary: 개인정보는 살아 있는 개인에 관한 정보로서 가목(직접 식별), 나목(다른 정보와 쉽게 결합하여 식별), 다목(가명정보) 중 하나에 해당하는 정보
    status: verified
  - source: pipa
    article: 제2조제1호나목 후단
    kind: law
    summary: 쉽게 결합할 수 있는지는 다른 정보의 입수 가능성 등 개인을 알아보는 데 소요되는 시간, 비용, 기술 등을 합리적으로 고려하여 판단
    status: verified
  - source: pipa
    article: 제2조제1호의2
    kind: law
    summary: 가명처리는 일부 삭제 또는 일부·전부 대체 등의 방법으로 추가 정보 없이는 특정 개인을 알아볼 수 없도록 처리하는 것
    status: verified
  - source: pipa
    article: 제2조제2호~제5호
    kind: law
    summary: 처리(수집부터 파기까지 모든 행위), 정보주체, 개인정보파일(체계적으로 배열·구성한 집합물), 개인정보처리자의 정의
    status: verified
  - source: pipa
    article: 제28조제1항
    kind: law
    summary: 개인정보취급자는 임직원, 파견근로자, 시간제근로자 등 개인정보처리자의 지휘·감독을 받아 개인정보를 처리하는 자
    status: verified
  - source: pipa
    article: 제23조제1항, 제24조제1항
    kind: law
    summary: 민감정보와 고유식별정보는 별도 정의를 두고 일반 개인정보보다 엄격한 처리 요건을 둠
    status: verified
  - source: pipa
    article: 제58조의2
    kind: law
    summary: 시간·비용·기술 등을 합리적으로 고려할 때 다른 정보를 사용하여도 더 이상 개인을 알아볼 수 없는 정보에는 법을 적용하지 않음
    status: verified
  - source: safety-notice
    article: 제2조
    kind: notice
    summary: 개인정보처리시스템, 접속기록, 생체정보, 생체인식정보, 인증정보 등 안전조치 관련 용어 정의
    status: verified
  - source: pipc-integrated-guide
    kind: guide
    summary: 식별가능성 판단(결합 용이성)과 개인정보 해당 여부 사례에 대한 해석(원문 쪽수 확인 필요)
    status: review-required
---

## 한 문장 결론

개인정보 해당 여부는 필드 이름이 아니라 **"이 서비스가 합리적인 시간·비용·기술로 다른 정보와 결합해 특정 개인을 알아볼 수 있는가"**로 판단하므로, 데이터 모델에서는 user_id, 기기 ID, IP, 내부 사번처럼 그 자체로는 이름이 없는 필드도 개인정보로 분류하는 것을 기본값으로 둡니다.

## 적용 조건과 예외

### 개인정보의 세 갈래 (제2조제1호)

| 목 | 정의 요지 | 데이터 예시 | 모델링 기본값 |
| --- | --- | --- | --- |
| 가목 | 성명, 주민등록번호 및 영상 등을 통하여 개인을 알아볼 수 있는 정보 | 이름, 주민번호, 얼굴이 식별되는 사진·영상 | 개인정보 |
| 나목 | 해당 정보만으로는 특정 개인을 알아볼 수 없더라도 **다른 정보와 쉽게 결합하여** 알아볼 수 있는 정보 | 내부 user_id, 이메일, 전화번호, 사번, 주문번호+배송지, 쿠키 ID와 연결된 행동 로그 | 개인정보 (결합 가능성 평가 후 예외 판단) |
| 다목 | 가목·나목을 가명처리하여 **추가 정보의 사용·결합 없이는** 특정 개인을 알아볼 수 없는 정보(가명정보) | 키를 따로 보관한 해시 ID 기반 분석 테이블 | 여전히 개인정보(특례 적용) |

- 공통 요건은 **"살아 있는 개인에 관한 정보"**입니다. 법인 정보, 사망자 정보는 원칙적으로 정의 밖이지만, 사망자 정보가 유족 등 살아 있는 사람에 관한 정보가 되는 경우 등 경계 사례는 법무 검토가 필요합니다(`review-required`).
- **익명정보**(제58조의2)는 다른 정보를 사용하여도 더 이상 개인을 알아볼 수 없는 정보로, 법이 적용되지 않습니다. 가명정보와 혼동하지 않아야 합니다.

### "쉽게 결합하여"의 판단 기준 (제2조제1호나목 후단)

법은 결합 용이성을 판단할 때 **다른 정보의 입수 가능성 등 개인을 알아보는 데 소요되는 시간, 비용, 기술 등을 합리적으로 고려**하도록 정합니다. 개발 관점으로 바꾸면 다음을 묻게 됩니다.

| 고려 요소 | 개발자가 던질 질문 |
| --- | --- |
| 다른 정보의 입수 가능성 | 같은 DB, 같은 회사의 다른 시스템, 협력사, 공개 데이터에 연결 키가 있는가? |
| 시간 | 단순 JOIN 한 번으로 연결되는가, 아니면 별도 수집이 필요한가? |
| 비용 | 연결에 별도 계약·구매가 필요한가? |
| 기술 | 해시가 사전 대입으로 역산 가능한가? 위치·시간 패턴만으로 개인이 특정되는가? |

**누구 기준으로** 판단하는지(처리자 기준인지, 제3자 기준인지)와 구체 사례는 안내서 해석에 따르는 부분이 크므로 `review-required`로 둡니다. 실무에서는 **데이터를 보유하는 쪽과 받는 쪽 모두의 결합 가능성**을 함께 평가하는 편이 안전합니다(프로젝트 권장사항).

## 실제 법적 근거

제2조 및 관련 조문의 정의를 데이터 모델 용어와 함께 정리합니다.

| 법률 용어 | 조문 | 정의 요지 | 개발 용어로 바꾸면 |
| --- | --- | --- | --- |
| 개인정보 | 제2조제1호 | 살아 있는 개인에 관한 정보로서 가·나·다목 해당 | PII + 식별 가능 준식별자 + 가명 데이터 |
| 가명처리 | 제2조제1호의2 | 일부 삭제, 일부 또는 전부 대체 등으로 추가 정보 없이는 특정 개인을 알아볼 수 없도록 처리 | 토큰화, 키 기반 해시, 일반화·범주화 |
| 처리 | 제2조제2호 | 수집, 생성, 연계, 연동, 기록, 저장, 보유, 가공, 편집, 검색, 출력, 정정, 복구, 이용, 제공, 공개, 파기 등 | CRUD 전부 + ETL + 로그 기록 + 백업 + 화면 표시 |
| 정보주체 | 제2조제3호 | 처리되는 정보로 알아볼 수 있는 사람으로서 그 정보의 주체 | 레코드의 대상 사람(user, employee, customer) |
| 개인정보파일 | 제2조제4호 | 쉽게 검색할 수 있도록 일정한 규칙에 따라 체계적으로 배열·구성한 개인정보의 집합물 | DB 테이블, 인덱싱된 로그, 정렬된 스프레드시트 |
| 개인정보처리자 | 제2조제5호 | 업무 목적으로 개인정보파일을 운용하기 위해 스스로 또는 다른 사람을 통해 처리하는 공공기관·법인·단체·개인 | 서비스 운영 회사(데이터 컨트롤러에 가까움) |
| 공공기관 | 제2조제6호, 시행령 제2조 | 국가기관, 지방자치단체, 공공기관운영법상 공공기관, 각급 학교 등 | 공공 프로젝트 여부 판단 |
| 개인정보취급자 | 제28조제1항 | 임직원, 파견근로자, 시간제근로자 등 처리자의 지휘·감독을 받아 처리하는 자 | 관리자 콘솔 사용자, DB 접근 권한 보유 직원 |
| 민감정보 | 제23조제1항, 시행령 제18조 | 사상·신념, 노동조합·정당, 정치적 견해, 건강, 성생활 등 + 유전정보, 범죄경력, 생체인식 특징정보, 인종·민족 | sensitivity: `SENSITIVE` |
| 고유식별정보 | 제24조제1항, 시행령 제19조 | 주민등록번호, 여권번호, 운전면허번호, 외국인등록번호 | sensitivity: `UNIQUE_ID` |
| 유출등 | 제23조제2항 | 분실·도난·유출·위조·변조 또는 훼손 | 기밀성 + 무결성 + 가용성 사고 |
| 과학적 연구 | 제2조제8호 | 기술 개발과 실증, 기초연구, 응용연구 및 민간 투자 연구 등 과학적 방법을 적용하는 연구 | 가명정보 특례 목적 판단 |

고시(안전성 확보조치 기준) 제2조는 안전조치 맥락의 용어를 추가로 정의합니다: **개인정보처리시스템**(DB시스템 등 개인정보를 처리할 수 있도록 체계적으로 구성한 시스템), **접속기록**(식별자, 접속일시, 접속지 정보, 처리한 정보주체 정보, 수행업무 등의 전자 기록), **생체인식정보**(생체정보 중 특정 개인을 인증 또는 식별할 목적으로 처리되는 정보), **인증정보** 등.

(현행 법률 제21445호·시행령 제36671호·고시 제2026-9호 기준. 국가법령정보센터 원문과 대조함.)

## 개발자용 실무 해설

1. **"처리"는 읽기도 포함합니다.** 관리자 화면에서 조회만 해도, 로그에 남기기만 해도 처리입니다. 따라서 로그·캐시·검색 인덱스·백업도 개인정보파일이 될 수 있습니다. → [로그 마스킹](/app-security/log-masking/)
2. **내부 ID도 개인정보로 다룹니다.** `user_id=48213`은 단독으로는 의미가 없어 보이지만, 같은 회사의 users 테이블과 JOIN 한 번이면 개인을 특정합니다. 결합 비용이 거의 0이므로 나목에 해당할 가능성이 높습니다.
3. **해시는 자동으로 익명이 되지 않습니다.** 전화번호를 솔트 없이 SHA-256 하면 전화번호 공간이 작아 사전 대입으로 쉽게 되돌릴 수 있습니다. 키 기반(HMAC) 해시도 키를 가진 쪽에서는 가명정보에 머뭅니다.
4. **개인정보처리자와 개인정보취급자를 권한 모델에 반영합니다.** 처리자는 회사, 취급자는 시스템을 쓰는 직원입니다. 제28조는 취급자 범위를 **최소한으로 제한**하고 관리·감독하도록 요구하므로, 관리자 계정 목록이 곧 취급자 목록이 됩니다. → [관리자 권한과 데이터 접근](/internal-admin/admin-vs-data-access/)
5. **민감정보·고유식별정보는 "개인정보의 하위 등급"입니다.** 일반 개인정보 요건 위에 별도 동의 또는 법령 근거가 추가로 필요합니다.

## 권장 설계

필드 메타데이터에 분류를 붙이고, 분류가 없는 필드는 빌드에서 막습니다.

```text
DataClass (프로젝트 권장 분류 — 법률 용어와 1:1이 아님)
├─ DIRECT_ID      제2조제1호가목  이름, 얼굴 사진
├─ LINKABLE_ID    제2조제1호나목  user_id, email, phone, device_id, IP
├─ QUASI_ID       나목 후보       생년, 성별, 우편번호, 직급  ← 조합 위험 평가
├─ SENSITIVE      제23조         건강, 생체인식, 노조 가입
├─ UNIQUE_ID      제24조         주민번호, 여권번호
├─ PSEUDONYMOUS   제2조제1호다목  키 분리 보관된 토큰
├─ ANONYMOUS      제58조의2       평가 기록이 있는 집계 통계
└─ NON_PERSONAL                  상품 정보, 법인 정보
```

- `ANONYMOUS`는 **평가 기록 링크가 있을 때만** 지정할 수 있게 합니다.
- `QUASI_ID`는 단독으로는 개인정보가 아닐 수 있어도, 같은 테이블에 3개 이상 모이면 리뷰를 요구하는 규칙을 둡니다(프로젝트 권장사항).
- 로그·분석 파이프라인으로 나가는 필드는 `DataClass`를 보고 마스킹·토큰화를 적용합니다.

## 위험한 설계

- "이름이 없으니 개인정보가 아니다"라며 user_id와 행동 로그를 외부 분석 도구로 전송
- 솔트 없는 해시를 "익명화"라고 부르고 개인정보 처리 대상에서 제외
- 가명정보를 익명정보로 분류해 보존기간·안전조치 적용에서 제외
- 관리자 콘솔 계정을 공유 계정으로 운영해 개인정보취급자 범위를 특정할 수 없음
- 개인정보파일 정의를 DB 테이블로만 생각해 CSV 다운로드, 슬랙 첨부, 검색 인덱스를 관리 대상에서 누락

## Python/TypeScript 구현 예제

```python
# 필드 분류 레지스트리와 준식별자 조합 경고
from enum import Enum
from dataclasses import dataclass

class DataClass(str, Enum):
    DIRECT_ID = "direct_id"          # 제2조제1호가목
    LINKABLE_ID = "linkable_id"      # 제2조제1호나목
    QUASI_ID = "quasi_id"
    SENSITIVE = "sensitive"          # 제23조
    UNIQUE_ID = "unique_id"          # 제24조
    PSEUDONYMOUS = "pseudonymous"    # 제2조제1호다목
    ANONYMOUS = "anonymous"          # 제58조의2 (평가 기록 필수)
    NON_PERSONAL = "non_personal"

@dataclass(frozen=True)
class FieldMeta:
    data_class: DataClass
    anonymity_assessment: str | None = None  # 평가 문서 링크

def validate_table(fields: dict[str, FieldMeta]) -> list[str]:
    problems: list[str] = []
    for name, meta in fields.items():
        if meta.data_class is DataClass.ANONYMOUS and not meta.anonymity_assessment:
            problems.append(f"{name}: 익명 분류에는 재식별 위험 평가 기록이 필요합니다")
    quasi = [n for n, m in fields.items() if m.data_class is DataClass.QUASI_ID]
    if len(quasi) >= 3:
        problems.append(f"준식별자 조합 검토 필요: {quasi}")
    return problems
```

```ts
// 모르는 필드는 개인정보로 간주한다 (안전한 기본값)
type DataClass =
  | 'direct_id' | 'linkable_id' | 'quasi_id' | 'sensitive'
  | 'unique_id' | 'pseudonymous' | 'anonymous' | 'non_personal';

const REGISTRY: Record<string, DataClass> = {
  name: 'direct_id',
  userId: 'linkable_id',
  birthYear: 'quasi_id',
  productSku: 'non_personal',
};

export function classify(field: string): DataClass {
  return REGISTRY[field] ?? 'linkable_id';
}

export const isPersonal = (c: DataClass) => c !== 'anonymous' && c !== 'non_personal';
```

전체 실행 가능한 예제는 [구현 예제](/tools/examples/)를 참고하세요.

## 개발 체크리스트

- [ ] 모든 테이블·로그·이벤트 스키마의 필드에 데이터 분류가 지정되어 있다
- [ ] 내부 ID, 이메일, IP, 기기 ID를 개인정보(나목 후보)로 분류했다
- [ ] 같은 저장소 안에서 JOIN으로 개인을 특정할 수 있는 경로를 목록화했다
- [ ] 해시·토큰화 필드는 키 보관 위치와 역산 가능성을 문서화했다
- [ ] 가명정보와 익명정보를 구분하고, 익명 분류에는 평가 기록이 있다
- [ ] 개인정보취급자(관리자 계정) 목록을 최소화하고 계정별로 발급했다
- [ ] 식별가능성 판단의 기준 주체와 경계 사례는 법무 검토를 요청했다 (`review-required`)

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 제2조, 제23조, 제24조, 제28조, 제58조의2와 고시 제2조는 2026-10-23에 국가법령정보센터 Open API 현행본과 대조했습니다. 식별가능성 판단 사례는 안내서 원문 대조 전이라 `review-required`입니다.
