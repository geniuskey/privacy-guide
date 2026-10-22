---
title: 사내 서비스에서 직원 정보 처리하기
description: 직원도 정보주체입니다. 근로관계에서 쓸 수 있는 처리 근거, 민감정보·고유식별정보 경계, 사내 디렉터리와 HR 시스템의 필드 최소화를 개발 관점에서 정리합니다.
category: internal-admin
status: review-required
lastVerified: 2026-10-23
tags: [직원정보, 처리근거, 최소수집, 사내시스템, 민감정보]
related: [internal-admin/activity-monitoring, internal-admin/admin-vs-data-access, collection-consent/lawful-basis, sensitive-data/sensitive-vs-personal, sensitive-data/unique-identifiers, case-studies/internal-hr-dashboard]
sources: [pipa, pipa-decree, safety-notice, pipc-hr-guide, labor-standards-act, worker-participation-act]
legalBasis:
  - source: pipa
    article: 제15조제1항
    kind: law
    summary: 동의(1호), 법률의 특별한 규정·법령상 의무(2호), 계약 체결·이행(4호), 정당한 이익(6호) 등 수집·이용 근거
    status: verified
  - source: pipa
    article: 제16조제1항
    kind: law
    summary: 목적에 필요한 최소한의 개인정보를 수집하고, 최소 수집의 입증책임은 처리자가 진다
    status: verified
  - source: pipa
    article: 제22조제3항
    kind: law
    summary: 동의 없이 처리하는 개인정보는 항목과 법적 근거를 구분하여 공개하거나 알리고, 입증책임은 처리자에게 있다
    status: verified
  - source: pipa
    article: 제23조제1항, 제24조제1항, 제24조의2제1항
    kind: law
    summary: 민감정보(노동조합 가입·탈퇴, 건강 등)와 고유식별정보, 주민등록번호는 별도 동의 또는 법령의 요구·허용이 있어야 처리 가능
    status: verified
  - source: safety-notice
    article: 제7조제3항, 제6조제2항 단서
    kind: notice
    summary: 이용자가 아닌 정보주체(직원 등)의 고유식별정보 저장 시 암호화 기준, 외부 접속 시 VPN 등 안전한 접속수단 또는 안전한 인증수단 적용 가능
    status: verified
  - source: pipc-hr-guide
    kind: guide
    summary: 채용·재직·퇴직 단계별 직원 개인정보 처리 근거와 동의의 한계에 대한 해석(최신판과 세부 내용 원문 대조 필요)
    status: review-required
  - source: labor-standards-act
    kind: law
    summary: 근로자 명부·임금대장 등 서류 작성·보존 의무가 제15조제1항제2호 근거가 될 수 있음(조문 번호와 보존 기간은 원문 확인 필요)
    status: review-required
  - source: worker-participation-act
    article: 제20조제1항제14호
    kind: law
    summary: 사업장 내 근로자 감시 설비의 설치는 노사협의회 협의 사항 (사내 시스템의 특정 기능이 감시 설비에 해당하는지는 사안별 검토 필요)
    status: verified
---

## 한 문장 결론

직원 정보도 개인정보 보호법이 그대로 적용되는 개인정보이고, 근로관계에서는 **근로계약 이행(제15조제1항제4호)과 법령상 의무(제2호)** 로 처리할 수 있는 범위가 넓은 대신 **그 범위를 넘는 항목은 근거를 따로 확인**해야 합니다. 근로관계의 특성상 직원 동의는 자유로운 동의로 인정받기 어려울 수 있다는 지적이 있으므로, 동의를 기본 근거로 삼는 설계는 법무 검토가 필요합니다(`review-required`).

## 적용 조건과 예외

| 데이터 | 흔한 근거 후보 | 확인할 점 |
| --- | --- | --- |
| 사번, 이름, 부서, 직급, 업무 이메일 | 4호 계약 이행 | 사내 디렉터리 노출 범위 |
| 급여, 계좌번호 | 4호 계약 이행, 2호 법령상 의무 | 계좌번호는 이용자가 아닌 정보주체 정보. 저장 암호화 기준 확인 |
| 주민등록번호 | 제24조의2제1항제1호 (법령의 구체적 요구·허용) | 원천징수·사회보험 등 근거 법령의 조문 확인 필요 (`review-required`) |
| 건강검진 결과, 장애 여부 | 제23조 (민감정보) | 별도 동의 또는 법령 근거. 열람 권한 매우 좁게 |
| 노동조합 가입 여부 | 제23조 (민감정보) | 사내 시스템에 저장할 필요가 있는지부터 검토 |
| 비상연락처(가족) | 동의 또는 6호 정당한 이익 | 가족은 별도 정보주체 |
| 업무 로그, 접속기록 | 고시 제8조(취급자 접속기록), 6호 정당한 이익 | 개인별 분석은 별도 검토 → [활동 모니터링](/internal-admin/activity-monitoring/) |
| 사진, 생일, 취미 (디렉터리 프로필) | 1호 동의 (선택) | 입력하지 않아도 불이익이 없게 |

경계:

- **제15조제1항제4호**는 "정보주체와 체결한 계약을 이행하거나 계약 체결 과정에서 정보주체의 요청에 따른 조치를 이행하기 위하여 필요한 경우"입니다. 근로계약 이행에 "필요한" 범위인지가 관건이고, 그 판단은 사안별 검토 대상입니다.
- **채용 지원자, 퇴직자, 가족**은 재직자와 근거가 다릅니다. 지원자 정보의 보유기간, 퇴직자 정보의 파기·보존은 따로 정의하세요. → [보존기간과 파기](/storage-retention/retention-destruction/)
- **인사·노무편 가이드라인**의 단계별 해석은 원문 대조 전이므로 구체적 문구를 인용하지 않았습니다(`review-required`). 개인정보보호위원회 안내서 게시판은 인사·노무 편(2023.1. 개정)을 **과거 안내서**로 분류합니다(2026-10-23 확인). 현행 해석은 [개인정보 처리 통합 안내서(2025.7.)](https://www.pipc.go.kr/np/cop/bbs/selectBoardArticle.do?bbsId=BS217&mCode=D010030000&nttId=11352) 등 현재 안내서에서 확인하세요.
- **근로자참여법 제20조제1항제14호**는 "사업장 내 근로자 감시 설비의 설치"를 노사협의회 협의 사항으로 둡니다. 출입 기록, 업무 PC 에이전트, 활동 로그 수집 기능이 이 "감시 설비"에 해당하는지는 사안별 판단이 필요합니다(`review-required`). → [활동 모니터링](/internal-admin/activity-monitoring/)
- 근로기준법 등 노동 관계 법령의 서류 보존 의무를 근거로 쓰려면 해당 법령의 조문과 보존 기간을 원문에서 확인해야 합니다(`review-required`).

## 실제 법적 근거

- 「개인정보 보호법」 제15조제1항: 1호 동의, 2호 법률의 특별한 규정·법령상 의무 준수에 불가피한 경우, 4호 계약 이행·체결 과정의 요청 조치, 6호 처리자의 정당한 이익이 명백하게 정보주체의 권리보다 우선하는 경우(상당한 관련성·합리적 범위 내) 등.
- 같은 법 제16조제1항: 목적에 필요한 최소한의 개인정보를 수집하고, 최소 수집의 입증책임은 처리자가 부담합니다.
- 같은 법 제22조제3항: 동의 없이 처리하는 개인정보의 항목과 법적 근거를 동의 기반 정보와 구분하여 공개하거나 알리고, 입증책임은 처리자에게 있습니다. 사내 개인정보 처리방침(또는 직원 대상 고지)에 반영합니다.
- 같은 법 제23조제1항: 노동조합·정당의 가입·탈퇴, 건강 등 민감정보는 별도 동의(1호) 또는 법령의 요구·허용(2호)이 있어야 합니다.
- 같은 법 제24조제1항·제24조의2제1항: 고유식별정보는 별도 동의 또는 법령의 구체적 요구·허용, 주민등록번호는 법률·대통령령 등에서 구체적으로 요구·허용한 경우 등으로만 처리합니다.
- 안전성 확보조치 기준 제7조제3항: 이용자가 아닌 정보주체의 고유식별정보를 인터넷망 구간·DMZ에 저장하면 암호화하고, 내부망에 저장하는 경우 주민등록번호는 암호화하며 그 외 고유식별정보는 위험도 분석 등에 따라 적용 여부를 정할 수 있습니다. 제7조제5항: 취급자의 PC·모바일·보조저장매체에 저장할 때는 암호화합니다.
- 같은 기준 제6조제2항 단서: 이용자가 아닌 정보주체의 개인정보를 처리하는 시스템은 외부 접속에 VPN 등 안전한 접속수단 또는 안전한 인증수단을 적용할 수 있습니다.

- 「근로자참여 및 협력증진에 관한 법률」(법률 제18927호) 제20조제1항제14호: 노사협의회가 협의하여야 할 사항으로 "사업장 내 근로자 감시 설비의 설치"를 둡니다.

(2026-10-23 국가법령정보센터 원문 대조. 근로기준법 개별 조문과 인사·노무편 가이드라인은 미대조.)

## 개발자용 실무 해설

1. **"이용자"와 "이용자가 아닌 정보주체"를 구분합니다.** 고시는 정보통신서비스 이용자와 그 외 정보주체(직원 등)에 서로 다른 암호화·접속 기준을 둡니다. 사내 시스템의 데이터 분류표에 정보주체 유형을 칼럼으로 두세요.
2. **사내 디렉터리는 "알 필요"로 나눕니다.** 전 직원이 보는 디렉터리에는 이름, 부서, 업무 연락처 정도만 둡니다. 개인 휴대전화, 생일, 입사일, 직급 이력은 선택 항목 또는 HR 담당자 전용으로 분리합니다. → [데이터 공개 범위](/data-sharing/public-data-and-downloads/)
3. **HR 시스템의 필드는 목적별로 테이블을 나눕니다.** 급여·계좌(정산 담당), 건강(보건 담당), 평가(인사 담당)를 한 `employees` 테이블에 몰면 권한 분리가 어렵습니다.
4. **동의서를 만들기 전에 근거를 먼저 매핑합니다.** 계약 이행·법령상 의무로 처리하는 항목까지 동의서에 넣으면 동의 철회 시 처리 방법이 애매해집니다. 동의는 선택 항목에만 씁니다. → [처리 근거 고르기](/collection-consent/lawful-basis/)
5. **퇴직 이벤트를 데이터 수명주기와 연결합니다.** 계정 말소(고시 제5조제2항)와 별개로, 법령상 보존 항목은 분리 보관(법 제21조제3항)하고 나머지는 파기합니다.

## 권장 설계

```text
employee_core        (전 직원 공개: 이름, 부서, 업무 이메일, 내선)
employee_profile     (선택 입력, 동의 기반: 사진, 자기소개)
employee_hr          (HR 전용: 입사일, 고용형태, 직급 이력)
employee_payroll     (정산 전용: 계좌번호[암호화], 급여)        basis=CONTRACT/LEGAL
employee_identity    (정산 전용: 주민등록번호[암호화])          basis=LEGAL (근거 조문 review-required)
employee_health      (보건 전용: 검진 결과[암호화])             basis=SENSITIVE_CONSENT or LEGAL
emergency_contacts   (본인·HR: 가족 연락처)                     basis=CONSENT
```

- 테이블마다 처리 근거, 보유기간, 접근 역할을 메타데이터로 둡니다.
- 디렉터리 API는 `employee_core`만 반환하는 별도 DTO를 사용합니다.
- 주민등록번호는 실제로 필요한 기능(원천징수 신고 등)에서만 복호화하고, 화면에는 마스킹합니다. → [고유식별정보](/sensitive-data/unique-identifiers/)

## 위험한 설계

- 입사 시 "개인정보 수집·이용 전체 동의" 한 장으로 모든 항목을 처리
- 전사 디렉터리에 개인 휴대전화, 생년월일, 주소 노출
- 노동조합 가입 여부, 병가 사유를 일반 HR 필드로 저장
- 주민등록번호를 사번 대용 식별자로 사용
- 퇴직자 데이터를 재직자 테이블에 `is_active=false`로 무기한 보관
- HR 데이터 내보내기 기능을 팀장 전원에게 개방

## Python/TypeScript 구현 예제

```python
# 직원 필드 정책: 근거·접근 역할·노출 범위를 한곳에서 관리하고 디렉터리 응답을 제한한다
from dataclasses import dataclass
from enum import Enum

class Basis(str, Enum):
    CONTRACT = "pipa-15-1-4"
    LEGAL = "pipa-15-1-2"          # 근거 법령 조문을 note에 기록 (review-required)
    CONSENT = "pipa-15-1-1"
    SENSITIVE_CONSENT = "pipa-23-1-1"

@dataclass(frozen=True)
class EmpField:
    basis: Basis
    roles: frozenset[str]
    directory: bool = False
    note: str = ""

EMPLOYEE_FIELDS = {
    "name": EmpField(Basis.CONTRACT, frozenset({"*"}), directory=True),
    "department": EmpField(Basis.CONTRACT, frozenset({"*"}), directory=True),
    "work_email": EmpField(Basis.CONTRACT, frozenset({"*"}), directory=True),
    "bank_account": EmpField(Basis.CONTRACT, frozenset({"payroll"})),
    "rrn": EmpField(Basis.LEGAL, frozenset({"payroll"}), note="원천징수 근거 조문 확인 필요"),
    "health_checkup": EmpField(Basis.SENSITIVE_CONSENT, frozenset({"health_officer"})),
    "photo": EmpField(Basis.CONSENT, frozenset({"*"}), directory=True),
}

def directory_view(emp: dict) -> dict:
    return {k: emp[k] for k, f in EMPLOYEE_FIELDS.items() if f.directory and emp.get(k) is not None}
```

```ts
// 디렉터리 응답 타입을 좁게 정의해, 실수로 HR 필드가 섞이면 컴파일 오류가 나게 한다
type DirectoryEntry = Readonly<{
  name: string;
  department: string;
  workEmail: string;
  photoUrl?: string; // 본인이 동의·입력한 경우에만
}>;

export function toDirectoryEntry(e: { name: string; department: string; workEmail: string; photoUrl?: string }): DirectoryEntry {
  return { name: e.name, department: e.department, workEmail: e.workEmail, ...(e.photoUrl ? { photoUrl: e.photoUrl } : {}) };
}
```

전체 실행 가능한 예제와 테스트는 [구현 예제](/tools/examples/)를 참고하세요.

## 개발 체크리스트

- [ ] 직원 데이터 필드마다 제15조제1항 근거(또는 제23조·제24조 근거)가 지정되어 있다
- [ ] 법령상 의무를 근거로 한 항목은 근거 법령과 조문이 기록되어 있다 (`review-required`)
- [ ] 동의는 선택 항목에만 쓰이고, 거부해도 불이익이 없다
- [ ] 동의 없이 처리하는 항목과 근거가 직원 대상 처리방침·고지에 구분되어 있다
- [ ] 사내 디렉터리는 최소 필드만 반환한다
- [ ] 민감정보·고유식별정보는 별도 테이블, 암호화, 좁은 역할로 관리된다
- [ ] 지원자·재직자·퇴직자·가족의 보유기간과 파기 규칙이 따로 있다
- [ ] 직원 활동을 기록·수집하는 기능이 있다면 노사협의회 협의 대상인지 인사·법무와 확인했다 (`review-required`)
- [ ] 직원 정보 처리 해석을 현재 안내서(개인정보 처리 통합 안내서 등)로 대조했다. 인사·노무편(2023.1.)은 과거 안내서로 분류됨 (`review-required`)

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 개인정보 보호법과 안전성 확보조치 기준은 2026-10-23 원문과 대조했습니다. 개인정보 보호 가이드라인(인사·노무편)과 근로기준법의 세부 내용은 원문 대조 전이라 `review-required`입니다.
