---
title: 시스템 관리자 권한과 개인정보 열람 권한 분리
description: 슈퍼관리자 하나에 모든 권한을 몰지 않고, 시스템 운영 권한과 개인정보 열람 권한을 나누며, 긴급 접근(break-glass)과 승인 워크플로를 접속기록과 함께 설계하는 방법입니다.
category: internal-admin
status: review-required
lastVerified: 2026-10-23
tags: [관리자, 접근권한, 개인정보취급자, 접속기록, 직무분리]
related: [auth-access/access-control, auth-access/authentication-session, storage-retention/access-logs, internal-admin/employee-data, case-studies/internal-hr-dashboard]
sources: [pipa, pipa-decree, safety-notice, pipc-safety-guide, owasp-asvs-5]
legalBasis:
  - source: pipa
    article: 제28조제1항
    kind: law
    summary: 처리자의 지휘·감독을 받아 개인정보를 처리하는 자(개인정보취급자)의 범위를 최소한으로 제한하고 적절히 관리·감독
    status: verified
  - source: pipa
    article: 제31조제4항제6호
    kind: law
    summary: 개인정보 보호책임자의 업무로 개인정보 유출 및 오용·남용 방지를 위한 내부통제시스템의 구축
    status: verified
  - source: safety-notice
    article: 제5조제1항~제4항
    kind: notice
    summary: 최소 범위 차등 부여, 업무 변경 시 지체 없는 변경·말소, 권한 내역 3년 보관, 취급자별 계정 발급
    status: verified
  - source: safety-notice
    article: 제8조
    kind: notice
    summary: 접속기록 1년 이상(5만명 이상·고유식별정보·민감정보 처리 시스템 등은 2년 이상) 보관, 접속기록·다운로드 상황 점검 주기·방법·사후조치를 내부 관리계획으로 정하고 이행, 위·변조 방지
    status: verified
  - source: safety-notice
    article: 제2조제3호
    kind: notice
    summary: 접속기록은 식별자, 접속일시, 접속지 정보, 처리한 정보주체 정보, 수행업무 등을 전자적으로 기록한 것
    status: verified
  - source: safety-notice
    article: 제6조의2제1항
    kind: notice
    summary: 이용자 수 일일평균 100만명 이상인 처리자는 접근 권한 설정 가능자, 다운로드·파기 가능자의 컴퓨터 등에 인터넷망 차단
    status: verified
  - source: pipc-safety-guide
    kind: guide
    summary: 관리자 권한 관리와 접속기록 점검 방법에 대한 해설(현행판 원문 대조 필요)
    status: review-required
  - source: owasp-asvs-5
    article: V8 Authorization
    kind: standard
    summary: 최소 권한, 관리 기능 접근 제한
    status: verified
  - source: owasp-asvs-5
    article: V16 Security Logging and Error Handling
    kind: standard
    summary: 보안 관련 이벤트(관리 작업, 권한 상승)의 기록과 보호
    status: verified
---

## 한 문장 결론

서버·DB·배포를 운영하는 **시스템 관리자 권한**과 고객·직원 정보를 **열람하는 권한**은 서로 다른 권한으로 나누고, 개인정보를 볼 수 있는 사람은 개인정보취급자로서 **최소 인원, 개인 계정, 접속기록** 대상으로 관리해야 합니다(법 제28조제1항, 고시 제5조·제8조). "모든 것을 할 수 있는 슈퍼관리자"는 법령이 직접 금지하는 용어는 아니지만, 최소 범위 차등 부여 의무와 충돌하기 쉬운 설계입니다.

## 적용 조건과 예외

| 역할 | 하는 일 | 개인정보 열람 | 관리 포인트 |
| --- | --- | --- | --- |
| 플랫폼/인프라 관리자 | 서버, 네트워크, 배포 | 원칙적으로 불필요 | DB 직접 접근 경로도 개인정보처리시스템 접속으로 보고 통제 |
| 권한 관리자 | 계정 발급, 역할 부여 | 불필요 | 제5조제3항 이력, 제6조의2제1항제1호(해당 시) |
| 업무 담당자 (CS, 정산, 인사) | 고객·직원 업무 처리 | 업무 범위만 | 개인정보취급자. 제28조 관리·감독, 제8조 접속기록 |
| DBA / 데이터 엔지니어 | 스키마, 마이그레이션, 배치 | 필요 시 제한적 | 운영 DB 쿼리는 승인·기록. 가능하면 가명 사본 사용 |
| 감사·보안 담당 | 접속기록 점검 | 접속기록 열람 | 접속기록 자체도 개인정보를 포함하므로 접근 제한 |

경계:

- **개인정보취급자 정의**는 법 제2조가 아니라 **제28조제1항**에 있습니다. 임직원, 파견근로자, 시간제근로자 등 처리자의 지휘·감독을 받아 개인정보를 처리하는 자입니다. 외주 개발자가 운영 DB에 접근한다면 위탁 관계인지 함께 확인하세요. → [제공과 위탁](/data-sharing/provision-vs-outsourcing/)
- **break-glass(긴급 접근)** 는 고시에 규정된 절차가 아닙니다. 장애 대응을 위해 두는 프로젝트 권장 패턴이며, 그 경우에도 개인 계정·접속기록·사후 검토라는 고시의 요구는 그대로 적용됩니다.
- **공공시스템**은 제16조(인사정보 연계, 반기별 점검)와 제17조(접속기록 자동 분석, 소명)가 추가로 적용됩니다.

## 실제 법적 근거

- 「개인정보 보호법」 제28조제1항: 개인정보처리자는 개인정보취급자의 범위를 최소한으로 제한하고 적절한 관리·감독을 해야 합니다. 같은 조 제2항: 정기적으로 필요한 교육을 실시합니다.
- 같은 법 제31조제4항제6호: 개인정보 보호책임자는 "개인정보 유출 및 오용·남용 방지를 위한 내부통제시스템의 구축" 업무를 수행합니다.
- 안전성 확보조치 기준 제5조: 최소한의 범위로 차등 부여(제1항), 지체 없이 변경·말소(제2항), 내역 기록·최소 3년 보관(제3항), 취급자별 계정 발급·공유 금지(제4항).
- 같은 기준 제8조
  - 제1항: 개인정보처리시스템에 접속한 자(정보주체 제외)의 접속기록을 1년 이상 보관·관리. 5만명 이상의 정보주체, 고유식별정보·민감정보를 처리하는 시스템 등은 2년 이상.
  - 제2항: 개인정보의 오·남용, 유출 등에 대응하기 위해 취급자의 접속기록 및 개인정보 다운로드 상황을 확인·점검하는 주기·방법·사후조치절차 등을 내부 관리계획으로 정하고 이행.
  - 제3항: 접속기록이 위·변조, 도난, 분실되지 않도록 안전하게 보관.
- 같은 기준 제2조제3호: 접속기록에는 식별자, 접속일시, 접속지 정보, 처리한 정보주체 정보, 수행업무 등이 포함됩니다.
- 같은 기준 제6조의2제1항: 이용자 수가 일일평균 100만명 이상인 처리자는 접근 권한을 설정할 수 있는 취급자(제1호)와 다운로드·파기할 수 있는 취급자(제2호)의 컴퓨터 등에 인터넷망 차단 조치를 합니다.

(고시 제2026-9호 기준, 2026-10-23 원문 대조.)

## 개발자용 실무 해설

1. **관리 콘솔의 권한을 세 축으로 나눕니다.** ① 시스템 운영(설정, 배포, 기능 플래그) ② 권한 관리(계정, 역할) ③ 데이터 열람(고객·직원 상세). 한 사람이 여러 축을 가질 수는 있어도, 한 역할이 세 축을 모두 묶지 않게 합니다.
2. **열람은 "기본 마스킹 + 사유 있는 해제"로 만듭니다.** 목록·검색은 마스킹된 값만 보여 주고, 전체 값을 보려면 사유를 입력하게 합니다. 사유와 대상 정보주체가 접속기록의 "처리한 정보주체 정보", "수행업무"가 됩니다.
3. **DB 직접 접근이 가장 큰 구멍입니다.** 웹 콘솔만 통제하고 운영 DB 계정을 개발팀이 공유하면 고시 제5조제4항과 제8조를 모두 놓칩니다. DB 접근 게이트웨이(개인 계정, 쿼리 기록, 승인)를 두거나 운영 DB 조회를 승인 워크플로로 묶습니다.
4. **break-glass는 "쉽게 쓰면 티가 나게" 만듭니다.** 긴급 역할은 시간 제한(예: 1시간)으로 부여하고, 사용 즉시 보안 담당에게 알림이 가며, 사후 검토 기록이 남게 합니다.
5. **관리자의 행동도 점검 대상입니다.** 제8조제2항의 점검에서 대량 조회, 업무시간 외 열람, 퇴사 예정자의 다운로드 같은 패턴을 우선 봅니다. 점검 결과에 따른 사후조치 절차가 내부 관리계획에 있어야 합니다.

## 권장 설계

```text
Admin roles (권장)
├─ platform_operator   : config:*, deploy:*            (데이터 열람 없음)
├─ access_admin        : role:grant, role:revoke       (데이터 열람 없음)
├─ cs_agent            : member:read_masked(assigned)
├─ cs_lead             : member:read_masked, member:unmask(reason)
├─ auditor             : access_log:read               (데이터 원문 열람 없음)
└─ break_glass (임시)  : member:read_any, TTL 60m, 승인 1인 + 사후 검토

Unmask flow
  요청(사유, 대상) → 정책 검사 → [고위험이면 승인자 승인] → 열람(시간 제한)
        └──────────── access_log: actor, subject_id, fields, reason, at, ip ────┘
```

- 운영 콘솔은 IP 제한과 MFA를 적용합니다. → [인증·세션 보안](/auth-access/authentication-session/)
- 접속기록은 애플리케이션 DB와 분리된 append-only 저장소에 두고, 관리자도 삭제할 수 없게 합니다(제8조제3항). → [접속기록](/storage-retention/access-logs/)
- 승인자는 요청자와 다른 사람이어야 하며, 자기 자신의 승인은 막습니다.

## 위험한 설계

- `role = 'superadmin'` 하나로 설정 변경, 권한 부여, 전체 회원 상세 조회, 엑셀 다운로드가 모두 가능
- 운영 DB `root` 계정 비밀번호를 팀 위키에 공유
- 장애 대응용 계정이 상시 활성화되어 있고 사용 알림이 없음
- 접속기록을 같은 DB의 일반 테이블에 저장해 관리자가 `DELETE` 가능
- 접속기록에 "누가 로그인했는가"만 있고 "어떤 정보주체의 무엇을 봤는가"가 없음 (제2조제3호)
- 마스킹 해제 사유를 자유 입력으로 받고 빈 값도 허용

## Python/TypeScript 구현 예제

```python
# FastAPI: 마스킹 해제는 사유 필수 + 접속기록 + 권한 분리
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()

class UnmaskRequest(BaseModel):
    reason_code: str = Field(pattern=r"^(CS_TICKET|REFUND|LEGAL_REQUEST)$")
    ticket_id: str

@router.post("/admin/members/{member_id}/unmask")
def unmask(member_id: str, body: UnmaskRequest, actor=Depends(require("member:unmask"))):
    if not tickets.is_linked(body.ticket_id, member_id):
        raise HTTPException(403, "티켓과 연결된 회원만 열람할 수 있습니다.")
    member = members.get(member_id)
    access_log.append(  # 고시 제2조제3호 항목 + 사유
        actor_id=actor.id, subject_id=member_id, action="UNMASK",
        fields=["phone", "address"], reason=f"{body.reason_code}:{body.ticket_id}",
        ip=actor.ip, at=datetime.now(timezone.utc),
    )
    return {"phone": member.phone, "address": member.address}
```

```ts
// break-glass: 시간 제한 + 승인자 분리 + 즉시 알림
type BreakGlassGrant = { userId: string; approvedBy: string; reason: string; expiresAt: number };

export function grantBreakGlass(userId: string, approver: string, reason: string, now = Date.now()): BreakGlassGrant {
  if (userId === approver) throw new Error('본인 승인은 허용되지 않습니다');
  if (reason.trim().length < 10) throw new Error('구체적인 사유가 필요합니다');
  const grant = { userId, approvedBy: approver, reason, expiresAt: now + 60 * 60_000 };
  notifySecurity(`break-glass 부여: ${userId} (승인 ${approver})`); // 사후 검토 큐에도 등록
  return grant;
}

export const isActive = (g: BreakGlassGrant, now = Date.now()) => now < g.expiresAt;
```

전체 실행 가능한 예제와 테스트는 [구현 예제](/tools/examples/)를 참고하세요.

## 개발 체크리스트

- [ ] 시스템 운영, 권한 관리, 데이터 열람 권한이 서로 다른 역할로 분리되어 있다
- [ ] 개인정보를 열람할 수 있는 사람(개인정보취급자) 목록이 있고 최소 인원으로 유지된다
- [ ] 운영 DB 직접 접근은 개인 계정으로만 가능하고 쿼리가 기록된다
- [ ] 마스킹 해제·상세 열람에 사유가 필수이고 접속기록에 대상 정보주체와 수행업무가 남는다
- [ ] 접속기록은 1년(해당 시 2년) 이상 보관되고 관리자도 수정·삭제할 수 없다
- [ ] 접속기록·다운로드 점검 주기와 사후조치가 내부 관리계획에 정해져 있다
- [ ] break-glass 권한은 시간 제한, 승인자 분리, 즉시 알림, 사후 검토를 거친다
- [ ] 이용자 100만명 이상 여부를 확인했고, 해당 시 권한 설정자·다운로드 가능자 PC의 인터넷망 차단을 검토했다

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 법률·고시 조문은 2026-10-23 원문과 대조했습니다. break-glass와 승인 워크플로는 프로젝트 권장사항이며, 안내서의 점검 방법 해설은 `review-required`입니다.
