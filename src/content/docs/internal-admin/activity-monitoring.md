---
title: 직원 활동 분석·모니터링 — 개인별 추적보다 집계 먼저
description: 로그 분석, 생산성 추적, 화면 기록 같은 직원 모니터링 기능을 만들 때 확인할 개인정보 보호법 원칙과 근거, 통신비밀보호법·근로자참여법 연결점, 집계·익명화 우선 설계를 정리합니다.
category: internal-admin
status: review-required
lastVerified: 2026-10-23
tags: [직원정보, 모니터링, 정당한이익, 최소수집, 접속기록, 익명처리]
related: [internal-admin/employee-data, internal-admin/admin-vs-data-access, storage-retention/access-logs, collection-consent/lawful-basis, sensitive-data/pseudonymization, case-studies/internal-hr-dashboard]
sources: [pipa, safety-notice, pipc-hr-guide, comm-secrets-act, worker-participation-act]
legalBasis:
  - source: pipa
    article: 제3조제1항, 제6항, 제7항
    kind: law
    summary: 목적에 필요한 최소한의 수집, 사생활 침해를 최소화하는 방법으로 처리, 익명·가명으로 목적을 달성할 수 있으면 익명(불가하면 가명) 처리
    status: verified
  - source: pipa
    article: 제15조제1항제6호
    kind: law
    summary: 정당한 이익이 명백하게 정보주체의 권리보다 우선하고, 정당한 이익과 상당한 관련이 있으며 합리적 범위를 초과하지 않는 경우에 한함
    status: verified
  - source: pipa
    article: 제18조제1항
    kind: law
    summary: 제15조제1항에 따른 범위를 초과한 이용 금지 (보안 목적으로 수집한 로그를 인사 평가에 쓰는 경우 목적 외 이용인지 검토 필요)
    status: verified
  - source: pipa
    article: 제22조제3항
    kind: law
    summary: 동의 없이 처리하는 개인정보의 항목과 법적 근거를 구분하여 공개하거나 알려야 하며 입증책임은 처리자에게 있다
    status: verified
  - source: safety-notice
    article: 제8조제2항
    kind: notice
    summary: 개인정보취급자의 접속기록과 개인정보 다운로드 상황을 점검하는 주기·방법·사후조치절차를 내부 관리계획으로 정하고 이행 (법령상 요구되는 점검)
    status: verified
  - source: comm-secrets-act
    article: 제3조제1항
    kind: law
    summary: 누구든지 법률에 따르지 않고는 전기통신의 감청을 하거나 공개되지 아니한 타인간의 대화를 녹음 또는 청취하지 못한다
    status: verified
  - source: comm-secrets-act
    article: 제2조제3호, 제7호
    kind: law
    summary: 전기통신(전화·전자우편 등)과 감청(당사자 동의 없이 전자장치 등으로 내용을 지득·채록하거나 송수신을 방해)의 정의. 저장된 이메일·메신저 열람이 감청에 해당하는지는 해석 문제로 review-required
    status: verified
  - source: worker-participation-act
    article: 제20조제1항제14호
    kind: law
    summary: 사업장 내 근로자 감시 설비의 설치는 노사협의회 협의 사항
    status: verified
  - source: pipc-hr-guide
    kind: guide
    summary: 근로자 감시·모니터링에 대한 행정기관 해석(세부 내용 원문 대조 필요)
    status: review-required
---

## 한 문장 결론

직원 개인별 활동을 추적하는 기능은 **정당한 이익(제15조제1항제6호)의 엄격한 요건**과 **최소 처리·사생활 침해 최소화·익명 우선 원칙(제3조)** 을 통과해야 하므로, 먼저 **팀·조직 단위 집계나 익명 통계로 목적을 달성할 수 있는지** 검토하고, 개인 식별이 꼭 필요한 부분만 좁게 설계하는 편이 안전합니다. 메일·메신저 **내용**을 보는 기능은 통신비밀보호법 제3조, 감시 설비 도입은 근로자참여법 제20조제1항제14호(노사협의회 협의)와 연결되므로 반드시 법무·인사 검토를 거치세요(`review-required`).

## 적용 조건과 예외

| 기능 | 성격 | 주요 확인 사항 |
| --- | --- | --- |
| 개인정보처리시스템 접속기록 보관·점검 | 고시 제8조가 요구하는 **법령상 조치** | 그 데이터를 다른 목적(근태·평가)에 쓰면 제18조제1항 목적 외 이용 검토 |
| 보안 이벤트 탐지 (대량 다운로드, 비정상 접속) | 6호 정당한 이익 후보 | 탐지 규칙 범위, 보관기간, 열람자 제한 |
| 팀 단위 생산성 지표 (배포 횟수, 티켓 처리량) | 집계 | 소규모 팀에서 개인이 식별되지 않는지 |
| 개인별 생산성 점수, 키 입력·마우스 활동 추적 | 개인별 분석 | 6호 요건(명백한 우선, 상당한 관련, 합리적 범위) 충족 여부 — `review-required` |
| 화면 녹화·주기적 스크린샷 | 개인별·고침해 | 감시 설비 해당 여부, 사생활·민감정보 포착 위험 — `review-required` |
| 업무 메일·메신저 **내용** 열람·분석 | 통신 내용 | 통신비밀보호법 제3조와의 관계 — `review-required` |
| 위치 추적 (업무용 모바일) | 개인별 | 위치정보 관련 법령은 이 가이드에서 원문 미확인 — `review-required` |

경계:

- **접속기록은 만들어야 하는 데이터**입니다(고시 제8조). 문제는 그 데이터를 "누가 일을 덜 했는가" 분석에 재사용하는 것입니다. 수집 목적을 문서로 고정하세요.
- **동의를 받으면 된다**는 접근은 근로관계에서 자유로운 동의로 볼 수 있는지 다툼이 있을 수 있어, 근거로 삼기 전에 검토가 필요합니다(`review-required`).
- 통신비밀보호법의 "감청"은 정의상 당사자 동의 없이 전자장치 등으로 전기통신의 내용을 지득·채록하는 행위입니다. 이미 송수신이 끝나 저장된 메일·메시지를 열람하는 것이 감청에 해당하는지는 해석 문제이므로 단정하지 않습니다(`review-required`).
- 근로자참여법 제20조제1항제14호의 "근로자 감시 설비"에 소프트웨어 에이전트나 로그 분석 기능이 포함되는지는 사안별 판단입니다(`review-required`).

## 실제 법적 근거

- 「개인정보 보호법」 제3조
  - 제1항: 처리 목적을 명확하게 하고 그 목적에 필요한 범위에서 최소한의 개인정보만을 적법하고 정당하게 수집합니다.
  - 제6항: 정보주체의 사생활 침해를 최소화하는 방법으로 처리합니다.
  - 제7항: 익명 또는 가명으로 처리하여도 목적을 달성할 수 있으면 익명처리가 가능한 경우 익명으로, 익명으로 목적을 달성할 수 없으면 가명으로 처리될 수 있도록 합니다.
- 같은 법 제15조제1항제6호: 처리자의 정당한 이익을 달성하기 위하여 필요한 경우로서 **명백하게** 정보주체의 권리보다 우선하는 경우. 정당한 이익과 **상당한 관련**이 있고 **합리적인 범위를 초과하지 아니하는** 경우에 한합니다.
- 같은 법 제18조제1항: 제15조제1항에 따른 범위를 초과하여 이용해서는 안 됩니다.
- 같은 법 제22조제3항: 동의 없이 처리하는 개인정보의 항목과 근거를 구분하여 공개하거나 알리고, 입증책임은 처리자가 집니다.
- 안전성 확보조치 기준 제8조제2항: 취급자의 접속기록과 개인정보 다운로드 상황을 확인·점검하는 주기·방법·사후조치절차를 내부 관리계획으로 정하고 이행합니다.
- 「통신비밀보호법」(법률 제21989호) 제3조제1항: 누구든지 이 법과 「형사소송법」 등에 따르지 아니하고는 우편물의 검열·전기통신의 감청 또는 통신사실확인자료의 제공을 하거나 공개되지 아니한 타인간의 대화를 녹음 또는 청취하지 못합니다. 제2조제3호는 전화·전자우편 등을 "전기통신"으로, 제7호는 당사자의 동의 없이 전자장치 등을 사용해 내용을 지득·채록하거나 송수신을 방해하는 것을 "감청"으로 정의합니다.
- 「근로자참여 및 협력증진에 관한 법률」(법률 제18927호) 제20조제1항제14호: "사업장 내 근로자 감시 설비의 설치"는 노사협의회가 협의하여야 할 사항입니다.

(2026-10-23 국가법령정보센터 원문 대조. 각 기능이 위 조항에 해당하는지에 대한 판단과 인사·노무편 가이드라인 해석은 `review-required`. 인사·노무편(2023.1. 개정)은 개인정보보호위원회 게시판에서 과거 안내서로 분류되어 있으니 현재 안내서와 함께 확인하세요.)

## 개발자용 실무 해설

1. **목적 → 최소 데이터 → 최소 해상도 순서로 설계합니다.** "보안 사고 탐지"가 목적이면 이상 행위 규칙에 걸린 이벤트만 개인 단위로 보고, 나머지는 집계로 충분한 경우가 많습니다.
2. **식별 해상도를 단계로 둡니다.** ① 조직 집계 ② 가명 ID 단위 분석 ③ 실명 확인(사유·승인 필요). 대시보드 기본값은 ①이고, ③은 감사로그를 남기는 별도 절차로만 갑니다. → [가명처리](/sensitive-data/pseudonymization/)
3. **소규모 집단은 집계해도 개인이 드러납니다.** 3명짜리 팀의 평균은 사실상 개인 값입니다. 최소 집계 단위(예: 5명 이상)를 정하고 미만이면 억제합니다(프로젝트 권장사항, 기준값은 조직이 결정). → [데이터 공개와 다운로드](/data-sharing/public-data-and-downloads/)
4. **수집 단계에서 내용을 버립니다.** 생산성 지표에 필요한 것이 "메시지 수"라면 메시지 본문을 수집 파이프라인에 넣지 않습니다. 화면 기록처럼 민감정보가 섞이기 쉬운 수집은 설계 단계에서 대안을 먼저 찾습니다.
5. **판단 기록을 남깁니다.** 6호를 근거로 삼는다면 목적, 필요성, 대안 검토, 직원에게 미치는 영향, 완화 조치를 정리한 문서를 PR에 연결하고 법무·인사 검토를 받으세요. 노사협의회 협의 필요 여부도 이 단계에서 확인합니다.
6. **직원에게 알립니다.** 동의 없이 처리하는 항목과 근거는 제22조제3항에 따라 구분해 공개·고지해야 합니다. 사내 처리방침이나 고지문에 모니터링 항목, 목적, 보관기간, 열람자를 적습니다.

## 권장 설계

```text
수집 (purpose-bound)
  event: {actor_pid, team_id, type, at}      ← 실명 대신 가명 ID, 내용 미수집
     │
     ▼
집계 계층 (기본 노출)
  team_metrics(team_id, week, count)  WHERE team_size >= K   ← 소규모 셀 억제
     │
     ▼
예외 조회 (보안 사고 대응만)
  pid → 실명 재식별: 사유 + 승인 + 접속기록
```

- 목적별로 데이터셋을 분리합니다(`security_events`, `team_metrics`). 같은 테이블을 다른 목적이 공유하지 않게 합니다.
- 보관기간을 목적별로 짧게 정하고 자동 삭제합니다. 법정 접속기록 보관기간(1년 또는 2년)과 분석용 데이터 보관기간을 혼동하지 않습니다. → [보존기간과 파기](/storage-retention/retention-destruction/)
- 가명 ID와 실명 매핑 테이블은 별도 권한으로 분리합니다.

## 위험한 설계

- 접속기록·VPN 로그를 그대로 근태·성과 평가 대시보드에 연결
- 개인별 "생산성 점수"를 팀장에게 자동 공유
- 업무 PC 에이전트가 주기적으로 전체 화면을 캡처해 무기한 보관
- 메신저 메시지 본문을 키워드 분석용으로 상시 수집
- 3명 팀도 팀 평균을 그대로 노출
- 모니터링 항목·목적·보관기간을 직원에게 알리지 않음
- 노사협의회 협의 필요성 검토 없이 감시 기능 배포

## Python/TypeScript 구현 예제

```python
# 집계 우선 + 소규모 셀 억제 + 실명 재식별은 사유·감사로그 필수
import hmac, hashlib
from collections import Counter

K_MIN = 5  # 최소 집계 단위 (조직이 정하는 값, 프로젝트 권장)
PID_KEY = load_secret("activity-pid-key")  # 매핑 키는 별도 권한

def pseudonymize(employee_id: str) -> str:
    return hmac.new(PID_KEY, employee_id.encode(), hashlib.sha256).hexdigest()[:16]

def team_weekly_counts(events: list[dict], team_sizes: dict[str, int]) -> dict[str, int | None]:
    counts = Counter(e["team_id"] for e in events)
    return {team: (counts.get(team, 0) if size >= K_MIN else None)  # 억제
            for team, size in team_sizes.items()}

def reidentify(pid: str, *, actor, reason: str, incident_id: str) -> str:
    if "security:reidentify" not in actor.permissions or not incident_id:
        raise PermissionError("보안 사고 대응 권한과 사고 번호가 필요합니다.")
    audit.append(actor=actor.id, action="REIDENTIFY", pid=pid, reason=reason, incident=incident_id)
    return pid_map.lookup(pid)
```

```ts
// 수집 단계 필터: 허용된 필드만 통과시키고 본문·화면 데이터는 버린다
const ALLOWED = ['actorPid', 'teamId', 'type', 'at'] as const;
type ActivityEvent = { [K in (typeof ALLOWED)[number]]: string };

export function sanitizeEvent(raw: Record<string, unknown>): ActivityEvent {
  const out = {} as ActivityEvent;
  for (const k of ALLOWED) {
    const v = raw[k];
    if (typeof v !== 'string') throw new Error(`필수 필드 누락: ${k}`);
    out[k] = v;
  }
  return out; // body, subject, screenshot 등은 여기서 사라진다
}
```

전체 실행 가능한 예제와 테스트는 [구현 예제](/tools/examples/)를 참고하세요.

## 개발 체크리스트

- [ ] 모니터링 기능마다 목적이 문서화되어 있고, 데이터셋이 목적별로 분리되어 있다
- [ ] 집계·익명·가명으로 목적을 달성할 수 있는지 먼저 검토했다 (제3조제7항)
- [ ] 개인 식별 조회는 사유·권한·감사로그를 거친다
- [ ] 소규모 집단 집계 억제 기준(K)이 정해져 있다
- [ ] 메일·메신저 내용, 화면, 키 입력을 수집하지 않거나, 수집한다면 법무 검토를 마쳤다 (`review-required`)
- [ ] 정당한 이익(6호)을 근거로 쓰는 경우 판단 문서가 있다 (`review-required`)
- [ ] 노사협의회 협의 대상인지 인사·법무와 확인했다 (`review-required`)
- [ ] 직원 대상 고지에 항목, 목적, 근거, 보관기간, 열람자가 있다
- [ ] 법정 접속기록을 다른 목적에 재사용하지 않는다

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 개인정보 보호법, 안전성 확보조치 기준, 통신비밀보호법 제2조·제3조, 근로자참여법 제20조는 2026-10-23 원문과 대조했습니다. 개별 모니터링 기능이 이 조항들에 해당하는지에 대한 판단과 인사·노무편 가이드라인 해석은 `review-required`입니다.
