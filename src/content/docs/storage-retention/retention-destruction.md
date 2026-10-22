---
title: 보존기간과 파기 — 만료 배치, 분리 보관, 백업까지
description: 개인정보 보호법 제21조의 "지체 없이 파기"와 다른 법령에 따른 분리 보존, 시행령 제16조·고시 제13조의 파기 방법을 보존기간 만료 배치와 분리 보관 DB 설계로 옮깁니다.
category: storage-retention
status: review-required
lastVerified: 2026-10-23
tags: [파기, 보존기간, 분리보관, 백업, 회원탈퇴, 안전조치]
related: [app-security/data-subject-rights, collection-consent/lawful-basis, sensitive-data/pseudonymization, storage-retention/access-logs]
sources: [pipa, pipa-decree, safety-notice, pipc-integrated-guide]
legalBasis:
  - source: pipa
    article: 제21조제1항
    kind: law
    summary: 보유기간 경과, 처리 목적 달성, 가명정보 처리 기간 경과 등 불필요하게 되었을 때 지체 없이 파기. 다만 다른 법령에 따라 보존해야 하는 경우는 예외
    status: verified
  - source: pipa
    article: 제21조제2항, 제3항
    kind: law
    summary: 파기 시 복구·재생되지 않도록 조치, 다른 법령에 따라 보존하는 개인정보는 다른 개인정보와 분리하여 저장·관리
    status: verified
  - source: pipa-decree
    article: 제16조
    kind: decree
    summary: 전자적 파일은 복원이 불가능한 방법으로 영구 삭제(현저히 곤란하면 법 제58조의2 정보로 처리), 그 밖의 기록물은 파쇄 또는 소각
    status: verified
  - source: safety-notice
    article: 제13조
    kind: notice
    summary: 완전파괴, 전용 소자장비 삭제, 복원되지 않도록 초기화 또는 덮어쓰기 중 하나. 일부만 파기하는 전자 파일은 삭제 후 복구·재생되지 않도록 관리·감독. 현저히 곤란하면 법 제58조의2 정보로 처리
    status: verified
  - source: pipa
    article: 제37조제3항
    kind: law
    summary: 동의 철회 시 지체 없이 수집된 개인정보를 복구·재생할 수 없도록 파기하는 등 필요한 조치
    status: verified
  - source: pipc-integrated-guide
    kind: guide
    summary: 지체 없이 파기의 실무 기준 기간, 백업 데이터 파기 시점 등 해석(원문 대조 전)
    status: review-required
  - source: ecommerce-act
    kind: law
    summary: 전자상거래 거래기록 등 개별 법률의 보존 의무와 기간(시행령 포함 원문 미대조)
    status: review-required
  - source: comm-secrets-act
    kind: law
    summary: 통신사실확인자료 등 보관 관련 의무 해당 여부와 기간(해당 조문 원문 미대조)
    status: review-required
---

## 한 문장 결론

개인정보마다 **보유기간 종료 시점을 데이터로 저장**하고, 종료되면 **배치로 지체 없이 복구 불가능하게 삭제**하되, 다른 법령이 보존을 요구하는 항목만 **분리된 저장소로 옮겨 그 법령의 기간만큼** 보관합니다.

## 적용 조건과 예외

| 상황 | 처리 | 근거 |
| --- | --- | --- |
| 보유기간 경과, 처리 목적 달성 | 지체 없이 파기 | 법 제21조제1항 본문 |
| 가명정보 처리 기간 경과 | 지체 없이 파기 | 법 제21조제1항 본문 |
| 정보주체의 동의 철회 | 지체 없이 복구·재생할 수 없도록 파기 등 조치 (제37조제2항 각 호 사유가 있으면 예외 가능) | 법 제37조제3항 |
| 처리정지 요구로 처리가 정지된 정보 | 지체 없이 파기 등 필요한 조치 | 법 제37조제5항 |
| 다른 법령에 따라 보존 의무 | 파기하지 않고 **다른 개인정보와 분리하여** 저장·관리 | 법 제21조제1항 단서, 제3항 |
| 전자적 파일의 영구 삭제가 기술적으로 현저히 곤란 | 법 제58조의2 정보(더 이상 개인을 알아볼 수 없는 정보)로 처리해 복원 불가능하게 | 시행령 제16조제1항제1호 단서, 고시 제13조제3항 |

개별 법률의 보존 의무(확인 필요):

| 예시 (`review-required`) | 흔히 언급되는 보존 대상 | 확인할 것 |
| --- | --- | --- |
| 「전자상거래 등에서의 소비자보호에 관한 법률」 및 시행령 | 계약·청약철회, 대금결제·재화공급, 소비자 불만·분쟁처리 기록 | 조문 번호, 기간, 적용 사업자 범위 |
| 「통신비밀보호법」 | 통신사실확인자료(로그 기록 등) | 적용 대상(전기통신사업자 여부)과 기간 |
| 「국세기본법」, 「부가가치세법」 등 세법 | 거래 장부·증빙 | 대상 서류와 기간 |
| 「전자금융거래법」 | 전자금융거래 기록 | 적용 대상과 기간 |

이 표의 기간은 이 문서에서 단정하지 않습니다. 개별 법률 원문을 확인하기 전까지는 **각 보존 항목에 근거 조문 링크와 법무 확인 여부를 같이 저장**하세요.

## 실제 법적 근거

- 「개인정보 보호법」 제21조제1항: "보유기간의 경과, 개인정보의 처리 목적 달성, 가명정보의 처리 기간 경과 등 그 개인정보가 불필요하게 되었을 때에는 지체 없이 그 개인정보를 파기하여야 한다. 다만, 다른 법령에 따라 보존하여야 하는 경우에는 그러하지 아니하다."
- 같은 조 제2항: 파기할 때에는 "복구 또는 재생되지 아니하도록 조치"해야 합니다.
- 같은 조 제3항: 다른 법령에 따라 보존하는 경우 "해당 개인정보 또는 개인정보파일을 다른 개인정보와 분리하여서 저장ㆍ관리"해야 합니다.
- 시행령 제16조제1항: 전자적 파일은 "복원이 불가능한 방법으로 영구 삭제", 그 밖의 기록물·인쇄물·서면은 "파쇄 또는 소각".
- 고시 제13조제1항: ① 완전파괴(소각·파쇄 등) ② 전용 소자장비로 삭제 ③ 데이터가 복원되지 않도록 초기화 또는 덮어쓰기 중 하나. 제2항: 일부만 파기하는 경우 전자적 파일은 "개인정보를 삭제한 후 복구 및 재생되지 않도록 관리 및 감독".

(법률 제21445호, 시행령 제36671호, 고시 제2026-9호 기준. 2026-10-23 원문 대조.)

## 개발자용 실무 해설

1. **DB 행 삭제는 고시 제13조제2항의 "일부 파기"로 보는 것이 자연스럽습니다.** 운영 DB에서 특정 회원의 행만 지울 때 디스크 덮어쓰기는 현실적으로 어렵습니다. `DELETE` 후 복구·재생되지 않도록 관리·감독(삭제 로그, 복구 경로 차단, 백업 처리 정책)하는 구조를 갖춥니다. 이 해석이 충분한지는 안내서 확인이 필요합니다(`review-required`).
2. **소프트 삭제(`deleted_at`)는 파기가 아닙니다.** 탈퇴 처리용 플래그는 둘 수 있지만, 보유기간이 끝나면 하드 삭제나 비식별 처리로 이어져야 합니다.
3. **"지체 없이"는 숫자가 법률에 없습니다.** 안내서에서 실무 기준 기간을 제시하는지 확인이 필요하며(`review-required`), 배치 주기는 짧게(예: 일 1회) 두고 지연 시간을 모니터링하는 편이 설명하기 쉽습니다.
4. **분리 보관은 물리·논리 분리 + 접근권한 분리입니다.** 별도 스키마나 DB, 별도 서비스 계정을 쓰고, 운영 기능(마케팅, 추천, 검색)에서 조회되지 않게 합니다. 보존 사유(근거 법령)와 만료일을 레코드마다 둡니다.
5. **백업**: 운영 DB에서 지워도 백업에는 남습니다. 백업 보존 주기를 짧게 하고 주기가 지나면 자연 소멸되게 하거나, 복구 시 삭제 대장(tombstone)을 재적용하는 절차를 둡니다. 암호화된 백업이라면 해당 키 폐기(crypto-shredding)도 선택지입니다. 백업 파기 시점에 대한 공식 해석은 `review-required`입니다.
6. **파생 데이터까지 찾아야 합니다.** 검색 인덱스, 캐시, 데이터 웨어하우스, 로그, 외부 수탁사(위탁) 사본, 분석용 가명정보가 대상입니다. 데이터 계보(lineage)가 없으면 파기 범위를 증명하기 어렵습니다.
7. **파기 기록을 남깁니다.** 내부 관리계획에는 파기에 관한 사항이 포함되어야 합니다(고시 제4조제1항제13호). 무엇을(건수, 항목), 언제, 어떤 방법으로 파기했는지 기록하되, 파기 기록 자체에 파기 대상 개인정보를 남기지 않습니다.

## 권장 설계

```text
retention_policy (코드/설정으로 관리)
├─ data_class: "member_profile"   basis: 계약 이행   retain_until: 탈퇴 시점
├─ data_class: "order_record"     basis: 개별 법률 보존 (근거 조문 링크, review-required)
│                                 retain_for: <법령 기간>   storage: archive_db
└─ data_class: "cs_chat"          basis: 계약 이행   retain_for: 정책 기간

tables
├─ main.users              ← 탈퇴 시: 보존 항목만 archive로 이동 후 삭제
├─ archive.order_records   ← 분리 저장 (법 제21조제3항), 별도 계정, 조회 사유 기록
│    ├─ legal_basis        "전자상거래법 …" (확인 필요)
│    └─ expire_at          만료일 인덱스
└─ ops.destruction_log     ← 파기 일시, data_class, 건수, 방법 (개인정보 없음)
```

## 위험한 설계

- 탈퇴 회원을 `is_deleted = true`로만 표시하고 영구 보관
- "관련 법령에 따라 5년 보관" 같은 문구로 모든 항목을 통째로 보관(보존 의무가 없는 항목까지 포함)
- 보존 데이터를 운영 테이블에 그대로 두어 마케팅·추천 쿼리에서 조회됨
- 백업을 무기한 보관하고 복구 시 삭제된 회원이 되살아남
- 검색 엔진·캐시·로그·데이터 웨어하우스는 파기 배치 범위 밖
- 파기 로그에 이름·전화번호를 남겨 "무엇을 지웠는지" 기록

## Python/TypeScript 구현 예제

```python
# 보존기간 만료 배치: 보존 의무 항목은 분리 저장소로 옮기고 나머지는 삭제
from datetime import datetime, timezone

ARCHIVE_FIELDS = {"order_id", "ordered_at", "amount", "buyer_id"}  # 근거 법령 확인 필요

def run_expiry_batch(db, archive_db, now: datetime | None = None, batch_size: int = 500) -> int:
    now = now or datetime.now(timezone.utc)
    total = 0
    while True:
        rows = db.fetch("SELECT * FROM orders WHERE retain_until <= %s LIMIT %s", now, batch_size)
        if not rows:
            break
        with db.transaction(), archive_db.transaction():
            for r in rows:
                if r["legal_hold_basis"]:
                    archive_db.insert("order_records", {
                        **{k: r[k] for k in ARCHIVE_FIELDS},
                        "legal_basis": r["legal_hold_basis"],
                        "expire_at": r["legal_hold_until"],
                    })
            db.execute("DELETE FROM orders WHERE id = ANY(%s)", [r["id"] for r in rows])
            db.insert("destruction_log", {
                "data_class": "orders", "count": len(rows),
                "method": "db-delete+backup-expiry", "at": now,
            })
        total += len(rows)
    return total
```

```ts
// 백업 복구 후 삭제 대장(tombstone) 재적용 — 파기된 정보가 되살아나지 않게
type Tombstone = { table: string; id: string; deletedAt: string };

export async function reapplyTombstones(
  db: { delete(table: string, id: string): Promise<void> },
  tombstones: AsyncIterable<Tombstone>,
  restoredSnapshotAt: Date,
): Promise<number> {
  let n = 0;
  for await (const t of tombstones) {
    if (new Date(t.deletedAt) > restoredSnapshotAt) {
      await db.delete(t.table, t.id); // tombstone에는 식별자만 둔다
      n++;
    }
  }
  return n;
}
```

전체 예제는 [구현 예제](/tools/examples/)를 참고하세요.

## 개발 체크리스트

- [ ] 개인정보 데이터 클래스마다 보유기간 또는 종료 조건과 근거가 정의되어 있다
- [ ] 만료 배치가 주기적으로 돌고, 지연·실패를 알림으로 받는다
- [ ] 동의 철회·처리정지 이벤트가 파기 파이프라인으로 이어진다
- [ ] 다른 법령에 따른 보존 항목은 별도 저장소·계정으로 분리되고, 항목마다 근거 조문과 만료일이 있다
- [ ] 보존 의무 항목은 필요한 필드만 옮기고 나머지는 삭제한다
- [ ] 검색 인덱스·캐시·로그·데이터 웨어하우스·수탁사 사본이 파기 범위에 포함된다
- [ ] 백업 보존 주기와 복구 시 tombstone 재적용 절차가 있다
- [ ] 파기 기록(일시, 대상 분류, 건수, 방법)이 남고, 기록에 개인정보가 없다
- [ ] 개별 법률 보존 기간을 원문으로 확인하고 법무 검토를 받았다 (`review-required`)

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 법 제21조·제37조, 시행령 제16조, 고시 제13조는 2026-10-23에 국가법령정보센터 Open API로 현행 원문을 확인했습니다. 전자상거래법 등 개별 법률의 보존 기간과 "지체 없이"의 실무 기준, 백업 처리에 대한 안내서 해석은 `review-required`입니다.
