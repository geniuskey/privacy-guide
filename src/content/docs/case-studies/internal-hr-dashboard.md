---
title: 사례 — 사내 직원 성과·근태 대시보드
description: 직원의 근태·업무 성과 데이터를 모아 관리자에게 보여주는 사내 대시보드를 만들 때 처리 근거, 권한 분리, 개인별 활동 분석 위험, 집계·소규모 셀 억제, 접속기록, 근로관계 법령 확인 포인트를 정리합니다.
category: case-studies
status: review-required
lastVerified: 2026-10-23
tags: [직원정보, 접근권한, 접속기록, 활동모니터링, 처리근거, 최소화]
related: [internal-admin/employee-data, internal-admin/admin-vs-data-access, internal-admin/activity-monitoring, auth-access/access-control, storage-retention/access-logs, app-security/minimal-response, ai-llm/automated-decisions]
sources: [pipa, pipa-decree, safety-notice, pipc-hr-guide, pipc-safety-guide, labor-standards-act, worker-participation-act, comm-secrets-act, owasp-asvs-5]
legalBasis:
  - source: pipa
    article: 제15조제1항
    kind: law
    summary: 직원 개인정보도 7가지 근거 중 하나가 필요하다. 근로계약 이행(제4호), 법령상 의무(제2호), 정당한 이익(제6호)이 주로 검토된다
    status: verified
  - source: pipa
    article: 제3조제1항·제6항
    kind: law
    summary: 목적에 필요한 최소한만 처리하고 정보주체의 사생활 침해를 최소화하는 방법으로 처리해야 한다
    status: verified
  - source: pipa
    article: 제23조제1항
    kind: law
    summary: 건강, 노동조합 가입·탈퇴 등 민감정보는 별도 동의 또는 법령상 근거가 있어야 처리할 수 있다
    status: verified
  - source: pipa
    article: 제28조제1항
    kind: law
    summary: 개인정보취급자의 범위를 최소한으로 제한하고 적절히 관리·감독해야 한다
    status: verified
  - source: safety-notice
    article: 제5조제1항~제4항
    kind: notice
    summary: 접근 권한은 업무 수행에 필요한 최소 범위로 차등 부여하고, 업무 변경 시 지체 없이 변경·말소하며, 부여·변경·말소 내역을 최소 3년 보관하고, 계정을 공유하지 않는다
    status: verified
  - source: safety-notice
    article: 제8조
    kind: notice
    summary: 접속기록을 1년 이상(5만명 이상 또는 민감정보·고유식별정보 처리 시스템은 2년 이상) 보관하고, 접속기록·다운로드 점검 주기·방법을 내부 관리계획으로 정해 이행하며, 위·변조 방지 조치를 해야 한다
    status: verified
  - source: safety-notice
    article: 제6조제4항, 제12조제1항
    kind: notice
    summary: 일정 시간 미사용 시 자동 접속 차단, 출력(화면표시·파일생성 포함) 시 용도를 특정하고 출력 항목을 최소화
    status: verified
  - source: pipa-decree
    article: 제15조의3제2항제2호
    kind: decree
    summary: 업무수행을 위해 소속 임직원의 개인정보를 처리한 경우 그 임직원은 이용·제공 내역 통지 대상에서 제외된다
    status: verified
  - source: pipc-hr-guide
    kind: guide
    summary: 인사·노무 분야 개인정보 처리 근거, 근태·모니터링 정보 처리 시 고려사항에 관한 권고. 세부 내용 원문 대조 필요
    status: review-required
  - source: worker-participation-act
    kind: law
    summary: 근로자 감시 설비 설치 등이 노사협의회 협의 사항에 해당하는지 확인 필요. 조문 미확인
    status: review-required
  - source: labor-standards-act
    kind: law
    summary: 근로시간 기록·취업규칙 등 근로관계 법령상 쟁점. 조문 미확인
    status: review-required
  - source: comm-secrets-act
    kind: law
    summary: 메신저·이메일 내용 등 통신 내용을 분석하는 경우의 별도 쟁점. 조문 미확인
    status: review-required
  - source: owasp-asvs-5
    article: V8 Authorization
    kind: standard
    summary: 기능·데이터 단위 접근제어 검증 요구사항(장 단위 인용)
    status: verified
---

## 한 문장 결론

직원 대시보드는 **"누가 누구의 어떤 수치를 볼 수 있는가"**가 핵심이므로, 처리 근거를 지표별로 정하고, **관리 권한과 열람 권한을 분리**하며, 개인 단위 화면은 꼭 필요한 역할에만 열고 나머지는 **집계와 소규모 셀 억제**로 제공해야 합니다.

## 적용 조건과 예외

**가정한 시스템**: 근태(출퇴근 시각, 휴가), 업무 지표(처리 티켓 수, 목표 달성률), 협업 도구 활동량(접속 시간 등)을 모아 팀장·HR·경영진에게 보여주는 사내 웹 대시보드. 직원 수 약 2,000명.

| 지표 | 개인정보 여부 | 근거 검토 방향 | 위험도 |
| --- | --- | --- | --- |
| 출퇴근 시각, 휴가 사용 | 개인정보 | 근로계약 이행(4호), 근로시간 관련 법령상 의무(2호) 검토 `review-required` | 중 |
| 휴가 사유(병가 진단 내용) | 건강 관련이면 **민감정보** | 제23조 별도 동의 또는 법령 근거 | 높음 |
| 처리 티켓 수·목표 달성률 | 개인정보 | 근로계약 이행·인사평가 목적 검토 | 중 |
| 협업 도구 접속 시간·키보드 활동 | 개인정보, **개인별 활동 분석** | 정당한 이익(6호) 등 엄격 검토, 근로관계 법령 확인 | 높음 |
| 메신저·메일 **내용** 분석 | 개인정보 + 통신 내용 | 통신비밀보호법 등 별도 쟁점 `review-required` | 매우 높음 |
| 팀 단위 평균(10명 이상 팀) | 집계 방식에 따라 개인 식별 가능성 낮음 | 셀 크기 기준 충족 시 위험 감소 | 낮음 |

예외와 경계:

- **직원 데이터라서 근거가 필요 없는 것이 아닙니다.** 근로계약과 관련된 처리라도 "필요한 경우"에 한정되며(제15조제1항제4호), 계약 이행에 필요한지 설명하기 어려운 활동 분석은 다른 근거를 검토해야 합니다.
- **근로자 동의(1호)는 자유로운 의사인지 문제가 될 수 있습니다.** 시행령 제17조제1항제1호는 "자유로운 의사에 따라 동의 여부를 결정할 수 있을 것"을 요구합니다. 고용관계에서 동의를 주된 근거로 삼을지는 법무 검토가 필요합니다(`review-required`).
- **근로관계 법령**: 근로자를 감시하는 설비 설치 등이 노사협의회 협의 사항인지, 취업규칙 변경 절차가 필요한지 등은 근로자참여법·근로기준법 원문과 인사·노무 가이드라인으로 확인해야 합니다(`review-required`). → [직원 정보](/internal-admin/employee-data/)
- **자동 평가·자동 징계**로 이어지면 제37조의2 자동화된 결정 쟁점이 생깁니다. → [자동화된 결정](/ai-llm/automated-decisions/)
- 시행령 제15조의3제2항제2호에 따라 업무수행 목적의 임직원 개인정보 처리는 이용·제공 내역 **통지** 대상에서 제외되지만, 처리 근거·최소화·안전조치 의무가 면제되는 것은 아닙니다.

## 실제 법적 근거

- 「개인정보 보호법」 제15조제1항: 직원 정보도 7가지 근거 중 하나가 필요합니다. 제6호(정당한 이익)는 "명백하게 정보주체의 권리보다 우선하는 경우"로서 "상당한 관련이 있고 합리적인 범위를 초과하지 아니하는 경우에 한"합니다.
- 제3조제1항·제6항: 최소 수집, 사생활 침해 최소화 방법으로 처리.
- 제23조제1항: 건강, 노동조합 가입·탈퇴 등 민감정보는 별도 동의 또는 법령상 근거가 필요하고, 제2항에 따라 안전성 확보 조치를 해야 합니다. → [민감정보 구분](/sensitive-data/sensitive-vs-personal/)
- 제28조제1항: 개인정보취급자(대시보드를 열람하는 관리자 포함)의 범위를 최소한으로 제한하고 관리·감독해야 합니다. 제2항: 정기 교육.
- 「개인정보의 안전성 확보조치 기준」
  - 제5조제1항~제4항: 최소 범위 차등 권한, 인사 변경 시 지체 없는 변경·말소, 권한 변경 내역 **최소 3년** 보관, 계정 공유 금지.
  - 제6조제4항: 일정 시간 업무처리가 없으면 자동 접속 차단 등.
  - 제8조: 접속기록 **1년 이상** 보관(정보주체 5만명 이상 또는 민감정보·고유식별정보 처리 시스템은 2년 이상), 접속기록·다운로드 점검 주기·방법·사후조치를 내부 관리계획에 정하고 이행, 위·변조 방지.
  - 제12조제1항: 화면표시·파일생성 등 출력 시 용도를 특정하고 출력 항목을 최소화.
- 시행령 제15조의3제2항제2호: 업무수행을 위한 소속 임직원 개인정보 처리는 이용·제공 내역 통지 대상에서 제외.

(현행 법률 제21445호, 시행령 제36671호, 고시 제2026-9호 기준. 조문은 국가법령정보센터 원문과 대조함. 근로관계 법령과 인사·노무 가이드라인은 `review-required`.)

## 개발자용 실무 해설

1. **지표 카탈로그를 만들고 지표마다 근거·목적·열람 역할을 붙입니다.** "있으면 좋은 지표"를 먼저 수집하고 나중에 근거를 찾는 순서가 가장 위험합니다. 근거 판단(특히 6호)과 노사 협의 필요 여부를 카탈로그에 링크합니다.
2. **권한은 세 축으로 나눕니다.** (a) 시스템 관리 권한(설정, 사용자 관리) (b) 데이터 열람 범위(자기 자신 / 소속 팀 / 전사 집계) (c) 내보내기 권한. 시스템 관리자가 자동으로 모든 개인 데이터를 보는 구조는 피하세요. → [관리자 권한과 데이터 열람 권한](/internal-admin/admin-vs-data-access/)
3. **열람 범위는 조직도에서 계산합니다.** 팀장은 "현재 직속 팀원"만, HR은 담당 조직만 보게 하고, 조직 이동 시 자동으로 범위가 바뀌게 합니다. 수동 권한 부여는 만료일을 필수로 둡니다(고시 제5조제2항).
4. **기본 화면은 집계입니다.** 셀 크기가 작은 그룹(예: 5명 미만 팀, 특정 직급×성별 교차)은 평균만으로도 개인이 드러납니다. 최소 셀 크기 미만은 "표시 안 함"으로 억제하고, 차분 공격(필터를 바꿔 한 명을 빼고 비교)을 막기 위해 보완 억제도 고려합니다. 기준값은 프로젝트 권장사항이며 법정 기준이 아닙니다.
5. **개인 상세 화면은 목적이 있는 조회로 만듭니다.** 개인 상세를 열 때 조회 사유를 선택하게 하고, 접속기록에 처리한 정보주체와 수행 업무를 남깁니다(고시 제2조제3호의 접속기록 항목). 접속기록 점검 주기를 내부 관리계획에 정합니다. → [접속기록](/storage-retention/access-logs/)
6. **내보내기는 최소 항목으로 제한합니다.** CSV 다운로드는 별도 권한, 항목 최소화, 다운로드 사유 기록, 대량 다운로드 알림을 둡니다(고시 제12조, 제8조제2항).
7. **활동 데이터는 원시 로그를 오래 두지 않습니다.** 협업 도구 이벤트는 집계 후 원시 데이터를 짧게 보존하고, 개인 단위 시계열을 만들지 않는 방향을 우선 검토합니다. → [활동 모니터링](/internal-admin/activity-monitoring/)

## 권장 설계

```text
역할           시스템설정  열람범위                     개인상세  내보내기
SYS_ADMIN       O          없음(메타데이터만)            X         X
TEAM_LEAD       X          직속 팀원(조직도 계산)        O(사유)   X
HR_PARTNER      X          담당 조직                     O(사유)   O(항목제한, 사유)
EXECUTIVE       X          전사 집계(셀 억제 적용)       X         X
EMPLOYEE        X          본인                           O(본인)   O(본인)

MetricCatalog
├─ "attendance.clock_in"  basis: 제15조①4호/②호 검토, viewers: [self, TEAM_LEAD, HR_PARTNER]
├─ "leave.reason"         민감정보 가능 → 대시보드 비노출, HR 시스템에서만 처리
└─ "collab.active_minutes" basis: review-required, 개인 단위 비노출, 팀 집계만(k≥5)
```

## 위험한 설계

- 전 직원의 분 단위 접속 시간·키 입력량 순위표
- 시스템 관리자 계정 하나로 설정과 전사 개인 데이터 열람을 모두 처리
- 조직 이동 후에도 예전 팀원 데이터를 계속 볼 수 있는 수동 권한
- 3명짜리 팀의 "평균 병가 일수" 표시
- 병가 사유(진단명)를 근태 대시보드에 그대로 노출
- 개인 상세 조회에 접속기록이 없거나, 처리한 정보주체가 기록되지 않음
- 대시보드 점수가 그대로 성과 등급이나 징계 대상 선정으로 자동 연결

## Python/TypeScript 구현 예제

```python
# 열람 범위 계산 + 소규모 셀 억제 (FastAPI 의존성에서 사용)
from dataclasses import dataclass
from statistics import mean

MIN_CELL_SIZE = 5  # 프로젝트 권장값. 법정 기준 아님

@dataclass(frozen=True)
class Viewer:
    employee_id: str
    role: str  # SYS_ADMIN | TEAM_LEAD | HR_PARTNER | EXECUTIVE | EMPLOYEE

def visible_employee_ids(viewer: Viewer, org) -> set[str]:
    if viewer.role == "EMPLOYEE":
        return {viewer.employee_id}
    if viewer.role == "TEAM_LEAD":
        return set(org.direct_reports(viewer.employee_id))
    if viewer.role == "HR_PARTNER":
        return set(org.employees_in_scope(viewer.employee_id))
    return set()  # SYS_ADMIN, EXECUTIVE는 개인 단위 접근 없음

def aggregate_with_suppression(groups: dict[str, list[float]]) -> dict[str, float | None]:
    """셀 크기가 기준 미만이면 None(표시 안 함)."""
    return {g: (round(mean(v), 1) if len(v) >= MIN_CELL_SIZE else None) for g, v in groups.items()}
```

```ts
// 개인 상세 조회: 범위 검사 → 사유 필수 → 접속기록(처리한 정보주체, 수행업무) 기록
type AccessLog = {
  actorId: string; at: string; ip: string;
  subjectId: string;           // 처리한 정보주체
  action: 'VIEW_DETAIL' | 'EXPORT';
  reason: 'EVALUATION' | 'ATTENDANCE_CORRECTION' | 'GRIEVANCE';
};

export async function viewEmployeeDetail(
  actor: { id: string; ip: string },
  subjectId: string,
  reason: AccessLog['reason'] | undefined,
  deps: { visibleIds: (actorId: string) => Promise<Set<string>>; log: (l: AccessLog) => Promise<void>; load: (id: string) => Promise<object> },
) {
  const visible = await deps.visibleIds(actor.id);
  if (!visible.has(subjectId)) throw new Error('403: 열람 범위 밖');
  if (!reason) throw new Error('400: 조회 사유 필요');
  await deps.log({ actorId: actor.id, at: new Date().toISOString(), ip: actor.ip, subjectId, action: 'VIEW_DETAIL', reason });
  return deps.load(subjectId); // 최소 필드만 반환하는 뷰
}
```

전체 실행 가능한 예제(RBAC, 관리자 권한과 데이터 열람 권한 분리, 감사로그)와 테스트는 [구현 예제](/tools/examples/)를 참고하세요.

## 개발 체크리스트

- [ ] 대시보드의 모든 지표에 처리 근거, 목적, 열람 역할이 지정된 카탈로그가 있다
- [ ] 정당한 이익(6호)이나 동의를 근거로 하는 지표는 판단 문서와 법무 검토가 있다 (`review-required`)
- [ ] 개인별 활동 분석 지표는 근로자참여법·근로기준법·인사·노무 가이드라인 확인과 노사 협의 필요 여부 검토를 거쳤다 (`review-required`)
- [ ] 건강·노조 등 민감정보는 대시보드에 노출되지 않는다
- [ ] 시스템 관리 권한과 개인 데이터 열람 권한이 분리되어 있다
- [ ] 열람 범위가 조직도에서 자동 계산되고, 수동 권한에는 만료일이 있다
- [ ] 권한 부여·변경·말소 내역이 3년 이상 보관된다 (고시 제5조제3항)
- [ ] 집계 화면에 최소 셀 크기 억제가 적용된다
- [ ] 개인 상세 조회·내보내기에 사유 입력과 접속기록(처리한 정보주체 포함)이 남는다
- [ ] 접속기록 보관 기간(1년 또는 2년 이상)과 점검 주기가 내부 관리계획에 정해져 있다
- [ ] 일정 시간 미사용 시 세션이 자동 종료된다
- [ ] 대시보드 결과가 사람 검토 없이 평가·징계로 연결되지 않는다

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 개인정보 보호법·시행령·안전성 확보조치 기준 조문은 2026-10-23에 국가법령정보센터 Open API로 받은 현행 원문과 대조했습니다. 인사·노무 가이드라인, 안전성 확보조치 기준 안내서, 근로기준법·근로자참여법·통신비밀보호법 쟁점은 원문 대조 전이라 `review-required`입니다.
