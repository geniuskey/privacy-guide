---
title: 개인정보처리시스템 접속기록 — 필드 설계, 보관 기간, 위변조 방지
description: 안전성 확보조치 기준 제8조의 접속기록 보관(1년/2년 이상)·점검·위변조 방지 요구를 감사 로그 스키마와 저장소 설계로 옮깁니다.
category: storage-retention
status: review-required
lastVerified: 2026-10-23
tags: [접속기록, 감사로그, 로그, 안전조치, 위변조방지, 관리자]
related: [internal-admin/activity-monitoring, internal-admin/admin-vs-data-access, app-security/log-masking, storage-retention/encryption]
sources: [pipa, pipa-decree, safety-notice, owasp-asvs-5, pipc-safety-guide]
legalBasis:
  - source: pipa
    article: 제29조
    kind: law
    summary: 내부 관리계획 수립, 접속기록 보관 등 대통령령으로 정하는 안전성 확보 조치 의무
    status: verified
  - source: pipa-decree
    article: 제30조제1항제5호
    kind: decree
    summary: 접속일시, 처리내역 등 접속기록의 저장·점검 및 확인·감독, 안전한 보관, 위조·변조 방지 조치
    status: verified
  - source: safety-notice
    article: 제2조제3호
    kind: notice
    summary: 접속기록은 식별자, 접속일시, 접속지 정보, 처리한 정보주체 정보, 수행업무 등을 전자적으로 기록한 것
    status: verified
  - source: safety-notice
    article: 제8조
    kind: notice
    summary: 접속기록 1년 이상 보관(5만명 이상, 고유식별정보·민감정보 처리, 기간통신사업자는 2년 이상), 접속기록·다운로드 점검 주기·방법·사후조치를 내부 관리계획으로 정해 이행, 위·변조·도난·분실 방지
    status: verified
  - source: safety-notice
    article: 제5조제3항
    kind: notice
    summary: 접근 권한 부여·변경·말소 내역을 기록하고 최소 3년간 보관
    status: verified
  - source: safety-notice
    article: 제4조제4항
    kind: notice
    summary: 개인정보 보호책임자는 접속기록 보관 및 점검 등 내부 관리계획 이행 실태를 연 1회 이상 점검
    status: verified
  - source: owasp-asvs-5
    article: V16 Security Logging and Error Handling
    kind: standard
    summary: 보안 이벤트 로깅, 로그 보호, 로그 내 민감정보 제외에 관한 검증 요구사항(장 단위)
    status: verified
  - source: pipc-safety-guide
    kind: guide
    summary: 점검 주기 예시, 다운로드 사유 확인 등 점검 방법 해설(원문 대조 전)
    status: review-required
---

## 한 문장 결론

개인정보취급자(관리자, 상담원, 운영자 등)가 개인정보처리시스템에서 **누가·언제·어디서·누구의 정보를·무엇을** 했는지를 기록하고, **최소 1년(일정 조건이면 2년) 이상** 위·변조할 수 없게 보관하며, 점검 주기와 방법을 내부 관리계획으로 정해 실제로 점검해야 합니다.

## 적용 조건과 예외

| 항목 | 고시 원문 기준 | 비고 |
| --- | --- | --- |
| 기록 대상 | 개인정보처리시스템에 접속한 자. **정보주체는 제외** (제8조제1항) | 회원 본인의 로그인 기록은 이 조의 대상이 아님. 관리자·운영자·배치 계정이 대상 |
| 기록 항목 | 식별자, 접속일시, 접속지 정보, 처리한 정보주체 정보, 수행업무 **등** (제2조제3호) | "등"이므로 최소 항목으로 보고 필요한 필드를 추가 |
| 기본 보관 | **1년 이상** (제8조제1항 본문) | |
| 2년 이상 보관 | ① 5만명 이상의 정보주체 개인정보를 처리하는 시스템 ② 고유식별정보 또는 민감정보를 처리하는 시스템 ③ 「전기통신사업법」상 기간통신사업자 (제8조제1항 각 호) | 하나라도 해당하면 2년 |
| 점검 | 접속기록과 **개인정보 다운로드 상황**을 확인·점검하는 주기·방법·사후조치절차를 내부 관리계획으로 정하고 이행 (제8조제2항) | 현행 고시 본문에는 구체적 점검 주기 숫자가 없음 |
| 보호 | 위·변조 및 도난, 분실되지 않도록 안전하게 보관 (제8조제3항) | |
| 권한 변경 내역 | 접근 권한 부여·변경·말소 내역 **최소 3년** 보관 (제5조제3항) | 접속기록과 별개 기록 |
| 공공시스템 | 자동화된 방식으로 분석해 유출·오남용 시도 탐지, 사유 소명 (제17조) | 보호위원회가 지정한 공공시스템운영기관만 |

주의:

- "월 1회 이상 점검", "다운로드 사유 확인" 같은 구체 기준은 과거 고시나 안내서에서 언급되던 내용입니다. **현행 고시 제2026-9호 제8조 원문에는 점검 주기 숫자와 "사유 확인" 문구가 없고**, 주기·방법을 내부 관리계획에 정하도록 되어 있습니다. 안내서가 권고하는 주기는 원문 대조 전이므로 `review-required`입니다.
- 보관 기간은 "이상"입니다. 상한은 고시에 없지만, 접속기록 자체도 개인정보(취급자 식별자, 처리한 정보주체 정보)를 담고 있으므로 목적 달성 후 파기 원칙(법 제21조)과 함께 정합니다. → [보존기간과 파기](/storage-retention/retention-destruction/)

## 실제 법적 근거

- 「개인정보 보호법」 제29조: 안전조치의무의 예로 "내부 관리계획 수립, 접속기록 보관 등"을 명시합니다.
- 시행령 제30조제1항제5호: "개인정보처리시스템에 접속한 자의 접속일시, 처리내역 등 접속기록의 저장ㆍ점검 및 이의 확인ㆍ감독", "접속기록의 안전한 보관", "위조ㆍ변조 방지를 위하여 필요한 조치".
- 고시 제8조제1항: "개인정보처리시스템에 접속한 자(다만, 정보주체는 제외한다)의 접속기록을 1년 이상 보관ㆍ관리하여야 한다. 다만, 다음 각 호의 어느 하나에 해당하는 경우에는 2년 이상 보관ㆍ관리하여야 한다."
- 고시 제8조제3항: "접속기록이 위ㆍ변조 및 도난, 분실되지 않도록 해당 접속기록을 안전하게 보관하기 위한 조치를 하여야 한다."

(고시 제2026-9호, 2026.7.1. 시행 기준. 2026-10-23 원문 대조.)

## 개발자용 실무 해설

1. **애플리케이션 로그와 접속기록을 분리합니다.** 디버그 로그는 짧게 보관하고 마스킹하지만, 접속기록은 1~2년 이상 보관하고 "어떤 정보주체를 처리했는지"를 남겨야 합니다. 같은 파이프라인에 섞으면 보관 기간과 마스킹 정책이 충돌합니다. → [로그 마스킹](/app-security/log-masking/)
2. **"처리한 정보주체 정보"는 식별자로 남깁니다.** 고객 이름이나 전화번호 원문을 남기지 말고 `subject_id`(내부 회원 ID)를 기록합니다. 목록 조회라면 결과에 포함된 ID 목록이나 조회 조건과 건수를 남깁니다.
3. **"수행업무"는 동사 단위로 표준화합니다.** `view`, `search`, `update`, `delete`, `download`, `print`, `decrypt` 같은 고정 enum을 쓰면 점검 쿼리가 단순해집니다. 다운로드는 파일명, 건수, 포함 항목도 함께 남깁니다(제8조제2항 다운로드 점검 대비).
4. **위·변조 방지**는 쓰기 전용(append-only) 저장소, 운영자와 분리된 계정, 해시 체인 또는 WORM(객체 잠금) 스토리지 같은 방법으로 구현합니다. 어떤 방식이 "안전한 보관"으로 충분한지는 고시가 특정하지 않으므로 내부 관리계획에 근거를 적습니다.
5. **점검은 자동화합니다.** 고시가 주기를 정하지 않았더라도 "정하고 이행"한 증거가 필요합니다. 야간·대량 조회, 평소보다 많은 다운로드, 퇴사 예정자 조회 같은 규칙을 정해 알림을 만들고, 점검 결과와 사후조치를 기록합니다.
6. **배치·서비스 계정도 대상입니다.** 개인정보처리시스템에 접속한 "자"에 사람만 있는 것은 아닙니다. 배치 작업의 실행 주체(트리거한 사람 또는 스케줄)를 함께 남기면 추적이 가능합니다.

## 권장 설계

```text
access_log (append-only)
├─ id                 ULID
├─ actor_id           개인정보취급자 계정 ID (식별자)
├─ actor_role         접속 당시 역할
├─ occurred_at        UTC 타임스탬프 (접속일시)
├─ source_ip          접속지 정보 (+ 단말/세션 ID)
├─ action             view | search | update | delete | download | decrypt ...
├─ resource           customer, order ...
├─ subject_ids        처리한 정보주체 ID 목록 (또는 조회 조건 + 건수)
├─ fields             조회·변경한 항목 (예: ["phone", "address"])
├─ reason             사유 입력값 (다운로드·복호화 등 고위험 행위)
├─ prev_hash          직전 레코드 해시
└─ hash               sha256(prev_hash + canonical(record))
```

- 저장소: 별도 계정의 객체 스토리지(객체 잠금/보존 정책) 또는 append-only 테이블 + 정기 해시 스냅샷 외부 보관
- 보관 정책: 2년 대상 여부를 시스템 단위로 판단해 설정값으로 관리 (`retention_days >= 730`)
- 조회 권한: 접속기록 열람자도 접속기록을 남깁니다(감사자 감사)

## 위험한 설계

- 관리자 화면 접근만 기록하고 "누구의 정보를 봤는지"는 남기지 않음
- 접속기록을 애플리케이션 로그와 같은 버킷에 30일 보관
- 운영자가 접속기록 테이블에 `UPDATE`/`DELETE` 권한을 가진 구조
- 공용 관리자 계정을 써서 식별자가 사람 단위로 구분되지 않음(고시 제5조제4항도 위반 소지)
- 접속기록에 고객 이름·전화번호 원문을 그대로 기록
- 점검 규칙은 있으나 점검 결과와 사후조치 기록이 없음

## Python/TypeScript 구현 예제

```python
# FastAPI 의존성: 개인정보 조회 API에서 접속기록을 해시 체인으로 남긴다
import hashlib, json
from datetime import datetime, timezone
from fastapi import Depends, Request

class AccessLogWriter:
    def __init__(self, store):
        self.store = store  # append(record) / last_hash() 를 제공하는 append-only 저장소

    def write(self, *, actor_id: str, role: str, ip: str, action: str,
              resource: str, subject_ids: list[str], fields: list[str],
              reason: str | None = None) -> None:
        record = {
            "actor_id": actor_id, "actor_role": role, "source_ip": ip,
            "occurred_at": datetime.now(timezone.utc).isoformat(),
            "action": action, "resource": resource,
            "subject_ids": subject_ids, "fields": fields, "reason": reason,
            "prev_hash": self.store.last_hash(),
        }
        canonical = json.dumps(record, sort_keys=True, ensure_ascii=False)
        record["hash"] = hashlib.sha256(canonical.encode()).hexdigest()
        self.store.append(record)

@app.get("/admin/customers/{customer_id}")
def get_customer(customer_id: str, request: Request,
                 user=Depends(current_staff), log: AccessLogWriter = Depends(get_log)):
    customer = repo.get_for_admin(customer_id, fields=["name", "phone"])
    log.write(actor_id=user.id, role=user.role, ip=request.client.host,
              action="view", resource="customer",
              subject_ids=[customer_id], fields=["name", "phone"])
    return customer
```

```ts
// 해시 체인 무결성 검증 (정기 점검 배치에서 실행)
import { createHash } from 'node:crypto';

type AccessLog = Record<string, unknown> & { hash: string; prev_hash: string | null };

const canonical = (o: Record<string, unknown>) =>
  JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b))));

export function verifyChain(rows: AccessLog[]): number | null {
  let prev: string | null = rows[0]?.prev_hash ?? null;
  for (const [i, row] of rows.entries()) {
    const { hash, ...rest } = row;
    if (rest.prev_hash !== prev) return i;
    const expected = createHash('sha256').update(canonical(rest)).digest('hex');
    if (expected !== hash) return i; // 변조 의심 위치
    prev = hash;
  }
  return null;
}
```

Python 예제의 `json.dumps(sort_keys=True)`와 TypeScript의 정렬 직렬화는 중첩 객체와 공백 처리에서 결과가 다를 수 있습니다. 실제로는 한 언어에서 정한 정규화 규칙(예: RFC 8785 JCS)을 양쪽에 똑같이 적용하세요. 전체 예제는 [구현 예제](/tools/examples/)를 참고하세요.

## 개발 체크리스트

- [ ] 개인정보취급자 계정의 조회·검색·변경·삭제·다운로드·복호화에 접속기록이 남는다
- [ ] 접속기록에 식별자, 접속일시, 접속지 정보, 처리한 정보주체 정보, 수행업무가 모두 있다
- [ ] 시스템이 2년 보관 대상(5만명 이상, 고유식별정보·민감정보 처리, 기간통신사업자)인지 판단해 보관 기간을 설정했다
- [ ] 접속기록 저장소에 운영자의 수정·삭제 권한이 없고, 무결성 검증(해시 체인/객체 잠금)이 있다
- [ ] 다운로드 이력(건수, 항목, 파일)을 별도로 점검할 수 있다
- [ ] 점검 주기·방법·사후조치가 내부 관리계획에 있고, 점검 결과가 기록된다
- [ ] 권한 부여·변경·말소 내역을 3년 이상 보관한다
- [ ] 접속기록에 고객 개인정보 원문이 들어가지 않는다
- [ ] 안내서의 권장 점검 주기·사유 확인 기준을 원문으로 확인했다 (`review-required`)

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 고시 제2조·제4조·제5조·제8조와 시행령 제30조는 2026-10-23에 국가법령정보센터 Open API로 현행 원문을 확인했습니다. 점검 주기 예시와 다운로드 사유 확인 등 안내서 내용은 `review-required`입니다.
