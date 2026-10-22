---
title: 개발·테스트 환경과 운영 개인정보
description: 운영 DB 덤프를 개발·스테이징에 복사하거나 실제 고객 데이터로 테스트할 때의 위험을 개인정보 보호법 제3조·제18조·제29조와 안전성 확보조치 기준 제5조·제6조·제12조로 정리하고, 합성 데이터, 컬럼 정책 기반 덤프 변환, 픽스처 검사로 대체하는 방법을 다룹니다.
category: app-security
status: review-required
lastVerified: 2026-10-23
tags: [테스트 데이터, 개발 환경, 스테이징, 운영 데이터, 덤프, 가명처리, 합성 데이터, 접근권한]
related: [sensitive-data/pseudonymization, auth-access/access-control, storage-retention/encryption, storage-retention/access-logs, app-security/log-masking, storage-retention/retention-destruction]
sources: [pipa, safety-notice, pipc-pseudonym-guide, owasp-asvs-5]
legalBasis:
  - source: pipa
    article: 제3조제1항, 제2항, 제7항
    kind: law
    summary: 목적에 필요한 최소한의 개인정보만 처리하고 목적 외 용도로 활용하지 않으며, 익명·가명으로 목적을 달성할 수 있으면 익명(불가능하면 가명)으로 처리되도록 해야 함
    status: verified
  - source: pipa
    article: 제18조제1항
    kind: law
    summary: 개인정보를 제15조제1항에 따른 범위를 초과하여 이용해서는 안 됨
    status: verified
  - source: pipa
    article: 제18조제1항
    kind: law
    summary: 운영 데이터를 개발·테스트에 쓰는 것이 수집 목적 범위(서비스 제공·유지보수) 안인지, 목적 외 이용인지는 사안별 판단
    status: review-required
  - source: pipa
    article: 제29조
    kind: law
    summary: 개인정보가 유출등이 되지 아니하도록 기술적·관리적·물리적 안전조치 의무
    status: verified
  - source: safety-notice
    article: 제2조제1호, 제5조제1항, 제4항
    kind: notice
    summary: 개인정보처리시스템은 개인정보를 처리할 수 있도록 체계적으로 구성한 시스템. 접근 권한은 업무 수행에 필요한 최소한의 범위로 차등 부여하고, 계정은 취급자별로 발급하며 공유하지 않음
    status: verified
  - source: safety-notice
    article: 제6조제3항, 제12조제1항
    kind: notice
    summary: 개인정보가 공유설정 등으로 권한 없는 자에게 공개·유출되지 않도록 조치. 출력(파일생성 포함) 시 용도를 특정하고 출력 항목을 최소화
    status: verified
  - source: safety-notice
    article: 제8조
    kind: notice
    summary: 운영 개인정보가 들어 있는 개발·스테이징 DB도 개인정보처리시스템으로 보고 접속기록 등 같은 안전조치를 적용해야 하는지는 해석 확인 필요
    status: review-required
  - source: pipa
    article: 제28조의2제1항
    kind: law
    summary: 통계작성, 과학적 연구, 공익적 기록보존 등을 위하여 동의 없이 가명정보를 처리할 수 있음 — 개발·테스트가 이에 해당하는지는 사안별 검토
    status: review-required
  - source: owasp-asvs-5
    article: V13 Configuration, V14 Data Protection
    kind: standard
    summary: 환경 분리, 비밀정보 관리, 민감 데이터의 불필요한 복제 방지에 관한 검증 요구사항(장 단위 인용, 세부 번호는 원문 확인 필요)
    status: verified
  - source: project
    kind: best-practice
    summary: 합성 데이터 기본값, 컬럼 정책 기반 fail-closed 덤프 변환, 픽스처 CI 검사, 스테이징 접근 통제는 이 프로젝트의 권장사항
    status: review-required
---

## 한 문장 결론

개발·테스트에는 **합성 데이터**를 기본으로 쓰고, 운영 데이터를 꼭 옮겨야 하면 **모든 컬럼에 처리 규칙을 정한 변환 파이프라인**을 거쳐 최소한만 옮기며, 운영 개인정보가 남아 있는 스테이징은 **운영과 같은 수준으로 통제**합니다.

## 적용 조건과 예외

| 상황 | 기본 판단 | 근거 구분 |
| --- | --- | --- |
| 단위·통합 테스트 픽스처, 로컬 개발 시드 | 합성 데이터만. 실제 고객 값 금지 | 법 제3조제1항·제7항 (최소 처리, 익명 우선) |
| 성능·부하 테스트 | 분포만 흉내 낸 합성 데이터. 운영 값 불필요 | 법 제3조 |
| 스테이징에서 운영과 같은 데이터로 재현 테스트 | 변환(삭제·대체·가명) 후 최소 범위만. 원본 복사는 피함 | 법 제3조, 제29조, 고시 제12조제1항 |
| 운영에서만 재현되는 장애 분석 | 운영 환경 안에서, 권한 있는 인원이, 접속기록이 남는 경로로 조회 | 고시 제5조, 제8조 |
| 운영 원본 덤프를 개발자 PC·공유 드라이브에 저장 | 하지 않음 | 고시 제6조제3항, 제12조 |

경계와 미확정 사항:

- **목적 범위**: 서비스를 운영하려고 수집한 개인정보를 그 서비스의 유지보수·장애 대응에 쓰는 것과, 새 기능 개발·데모·교육에 쓰는 것은 다르게 평가될 수 있습니다. 어디까지가 수집 목적 범위인지는 처리방침에 적힌 목적과 사안별 판단에 달려 있습니다(`review-required`).
- **가명처리한 덤프도 개인정보입니다.** 가명정보는 개인정보 보호법상 개인정보에 포함되며, 동의 없이 가명정보를 처리할 수 있는 근거(제28조의2)는 "통계작성, 과학적 연구, 공익적 기록보존 등"입니다. 개발·테스트가 여기에 해당하는지는 검토가 필요합니다(`review-required`). → [가명처리와 익명처리](/sensitive-data/pseudonymization/)
- **스테이징도 개인정보처리시스템이 될 수 있습니다.** 고시 제2조제1호의 정의("개인정보를 처리할 수 있도록 체계적으로 구성한 시스템")에 따르면 운영 개인정보가 들어 있는 스테이징 DB도 포함된다고 보는 것이 자연스럽습니다. 그렇다면 접근 권한, 접근통제, 암호화, 접속기록 요건이 함께 따라옵니다(`review-required`).
- 외부 협력사·외주 개발자에게 개발 환경을 제공하면 업무위탁에 해당할 수 있습니다. → [제3자 제공과 위탁](/data-sharing/provision-vs-outsourcing/)

## 실제 법적 근거

- 「개인정보 보호법」 제3조제1항: "개인정보처리자는 개인정보의 처리 목적을 명확하게 하여야 하고 그 목적에 필요한 범위에서 최소한의 개인정보만을 적법하고 정당하게 수집하여야 한다." 제2항: "그 목적 외의 용도로 활용하여서는 아니 된다." 제7항: 익명 또는 가명으로 처리하여도 목적을 달성할 수 있으면 익명처리가 가능한 경우 익명에 의하여, 불가능하면 가명에 의하여 처리될 수 있도록 하여야 한다.
- 제18조제1항: 개인정보를 제15조제1항에 따른 범위를 초과하여 이용하여서는 아니 된다.
- 제29조: 개인정보가 유출등이 되지 아니하도록 안전성 확보에 필요한 기술적·관리적 및 물리적 조치를 하여야 한다.
- 제28조의2제1항: 통계작성, 과학적 연구, 공익적 기록보존 등을 위하여 정보주체의 동의 없이 가명정보를 처리할 수 있다.
- 「개인정보의 안전성 확보조치 기준」 제2조제1호: "개인정보처리시스템"이란 데이터베이스시스템 등 개인정보를 처리할 수 있도록 체계적으로 구성한 시스템.
- 고시 제5조제1항: 접근 권한을 업무 수행에 필요한 최소한의 범위로 차등 부여. 제4항: 개인정보취급자별로 계정을 발급하고 공유되지 않도록 함.
- 고시 제6조제3항: 개인정보가 인터넷 홈페이지, P2P, 공유설정 등을 통하여 권한이 없는 자에게 공개되거나 유출되지 않도록 조치.
- 고시 제12조제1항: 개인정보의 출력 시(인쇄, 화면표시, 파일생성 등) 용도를 특정하여야 하며, 용도에 따라 출력 항목을 최소화.

(법률 제21445호, 고시 제2026-9호 기준. 2026-10-23 원문 대조.) 개발·테스트 환경을 직접 명시한 조문은 없습니다. 위 조문을 개발 환경에 적용하는 것은 이 가이드의 해석입니다.

## 개발자용 실무 해설

1. **운영 덤프는 "파일생성"입니다.** `pg_dump`로 운영 DB를 떠서 스테이징에 붓는 것은 고시 제12조제1항의 출력에 해당한다고 볼 수 있습니다. 용도를 정하고, 그 용도에 필요한 테이블·컬럼만 남깁니다.
2. **모든 컬럼에 규칙을 정하고, 규칙이 없으면 멈춥니다.** 마스킹 대상 컬럼 목록(denylist)만 관리하면 새 컬럼(`birthday`, `memo`)이 추가되는 순간 원본이 그대로 새어 나갑니다. 모든 컬럼을 `drop / null / pseudonym / fake / keep` 중 하나로 분류하고(allowlist), 분류되지 않은 컬럼이 있으면 변환을 실패시킵니다. 이 검사를 마이그레이션 PR의 CI에 넣으면 스키마 변경과 정책 변경이 함께 리뷰됩니다.
3. **자유 텍스트 컬럼은 비웁니다.** `memo`, `cs_note`, `address_detail` 같은 컬럼에는 전화번호·건강 정보 같은 예상 밖의 개인정보가 섞여 있습니다. 패턴 마스킹으로는 다 잡을 수 없으니 `null` 또는 고정 문구로 대체합니다.
4. **관계를 유지하려면 키 있는 결정적 대체를 씁니다.** 같은 사용자 ID가 같은 가명값으로 바뀌어야 조인이 깨지지 않습니다. HMAC 키는 덤프 작업에만 두고 개발 환경에는 두지 않습니다. 키가 있으면 후보 값을 넣어 원본을 확인할 수 있기 때문입니다.
5. **가짜 값은 "실제로 닿지 않는" 형식으로 만듭니다.** 이메일은 `example.invalid` 같은 예약 도메인, 전화번호는 실제로 쓰이지 않는 국번을 씁니다. 스테이징에서 알림 발송이 켜져 있어도 실제 고객에게 메일·문자가 가지 않습니다. 외부 발송 연동은 스테이징에서 샌드박스나 허용목록 수신자로만 동작하게 합니다.
6. **암호화 컬럼은 복호화해서 옮기지 않습니다.** 주민등록번호·계좌번호 같은 고시 제7조 대상은 컬럼째 `drop`하거나 합성 값으로 바꿉니다. 운영 암호 키를 스테이징에 공유하면 키 분리가 무너집니다. → [암호화](/storage-retention/encryption/)
7. **픽스처를 CI에서 검사합니다.** 버그 재현용으로 운영 데이터를 복사해 테스트 픽스처에 붙여 넣는 일이 가장 흔한 유출 경로입니다. Git에 들어가면 이력에서 지우기도 어렵습니다. 주민등록번호·카드번호(Luhn)·휴대전화번호·이메일 패턴 검사를 pre-commit과 CI에 둡니다.
8. **스테이징 접근을 운영처럼 다룹니다.** 운영 데이터가 조금이라도 남아 있다면 공용 계정, 사내 전체 공개 URL, 인증 없는 관리자 화면을 두지 않습니다. 개인정보가 없는 환경과 있는 환경을 이름과 네트워크로 구분해 두면 통제 범위가 분명해집니다.
9. **사용이 끝나면 지웁니다.** 장애 분석용으로 만든 임시 덤프·스냅샷·로컬 파일에 만료일을 정하고 파기합니다. → [보존기간과 파기](/storage-retention/retention-destruction/)

## 권장 설계

```text
[기본] 합성 데이터 생성기 (faker 등, 고정 seed) ──▶ 로컬·CI·부하 테스트

[예외] 운영 DB ──▶ 덤프 작업 (운영 네트워크 안, 전용 계정, 접속기록)
                    │ 1) check_schema(): 모든 컬럼에 정책이 있는지 → 없으면 실패
                    │ 2) transform(): drop / null / pseudonym(HMAC) / fake / keep
                    │ 3) scan_fixture(): 결과에 실제처럼 보이는 값이 남았는지
                    ▼
               스테이징 DB (접근권한 최소화, 취급자별 계정, 접속기록, 만료일)

column-policy.yaml ◀── 마이그레이션 PR에서 함께 수정 (CI: 정책 누락 시 실패)
pre-commit / CI   ──▶ tests/fixtures/**, seeds/** 패턴 검사
```

## 위험한 설계

- 운영 DB를 매일 밤 그대로 스테이징에 복제하고, 스테이징은 사내 전체가 접근 가능
- 마스킹 대상 컬럼만 나열(denylist)해서 새로 추가된 컬럼이 원본 그대로 복사됨
- 운영 암호 키를 스테이징에 공유하거나, 암호화 컬럼을 복호화한 뒤 덤프
- 장애 재현용으로 고객 데이터를 테스트 픽스처에 붙여 넣고 커밋
- 운영 덤프 파일을 개발자 노트북, 메신저, 공유 드라이브로 전달
- 스테이징에서 실제 이메일·전화번호로 알림이 발송됨
- 외주 개발사에 운영 데이터가 들어 있는 개발 서버 계정을 공용으로 발급

## Python/TypeScript 구현 예제

전체 코드와 테스트는 `examples/python-fastapi/src/kr_privacy_examples/nonprod_data.py`와 `examples/typescript/src/nonprodData.ts`에 있습니다.

```python
from kr_privacy_examples.nonprod_data import (
    ColumnPolicy, DumpTransformer, Rule, fake_email, fake_name, fake_phone, scan_fixture,
)

POLICIES = {
    "users": {
        "id": ColumnPolicy(Rule.PSEUDONYM),          # 관계 유지용 결정적 대체
        "name": ColumnPolicy(Rule.FAKE, fake_name),
        "email": ColumnPolicy(Rule.FAKE, fake_email),  # user-…@example.invalid
        "phone": ColumnPolicy(Rule.FAKE, fake_phone),  # 010-0000-NNNN
        "rrn_enc": ColumnPolicy(Rule.DROP),          # 고시 제7조 대상은 옮기지 않음
        "memo": ColumnPolicy(Rule.NULL),             # 자유 텍스트는 비움
        "status": ColumnPolicy(Rule.KEEP),
    },
}

t = DumpTransformer(POLICIES, key=load_dump_key_from_kms())
t.check_schema(read_production_schema())   # 정책 없는 컬럼이 있으면 UnclassifiedColumnError
rows = t.transform("users", fetch_rows("users"))
assert scan_fixture(json.dumps(rows, ensure_ascii=False)) == []
```

```ts
// pre-commit / CI: 픽스처·시드 파일 검사
import { readFileSync } from "node:fs";
import { scanFixture } from "./nonprodData.js";

let failed = false;
for (const file of process.argv.slice(2)) {
  for (const f of scanFixture(readFileSync(file, "utf8"))) {
    console.error(`${file}:${f.line} ${f.kind} 의심 값 (${f.excerpt})`); // 원문 전체는 출력하지 않음
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
```

테스트는 정책 없는 컬럼·테이블에서 멈추는지, 가명값이 결정적이면서 키마다 다른지, 변환 결과가 스캐너를 통과하는지, 명백한 가짜 값(`example.invalid`, `010-0000-`)은 허용하는지 확인합니다. → [구현 예제](/tools/examples/)

## 개발 체크리스트

- [ ] 테스트 픽스처·시드·부하 테스트 데이터가 합성 데이터이다
- [ ] 픽스처·시드 파일에 대한 개인정보 패턴 검사가 pre-commit 또는 CI에 있다
- [ ] 운영 데이터를 옮길 때 용도와 범위(테이블·컬럼·기간)를 정하고 기록한다
- [ ] 모든 컬럼에 처리 규칙이 있고, 규칙이 없는 컬럼이 있으면 변환이 실패한다
- [ ] 자유 텍스트 컬럼과 고시 제7조 암호화 대상 컬럼은 옮기지 않는다
- [ ] 가명 대체 키와 운영 암호 키가 개발·스테이징 환경에 없다
- [ ] 스테이징의 외부 발송(메일·문자·푸시)이 샌드박스 또는 허용목록 수신자로 제한된다
- [ ] 운영 데이터가 있는 스테이징은 취급자별 계정, 최소 권한, 접속기록을 적용한다 (`review-required`)
- [ ] 임시 덤프·스냅샷에 만료일이 있고 기한이 되면 파기한다
- [ ] 개발·테스트 목적의 운영 데이터 이용이 수집 목적 범위 안인지 법무 검토를 받았다 (`review-required`)

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 개인정보 보호법 제3조·제18조·제28조의2·제29조와 고시 제2조·제5조·제6조·제12조는 2026-10-23에 국가법령정보센터 Open API로 확인한 현행 원문 발췌와 대조했습니다. 개발·테스트 환경을 직접 다룬 조문은 없으며, 목적 범위 판단, 스테이징의 개인정보처리시스템 해당 여부, 가명정보 특례 적용 여부는 `review-required`입니다.
