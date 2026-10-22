---
title: 정보주체 권리 API — 열람·정정·삭제·처리정지·전송 요구
description: 개인정보 보호법 제35조~제38조와 시행령 제41조~제47조의 처리 기한(10일), 본인확인, 거절 통지 요건을 열람·내보내기·삭제 요청 처리 파이프라인으로 옮기고, 제35조의2 전송 요구의 적용 대상과 시행 시기를 정리합니다.
category: app-security
status: review-required
lastVerified: 2026-10-23
tags: [정보주체권리, 열람, 삭제, 처리정지, 전송요구, 회원탈퇴]
related: [storage-retention/retention-destruction, collection-consent/consent-ui, ai-llm/automated-decisions, auth-access/authentication-session]
sources: [pipa, pipa-decree, pipc-integrated-guide]
legalBasis:
  - source: pipa
    article: 제35조
    kind: law
    summary: 정보주체의 열람 요구, 대통령령 기간 내 열람, 정당한 사유 시 연기, 법률상 금지·타인 이익 침해 등 사유로 제한·거절
    status: verified
  - source: pipa-decree
    article: 제41조, 제42조
    kind: decree
    summary: 열람 대상 5개 사항, 수집보다 어렵지 않은 방법, 요구받은 날부터 10일 이내 열람(통지서), 연기·거절도 10일 이내 사유·이의제기방법 통지
    status: verified
  - source: pipa
    article: 제36조
    kind: law
    summary: 열람한 정보주체의 정정·삭제 요구, 지체 없이 조사·조치 후 결과 통지, 복구·재생되지 않도록 삭제, 다른 법령에서 수집 대상으로 명시된 경우 삭제 요구 불가
    status: verified
  - source: pipa-decree
    article: 제43조
    kind: decree
    summary: 정정·삭제 요구를 받은 날부터 10일 이내 조치 사실 또는 미이행 사유·이의제기방법 통지, 제공받은 정보는 제공한 기관에 지체 없이 알림
    status: verified
  - source: pipa
    article: 제37조
    kind: law
    summary: 처리정지 요구·동의 철회, 지체 없이 정지, 거절 사유 4가지, 동의 철회 시 지체 없이 파기, 거절 시 지체 없이 사유 통지
    status: verified
  - source: pipa-decree
    article: 제44조
    kind: decree
    summary: 처리정지 요구를 받은 날부터 10일 이내 조치 사실 또는 거절 사실·이유·이의제기방법 통지
    status: verified
  - source: pipa
    article: 제38조
    kind: law
    summary: 대리인 행사, 만 14세 미만 아동 법정대리인, 수수료, 방법·절차 공개(수집보다 어렵지 않게), 이의제기 절차 마련·안내
    status: verified
  - source: pipa-decree
    article: 제45조, 제46조, 제47조
    kind: decree
    summary: 대리인 범위와 위임장, 열람등요구자가 본인 또는 정당한 대리인인지 확인, 수수료는 실비 범위이며 처리자에게 사유가 있으면 청구 불가
    status: verified
  - source: pipa
    article: 제35조의2
    kind: law
    summary: 대통령령 기준에 해당하는 개인정보처리자에 대한 본인 또는 제3자 전송 요구, 정보처리장치로 처리 가능한 형태로 전송
    status: verified
  - source: pipa-decree
    article: 제42조의2, 제42조의4, 제42조의6, 제42조의8
    kind: decree
    summary: 정보전송자 기준, 전송 대상 정보 범위(일방향 암호화 정보 등 제외), 지체 없이 암호화하여 전송, 거절·중단 사유
    status: verified
  - source: pipa-decree
    article: 부칙(제36121호, 제35343호)
    kind: decree
    summary: 본인대상정보전송자 중 매출·규모 기준(제42조의2제1항제1호)은 2026.2.19. 공포 후 1년 경과한 날부터 시행. 정확한 시행일과 우리 서비스 해당 여부는 확인 필요
    status: review-required
  - source: pipc-integrated-guide
    kind: guide
    summary: 본인확인 수준, 삭제 범위(백업 포함), 열람 제공 형식에 대한 해석(원문 대조 전)
    status: review-required
---

## 한 문장 결론

열람·정정·삭제·처리정지 요구는 **받은 날부터 10일 이내**에 조치하거나 거절 사유와 이의제기방법을 통지해야 하므로, 요청 접수 → 본인확인 → 자동 처리 → 결과 통지를 **기한이 붙은 작업 큐**로 만드는 것이 기본입니다. 요청 방법은 **수집할 때보다 어렵지 않아야** 합니다.

## 적용 조건과 예외

| 권리 | 기한 | 거절·예외 | 근거 |
| --- | --- | --- | --- |
| 열람 | 요구받은 날부터 **10일 이내** 열람하게 함. 연기·거절도 10일 이내 사유와 이의제기방법 통지 | 법률상 금지·제한, 타인의 생명·신체·재산 등 침해 우려, 공공기관 특정 업무 → 일부 제한 가능(나머지는 열람) | 법 제35조, 시행령 제41조④⑤, 제42조 |
| 정정·삭제 | 지체 없이 조사·조치, **10일 이내** 결과 통지 | 다른 법령에서 수집 대상으로 명시된 정보는 삭제 요구 불가 → 지체 없이 그 내용 통지 | 법 제36조, 시행령 제43조③ |
| 처리정지 | 지체 없이 정지, **10일 이내** 결과 통지 | ① 법률 특별 규정·법령상 의무 ② 타인 생명·신체·재산 침해 우려 ③ 공공기관 소관 업무 ④ 계약 이행 곤란 + 정보주체가 해지 의사를 명확히 밝히지 않음 | 법 제37조②, 시행령 제44조② |
| 동의 철회 | 지체 없이 복구·재생할 수 없도록 파기 등 | 제37조제2항 각 호 사유 시 조치하지 않을 수 있음 → 지체 없이 사유 통지 | 법 제37조③④ |
| 전송 요구 | 지체 없이 전송(정당한 사유 시 사유를 알리고 연기) | 시행령 제42조의8제1항 11개 사유 | 법 제35조의2, 시행령 제42조의6, 제42조의8 |
| 자동화된 결정 거부·설명 | 별도 문서 참고 | — | 법 제37조의2 → [자동화된 결정](/ai-llm/automated-decisions/) |

**공통 요건**

- **방법·절차**(법 제38조④, 시행령 제41조②): 서면, 전화, 전자우편, 인터넷 등 쉽게 활용할 수 있는 방법을 제공하고, 정당한 사유가 없으면 **최소한 수집한 창구 또는 방법과 동일하게** 요구할 수 있어야 하며, 홈페이지를 운영하면 방법과 절차를 공개합니다. 처리정지(제44조①)와 정정·삭제(제43조①)에도 준용됩니다.
- **본인확인**(시행령 제46조①): 열람등요구를 한 사람이 본인이거나 정당한 대리인인지 확인해야 합니다.
- **대리인**(법 제38조①②, 시행령 제45조): 법정대리인 또는 위임받은 자가 위임장을 제출해 대리할 수 있고, 만 14세 미만 아동의 법정대리인도 요구할 수 있습니다.
- **수수료**(시행령 제47조): 실비 범위에서 정할 수 있지만, 요구 사유가 처리자에게 있으면 청구할 수 없습니다.
- **이의제기**(법 제38조⑤): 거절 등에 불복할 수 있는 절차를 마련하고 안내해야 합니다.

**전송 요구(제35조의2)의 적용 대상 — 확인 필요**

- 법 제35조의2는 시행령 부칙(제35343호) 제1조제2항에 따라 **2025.3.13.**부터 시행되었습니다.
- 전송 의무가 있는 처리자는 시행령 제42조의2가 정합니다. 본인에게 전송(본인대상정보전송자)은 ① 평균매출액등 1,800억원 초과이면서 5만명 이상 민감정보·고유식별정보 처리 또는 100만명 이상 개인정보 처리(각급 학교·의료기관 제외) ② 공공시스템운영기관 ③ 제3자대상정보전송자입니다. 제3자에게 전송(제3자대상정보전송자)은 보건의료·통신·에너지 분야의 정해진 기관입니다.
- **①의 매출·규모 기준(제42조의2제1항제1호)은 시행령 부칙(제36121호, 2026.2.19. 공포) 단서에 따라 "공포 후 1년이 경과한 날"부터 시행**되므로 2026-10-23 현재는 아직 시행 전으로 읽힙니다. 정확한 시행일, 같은 개정의 나머지 규정 시행일(공포 후 6개월), 우리 서비스의 해당 여부는 `review-required`입니다. 시행 전 규정을 현재 의무로 쓰지 않습니다.
- 전송 의무 대상이 아니더라도 열람(제35조)은 모든 처리자에게 적용됩니다. 열람용 내보내기 기능을 기계 판독 형식으로 만들어 두면 나중에 전송 요구에 대응하기 쉽습니다.

## 실제 법적 근거

- 법 제35조제3항: "대통령령으로 정하는 기간 내에 정보주체가 해당 개인정보를 열람할 수 있도록 하여야 한다." 시행령 제41조제4항: "'대통령령으로 정하는 기간'이란 10일을 말한다."
- 시행령 제41조제1항: 열람 대상은 ① 개인정보의 항목 및 내용 ② 수집·이용 목적 ③ 보유 및 이용 기간 ④ 제3자 제공 현황 ⑤ 처리에 동의한 사실 및 내용 중 정보주체가 열람하려는 사항입니다.
- 법 제36조제3항: 삭제할 때에는 "복구 또는 재생되지 아니하도록 조치하여야 한다."
- 시행령 제43조제2항: 다른 처리자로부터 제공받은 정보에 대한 정정·삭제 요구는 직접 처리하거나 제공한 기관의 장에게 지체 없이 알리고 그 결과에 따라 조치합니다.
- 법 제38조제4항 후단: "열람등요구의 방법과 절차는 해당 개인정보의 수집 방법과 절차보다 어렵지 아니하도록 하여야 한다."
- 법 제35조의2제3항: 전송 요구를 받으면 "시간, 비용, 기술적으로 허용되는 합리적인 범위에서 해당 정보를 컴퓨터 등 정보처리장치로 처리 가능한 형태로 전송"해야 합니다. 시행령 제42조의4제1항제3호는 "복호화되지 않도록 일방향 암호화하여 저장된 정보"를 본인전송정보에서 제외합니다.
- 시행령 제42조의6제3항제1호가목: 본인대상정보전송자는 "안전한 암호 알고리즘으로 암호화하여 전송"해야 합니다.

(법률 제21445호, 시행령 제36671호 기준. 2026-10-23 국가법령정보센터 원문과 부칙을 대조.)

## 개발자용 실무 해설

1. **10일은 "받은 날부터"입니다.** 접수 시각(`received_at`)과 기한(`due_at`)을 요청 레코드에 저장하고, 본인확인 대기 상태에서도 시계가 도는지 정책을 정합니다(본인확인 지연 시 처리 기준은 `review-required`). 기한 3일 전 알림을 둡니다.
2. **본인확인은 로그인 세션 + 재인증**이 가장 간단합니다. 회원은 최근 인증(비밀번호 재입력, OTP)을 요구하고, 비회원·탈퇴 회원은 수집 시 사용한 연락 수단으로 확인합니다. 본인확인을 위해 새 개인정보(신분증 사본 등)를 과도하게 요구하면 "수집보다 어렵지 않게" 요건과 최소 수집 원칙에 부딪힙니다.
3. **열람 응답은 5개 사항을 모두 덮어야 합니다.** 항목·내용만 덤프하지 말고, 목적, 보유기간, 제3자 제공 현황, 동의 이력을 함께 냅니다. 데이터 카탈로그(필드별 목적·근거·보유기간)가 있으면 자동 생성할 수 있습니다. → [처리 근거](/collection-consent/lawful-basis/)
4. **내보내기 포맷**: 사람이 읽을 HTML/PDF 요약 + 기계 판독용 JSON(또는 CSV)을 함께 제공하는 구성이 실용적입니다. 다운로드 링크는 짧은 만료, 1회성, 본인 세션에 묶습니다. 파일에 다른 사람의 정보(대화 상대 등)가 섞이지 않게 필터링합니다(법 제35조제4항제2호, 제35조의2제7항).
5. **삭제는 파이프라인입니다.** 운영 DB, 검색 인덱스, 캐시, 데이터 웨어하우스, 수탁사, 백업을 순서대로 처리하고, 법령상 보존 항목은 분리 보관으로 옮깁니다. 삭제 거절(다른 법령상 수집 대상) 항목은 사유와 함께 통지합니다. → [보존과 파기](/storage-retention/retention-destruction/)
6. **처리정지와 삭제를 구분합니다.** 처리정지는 "처리 중단"(마케팅, 프로파일링, 추천 등 특정 처리 플래그 off)이고, 정지된 정보는 지체 없이 파기 등 필요한 조치를 해야 합니다(법 제37조⑤). 서비스 이용을 위해 필요한 처리를 정지하면 계약 이행이 곤란하므로 거절 사유(④호)와 해지 의사 확인을 화면에서 안내합니다.
7. **모든 통지를 기록합니다.** 결과 통지서, 연기·거절 통지서는 보호위원회 고시 양식이 있습니다(시행령 제41조⑤, 제42조②, 제43조③, 제44조②). 양식 세부는 원문 확인 필요(`review-required`). 시스템은 통지 내용, 발송 시각, 채널을 남깁니다.

## 권장 설계

```text
POST /privacy-requests        {type: access|rectify|erase|restrict|withdraw|port, scope?, agent?}
  → privacy_request(id, subject_id, type, received_at, due_at = received_at + 10d,
                    status: received → verifying → processing → done | rejected | deferred,
                    verification_method, agent_power_of_attorney_id?)
  → 본인확인 (재인증 / 수집 채널 확인 / 대리인 위임장)
  → workers
      access/port : catalog 기반 수집 → JSON + 요약 PDF → 서명 URL(만료 24h)
      rectify     : 필드 검증 → 갱신 → 제공받은 곳 통지 필요 여부 체크
      erase       : legal_hold 검사 → archive 이동 → 삭제 fan-out(DB, index, cache, DW, 수탁사)
      restrict    : processing_flags 갱신(marketing=false, profiling=false ...)
  → notice(type: result|deferral|rejection, reason, appeal_method, sent_at)
```

## 위험한 설계

- 회원가입은 웹에서 1분이면 되는데 열람·삭제는 이메일로 신분증 사본을 보내야 가능
- 요청 접수 시각이 없어 10일 기한을 증명할 수 없음
- 열람 결과가 DB 테이블 덤프뿐이고 목적·보유기간·제3자 제공 현황이 없음
- 탈퇴 = `is_active=false`이고 실제 삭제·분리 보관이 없음
- 내보내기 파일을 공개 URL로 장기간 제공
- 삭제를 거절하면서 사유와 이의제기방법을 알리지 않음
- 시행 전인 전송 요구 기준을 "현재 의무"라고 문서화하거나, 반대로 이미 시행된 열람 의무를 전송 요구와 혼동해 미루기

## Python/TypeScript 구현 예제

```python
# FastAPI: 권리 행사 요청 접수 — 기한 계산, 최근 재인증 요구
from datetime import datetime, timedelta, timezone
from enum import Enum
from fastapi import Depends, HTTPException
from pydantic import BaseModel

class RequestType(str, Enum):
    ACCESS = "access"; RECTIFY = "rectify"; ERASE = "erase"
    RESTRICT = "restrict"; WITHDRAW = "withdraw"; PORT = "port"

class PrivacyRequestIn(BaseModel):
    type: RequestType
    items: list[str] | None = None   # 열람하려는 사항(시행령 제41조①) 또는 정정 대상

DUE = timedelta(days=10)             # 시행령 제41조④·제43조③·제44조②

@app.post("/privacy-requests", status_code=202)
def create_request(body: PrivacyRequestIn, user=Depends(current_user)):
    if not user.reauthenticated_within(minutes=10):
        raise HTTPException(401, "본인확인을 위해 다시 인증해 주세요")   # 시행령 제46조①
    now = datetime.now(timezone.utc)
    req = repo.create_privacy_request(
        subject_id=user.id, type=body.type, items=body.items,
        received_at=now, due_at=now + DUE, verification_method="session+reauth",
    )
    queue.enqueue(f"privacy.{body.type.value}", req.id)
    return {"id": req.id, "due_at": req.due_at}

def build_access_report(subject_id: str) -> dict:
    """열람 응답: 시행령 제41조제1항 5개 사항"""
    return {
        "items": catalog.collect_values(subject_id),           # 항목 및 내용
        "purposes": catalog.purposes(),                         # 수집·이용 목적
        "retention": catalog.retention_policies(),              # 보유·이용 기간
        "third_party_provisions": provisions.for_subject(subject_id),
        "consents": consents.history(subject_id),               # 동의 사실 및 내용
    }
```

```ts
// 삭제 요청 fan-out: 보존 의무 검사 → 분리 보관 → 각 저장소 삭제 → 결과 통지
type EraseResult = { store: string; ok: boolean; retainedReason?: string };

interface Store { name: string; erase(subjectId: string): Promise<void> }

export async function processErase(
  subjectId: string,
  stores: Store[],
  legalHold: (subjectId: string) => Promise<{ fields: string[]; basis: string } | null>,
  archive: (subjectId: string, fields: string[], basis: string) => Promise<void>,
): Promise<EraseResult[]> {
  const results: EraseResult[] = [];
  const hold = await legalHold(subjectId);
  if (hold) {
    await archive(subjectId, hold.fields, hold.basis); // 법 제21조③ 분리 저장
    results.push({ store: 'archive', ok: true, retainedReason: hold.basis });
  }
  for (const s of stores) {
    try { await s.erase(subjectId); results.push({ store: s.name, ok: true }); }
    catch { results.push({ store: s.name, ok: false }); } // 재시도 큐로
  }
  return results; // 결과 통지서에 보존 항목과 사유, 이의제기방법 포함
}
```

전체 예제는 [구현 예제](/tools/examples/)를 참고하세요.

## 개발 체크리스트

- [ ] 열람·정정·삭제·처리정지·동의 철회를 수집 채널과 같은 수준(웹이면 웹)으로 요청할 수 있다
- [ ] 요청마다 접수 시각과 10일 기한이 저장되고 기한 알림이 있다
- [ ] 본인 또는 정당한 대리인 확인 절차가 있고, 확인을 위해 과도한 정보를 요구하지 않는다
- [ ] 열람 응답이 항목·내용, 목적, 보유기간, 제3자 제공 현황, 동의 사실을 포함한다
- [ ] 열람 제한·연기·거절 시 사유와 이의제기방법을 10일 이내 통지한다
- [ ] 삭제가 운영 DB·인덱스·캐시·DW·수탁사·백업까지 이어지고, 보존 의무 항목은 분리 보관된다
- [ ] 처리정지 요청이 처리 플래그로 반영되고 정지된 정보의 파기 등 조치가 이어진다
- [ ] 내보내기 파일은 기계 판독 형식이며, 짧은 만료의 본인 전용 링크로 제공된다
- [ ] 다른 처리자로부터 제공받은 정보의 정정·삭제 요구를 제공 기관에 알리는 절차가 있다
- [ ] 우리 서비스가 시행령 제42조의2 정보전송자에 해당하는지, 해당 규정의 시행일이 언제인지 확인했다 (`review-required`)

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 법 제35조~제38조와 시행령 제41조~제47조, 시행령 부칙은 2026-10-23에 국가법령정보센터 Open API로 현행 원문을 확인했습니다. 전송 요구 매출·규모 기준의 정확한 시행일과 통지서 양식, 본인확인 수준에 대한 안내서 해석은 `review-required`입니다.
