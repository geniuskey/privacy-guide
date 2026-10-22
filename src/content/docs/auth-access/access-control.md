---
title: RBAC 접근권한 관리 — 최소 권한, 변경·말소, 3년 기록
description: 안전성 확보조치 기준 고시 제5조의 접근 권한 관리 의무를 RBAC 설계, 권한 변경 자동화, 권한 이력 보관으로 구현하는 방법을 정리합니다.
category: auth-access
status: review-required
lastVerified: 2026-10-23
tags: [접근권한, RBAC, 최소권한, 개인정보취급자, 감사로그]
related: [auth-access/authentication-session, auth-access/object-level-authorization, internal-admin/admin-vs-data-access, storage-retention/access-logs, app-security/minimal-response]
sources: [pipa, pipa-decree, safety-notice, pipc-safety-guide, owasp-asvs-5]
legalBasis:
  - source: pipa
    article: 제29조
    kind: law
    summary: 대통령령으로 정하는 바에 따라 안전성 확보에 필요한 기술적·관리적·물리적 조치
    status: verified
  - source: pipa
    article: 제28조제1항
    kind: law
    summary: 개인정보취급자의 범위를 최소한으로 제한하고 적절히 관리·감독
    status: verified
  - source: pipa-decree
    article: 제30조제1항제2호가목
    kind: decree
    summary: 개인정보처리시스템에 대한 접근 권한의 부여·변경·말소 등에 관한 기준의 수립·시행
    status: verified
  - source: safety-notice
    article: 제5조제1항~제3항
    kind: notice
    summary: 업무 수행에 필요한 최소한의 범위로 차등 부여, 인사이동·업무 변경 시 지체 없이 변경·말소, 부여·변경·말소 내역을 기록하고 최소 3년간 보관
    status: verified
  - source: safety-notice
    article: 제4조제1항제5호, 제4조제4항
    kind: notice
    summary: 내부 관리계획에 접근 권한 관리 사항을 포함하고, 개인정보 보호책임자가 접근 권한 관리 등 이행 실태를 연 1회 이상 점검
    status: verified
  - source: safety-notice
    article: 제6조의2제1항제1호
    kind: notice
    summary: 이용자 수 일일평균 100만명 이상인 처리자는 접근 권한을 설정할 수 있는 취급자의 컴퓨터 등에 인터넷망 차단 조치
    status: verified
  - source: pipc-safety-guide
    kind: guide
    summary: 차등 부여의 구체적 방법, 권한 검토 주기 등 해설(현행 고시 대응판 확인 필요)
    status: review-required
  - source: owasp-asvs-5
    article: V8 Authorization
    kind: standard
    summary: 서버 측 권한 검증, 최소 권한, 기본 거부(deny by default), 기능·데이터 단위 접근 제어
    status: verified
---

## 한 문장 결론

개인정보처리시스템의 권한은 **업무에 필요한 최소 범위로 차등 부여**하고, 인사이동·퇴사 시 **지체 없이 변경·말소**하며, 그 **부여·변경·말소 내역을 최소 3년간 보관**해야 합니다(고시 제5조제1항~제3항). RBAC는 이 의무를 구현하는 수단이고, 역할 이름보다 "역할마다 볼 수 있는 개인정보 범위"가 문서화되어 있는지가 핵심입니다.

## 적용 조건과 예외

| 질문 | 해당하면 |
| --- | --- |
| 개인정보를 조회·수정·다운로드할 수 있는 화면·API·DB가 있는가 | 개인정보처리시스템(고시 제2조제1호). 제5조 적용 |
| 직원, 파견·시간제 근로자, 외주 인력이 그 시스템을 쓰는가 | 개인정보취급자(법 제28조제1항). 범위 최소화와 관리·감독 대상 |
| 권한을 설정할 수 있는 관리자가 있는가 | 권한 설정자 자체도 최소화. 이용자 100만명 이상이면 해당 PC 인터넷망 차단(제6조의2제1항제1호) |
| 수탁사 인력이 접근하는가 | 수탁자 관리·감독(법 제26조제4항)과 연결 → [제공과 위탁](/data-sharing/provision-vs-outsourcing/) |

예외와 경계:

- **소규모 처리자**: 제4조제1항 단서는 1만명 미만 정보주체를 처리하는 소상공인·개인·단체에 대해 **내부 관리계획 수립**을 생략할 수 있게 합니다. 제5조의 접근 권한 관리 자체를 면제하는 조항은 아닙니다.
- **공공시스템**: 보호위원회가 지정한 공공시스템은 인사정보 연계(제16조제1항), 반기별 1회 이상 권한 내역 점검(제16조제4항) 등이 추가됩니다.
- **"지체 없이"**: 구체적 기한은 고시에 없습니다. 내부 관리계획에 SLA(예: 인사 발령 당일)를 정해 두는 것은 프로젝트 권장사항입니다.

## 실제 법적 근거

- 「개인정보 보호법」 제28조제1항: 개인정보취급자(임직원, 파견근로자, 시간제근로자 등 처리자의 지휘·감독을 받아 개인정보를 처리하는 자)의 범위를 최소한으로 제한하고 적절한 관리·감독을 해야 합니다.
- 같은 법 제29조: 대통령령으로 정하는 바에 따라 안전성 확보에 필요한 조치를 해야 합니다.
- 시행령 제30조제1항제2호가목: 개인정보처리시스템에 대한 접근 권한의 부여·변경·말소 등에 관한 기준의 수립·시행.
- 안전성 확보조치 기준 제5조
  - 제1항: 접근 권한을 업무 수행에 필요한 최소한의 범위로 **차등 부여**합니다.
  - 제2항: 개인정보취급자 또는 그 업무가 변경되면 **지체 없이** 접근 권한을 변경 또는 말소합니다.
  - 제3항: 제1항·제2항에 의한 권한 부여, 변경, 말소 내역을 기록하고 **최소 3년간** 보관합니다.
  - 제4항: 계정은 정당한 사유가 없는 한 취급자별로 발급하고 공유하지 않습니다.
- 같은 기준 제4조제1항제5호(내부 관리계획에 접근 권한 관리 사항 포함), 제4조제4항(개인정보 보호책임자가 접근 권한 관리 등 이행 실태를 연 1회 이상 점검·관리).

(고시 제2026-9호, 2026.7.1. 시행 기준. 2026-10-23 원문 대조.)

## 개발자용 실무 해설

1. **권한은 "기능 × 데이터 범위"로 정의합니다.** `cs_agent`라는 역할보다 "CS 상담원은 자기 배정 티켓의 회원 이름·연락처 마스킹본만 조회"처럼 데이터 범위까지 적어야 차등 부여를 설명할 수 있습니다.
2. **역할 폭발을 막으려면 RBAC + 속성 조건을 씁니다.** 역할은 거칠게, 소속 조직·담당 고객·지역 같은 범위는 속성(ABAC) 조건으로 붙입니다. 객체 단위 검증은 [객체 단위 소유권 검증](/auth-access/object-level-authorization/)을 참고하세요.
3. **변경·말소는 사람 손에 맡기지 않습니다.** HR 시스템의 퇴사·부서 이동 이벤트를 받아 역할을 자동 회수하고, 회수 결과를 이력에 남깁니다. 세션도 함께 끊어야 실제로 말소됩니다. → [인증·세션 보안](/auth-access/authentication-session/)
4. **권한 이력 ≠ 접속기록.** 제5조제3항(권한 부여·변경·말소 내역, 3년)과 제8조(접속기록, 1년 또는 2년)는 보관 대상과 기간이 다릅니다. 테이블과 보관 정책을 분리하세요. → [접속기록](/storage-retention/access-logs/)
5. **연 1회 이상 점검(제4조제4항)을 쉽게 만듭니다.** "사용자별 현재 권한 + 마지막 사용일" 리포트를 제공하면 장기 미사용 권한 회수 같은 점검이 가능합니다.

## 권장 설계

```text
roles (코드로 관리, PR 리뷰 대상)
├─ cs_agent:      ticket:read(assigned), member:read(masked)
├─ cs_lead:       ticket:read(team), member:read(masked), member:unmask(with_reason)
├─ billing_ops:   payment:read(masked), refund:write
└─ access_admin:  role:grant, role:revoke         ← 데이터 열람 권한 없음

role_grants (현재 상태)
role_grant_history (append-only, 보관 ≥ 3년)  ← 고시 제5조제3항
  ├─ subject_id, role, action: GRANT|REVOKE|MODIFY
  ├─ actor_id, reason, ticket_url
  └─ at (UTC), source: "manual" | "hr-sync"
```

- 역할-권한 매핑을 코드로 관리하고 이력을 append-only 테이블로 두는 방식은 고시가 정한 방법이 아니라 **프로젝트 권장사항**입니다. 고시가 요구하는 것은 차등 부여, 지체 없는 변경·말소, 내역 기록과 3년 보관이라는 결과입니다.
- 기본 거부(deny by default): 매핑에 없는 권한은 모두 거부합니다(ASVS V8).
- 권한 부여 요청은 신청자 ≠ 승인자 원칙을 적용합니다.
- 권한 관리자(access_admin)는 데이터 열람 권한을 갖지 않습니다. → [관리자 권한과 데이터 열람 권한 분리](/internal-admin/admin-vs-data-access/)
- 응답 필드도 역할에 따라 줄입니다. → [최소 필드 응답](/app-security/minimal-response/)

## 위험한 설계

- 프론트엔드에서 메뉴만 숨기고 API는 권한 검사 없이 열어 둠
- `is_admin` 불리언 하나로 모든 권한을 판단
- 신규 입사자에게 "선임과 같은 권한" 복제 부여
- 퇴사자 계정은 비활성화했지만 API 키·DB 계정·SaaS 계정은 남아 있음
- 권한 이력을 `UPDATE`로 덮어써서 과거 부여 내역이 남지 않음 (제5조제3항)
- 권한 이력 보관 기간을 접속기록 보관 기간(1년)에 맞춰 삭제

## Python/TypeScript 구현 예제

```python
# FastAPI: 역할-권한 매핑 + 기본 거부 + 권한 변경 이력(append-only)
from datetime import datetime, timezone
from fastapi import Depends, HTTPException

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "cs_agent": {"ticket:read", "member:read_masked"},
    "cs_lead": {"ticket:read", "member:read_masked", "member:unmask"},
    "access_admin": {"role:grant", "role:revoke"},
}

def require(permission: str):
    def checker(user=Depends(current_user)):
        granted = set().union(*(ROLE_PERMISSIONS.get(r, set()) for r in user.roles))
        if permission not in granted:          # 매핑에 없으면 거부
            raise HTTPException(403, "권한이 없습니다.")
        return user
    return checker

def change_role(db, *, subject_id: str, role: str, action: str, actor, reason: str):
    if actor.id == subject_id:
        raise HTTPException(403, "자기 자신의 권한은 변경할 수 없습니다.")
    if action == "GRANT":
        db.role_grants.insert(subject_id=subject_id, role=role)
    else:
        db.role_grants.delete(subject_id=subject_id, role=role)
    db.role_grant_history.insert(  # 고시 제5조제3항: 최소 3년 보관
        subject_id=subject_id, role=role, action=action,
        actor_id=actor.id, reason=reason, at=datetime.now(timezone.utc),
    )

def on_hr_event(db, event):
    """퇴사·부서 이동 시 지체 없이 회수 (고시 제5조제2항)"""
    if event.type in {"TERMINATED", "TRANSFERRED"}:
        for grant in db.role_grants.find(subject_id=event.employee_id):
            change_role(db, subject_id=event.employee_id, role=grant.role,
                        action="REVOKE", actor=SYSTEM_ACTOR, reason=f"hr:{event.type}")
        sessions.revoke_all(event.employee_id)
```

```ts
// 권한 매핑 테스트: 권한 관리자에게 데이터 열람 권한이 섞이지 않았는지 CI에서 검사
const ROLE_PERMISSIONS = {
  cs_agent: ['ticket:read', 'member:read_masked'],
  cs_lead: ['ticket:read', 'member:read_masked', 'member:unmask'],
  access_admin: ['role:grant', 'role:revoke'],
} as const satisfies Record<string, readonly string[]>;

const DATA_PERMS = /^(member|payment|employee):/;

for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
  const manages = perms.some((p) => p.startsWith('role:'));
  const reads = perms.some((p) => DATA_PERMS.test(p));
  if (manages && reads) throw new Error(`${role}: 권한 관리와 데이터 열람을 한 역할에 묶지 마세요`);
}
```

전체 실행 가능한 예제와 테스트는 [구현 예제](/tools/examples/)를 참고하세요.

## 개발 체크리스트

- [ ] 역할마다 접근 가능한 기능과 개인정보 항목·범위가 문서(또는 코드)로 정의되어 있다
- [ ] API는 서버에서 권한을 검사하고, 매핑에 없는 권한은 기본 거부한다
- [ ] 퇴사·부서 이동 이벤트가 권한 회수와 세션 종료로 자동 연결된다
- [ ] 권한 부여·변경·말소 이력이 append-only로 남고 최소 3년 보관된다
- [ ] 이력에 대상자, 역할, 행위, 수행자, 사유, 시각이 있다
- [ ] 계정이 사람별로 발급되고 공유 계정은 사유와 함께 관리된다
- [ ] 연 1회 이상 권한 점검에 쓸 리포트(사용자별 권한, 마지막 사용일)가 있다
- [ ] 권한 관리자 역할과 데이터 열람 역할이 분리되어 있다
- [ ] "지체 없이"의 내부 기준(SLA)이 내부 관리계획에 정해져 있다 (`review-required`)

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 법률·시행령·고시 조문은 2026-10-23 국가법령정보센터 원문과 대조했습니다. 안내서의 해설과 권한 검토 주기 예시는 원문 대조 전이라 `review-required`입니다.
