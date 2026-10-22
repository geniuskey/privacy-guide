---
title: 개인정보 보호법·고시 ↔ OWASP ASVS 5.0 매핑
description: 개인정보 보호법, 시행령, 안전성 확보조치 기준의 요구사항을 OWASP ASVS 5.0의 장(V1~V17)에 매핑합니다. 법적 의무와 기술 표준 권고를 구분해 보안 검증 계획에 쓰도록 정리했습니다.
category: app-security
status: review-required
lastVerified: 2026-10-23
tags: [OWASP, ASVS, 안전조치, 보안검증, 암호화, 접속기록]
related: [storage-retention/encryption, storage-retention/access-logs, auth-access/access-control, auth-access/authentication-session]
sources: [pipa, pipa-decree, safety-notice, owasp-asvs-5]
legalBasis:
  - source: pipa
    article: 제29조
    kind: law
    summary: 대통령령으로 정하는 바에 따른 기술적·관리적·물리적 안전조치 의무
    status: verified
  - source: pipa-decree
    article: 제30조제1항
    kind: decree
    summary: 내부 관리계획, 접근 권한 제한, 접근 통제, 저장·전송 암호화, 접속기록 보관·위변조 방지, 악성프로그램 방지, 물리적 조치
    status: verified
  - source: safety-notice
    article: 제4조~제13조
    kind: notice
    summary: 내부 관리계획, 접근 권한 관리, 접근통제, 인터넷망 차단, 암호화, 접속기록, 악성프로그램 방지, 물리적 조치, 재해 대비, 출력·복사, 파기에 관한 최소 기준
    status: verified
  - source: owasp-asvs-5
    article: V1~V17
    kind: standard
    summary: ASVS 5.0의 17개 장 구성(장 단위 인용은 verified, 장 안의 세부 요구사항 번호는 원문 대조 전)
    status: verified
  - source: project
    kind: best-practice
    summary: 법령 요구사항과 ASVS 장의 대응 관계는 이 프로젝트의 해석이며 공식 매핑이 아님
    status: review-required
---

## 한 문장 결론

ASVS는 **"어떻게 검증할지"를 알려주는 기술 표준**이고, 개인정보 보호법·시행령·고시는 **"무엇을 해야 하는지"를 정한 의무**입니다. 고시 조항마다 대응하는 ASVS 장을 붙여 두면, 보안 검증 결과를 안전조치 이행 증거로 재사용하기 쉬워집니다. 다만 ASVS를 통과했다고 법적 의무를 다했다고 볼 수는 없고, 반대도 마찬가지입니다.

## 적용 조건과 예외

- **법적 구속력**: 법률(law)·시행령(decree)·고시(notice)만 의무입니다. ASVS(standard)는 권고이며, 이 문서의 매핑은 **이 프로젝트의 해석**(best-practice)입니다. 개인정보보호위원회나 OWASP가 공식으로 발표한 매핑이 아닙니다.
- **인용 단위**: ASVS 5.0의 장 구성(V1~V17)은 공식 저장소에서 확인했습니다. 장 안의 세부 요구사항 번호(예: `v5.0.0-11.x.y`)는 이 문서에서 원문 대조를 하지 않았으므로 장 단위까지만 인용합니다. 세부 번호를 쓰려면 원문을 확인하세요(`review-required`).
- **범위 차이**: 고시에는 ASVS가 다루지 않는 관리적·물리적 조치(내부 관리계획, 교육, 출입통제, 재해 대비)가 있고, ASVS에는 법령이 언급하지 않는 기술 항목(입력 인코딩, 파일 업로드, WebRTC 등)이 있습니다.

## 실제 법적 근거

- 「개인정보 보호법」 제29조: 안전성 확보에 필요한 기술적·관리적·물리적 조치 의무.
- 시행령 제30조제1항: 제1호 내부 관리계획, 제2호 접근 권한 제한, 제3호 접근 통제, 제4호 저장·전송 암호화, 제5호 접속기록 보관 및 위·변조 방지, 제6호 악성프로그램 방지, 제7호 물리적 조치, 제8호 그 밖의 조치. 제3항에서 세부 기준을 고시로 위임합니다.
- 「개인정보의 안전성 확보조치 기준」(고시 제2026-9호) 제3조: 보유 수, 유형, 정보주체에 미치는 영향 등을 고려해 스스로의 환경에 맞는 조치를 적용해야 합니다.

(법률 제21445호, 시행령 제36671호, 고시 제2026-9호 기준. 2026-10-23 원문 대조.)

## 개발자용 실무 해설

### 고시 조항 → ASVS 장 매핑표

| 법령 요구 (의무) | 핵심 내용 | 관련 ASVS 5.0 장 (권고) | 비고 |
| --- | --- | --- | --- |
| 고시 제4조 내부 관리계획 | 조직, 책임, 교육, 이행 점검(연 1회 이상) | V15 Secure Coding and Architecture (일부) | 대부분 관리적 조치. ASVS 범위 밖이 많음 |
| 고시 제5조①② 최소 권한, 변경 시 지체 없이 말소 | 업무에 필요한 최소 범위로 차등 부여 | V8 Authorization | → [접근 제어](/auth-access/access-control/) |
| 고시 제5조③ 권한 변경 내역 3년 보관 | 부여·변경·말소 기록 | V16 Security Logging and Error Handling | |
| 고시 제5조④ 계정 공유 금지 | 취급자별 계정 발급 | V6 Authentication | |
| 고시 제5조⑤⑥ 인증수단, 인증 실패 시 접근 제한 | 안전한 인증, 무차별 대입 방지 | V6 Authentication | → [인증·세션](/auth-access/authentication-session/) |
| 고시 제6조① IP 등 접속 제한, 유출 시도 탐지 | 네트워크 접근 통제와 탐지 | V13 Configuration, V16 | 인프라(WAF, 보안그룹) 영역 포함 |
| 고시 제6조② 외부 접속 시 안전한 인증수단 | 인증서, 보안토큰, OTP 등 | V6 Authentication | 정보주체는 제외 |
| 고시 제6조③ 홈페이지·공유설정 통한 공개·유출 방지 | 권한 없는 자에게 공개 방지 | V8 Authorization, V13 Configuration, V14 Data Protection | 디렉터리 리스팅, 공개 버킷 |
| 고시 제6조④ 일정 시간 미사용 시 접속 차단 | 세션 타임아웃 | V7 Session Management | |
| 고시 제6조의2 인터넷망 차단 | 일정 규모 이상 처리자 | (해당 장 없음) | 망분리는 인프라·관리 영역 |
| 고시 제7조① 인증정보 암호화, 비밀번호 일방향 | 저장·송수신 | V11 Cryptography, V6 Authentication | → [암호화](/storage-retention/encryption/) |
| 고시 제7조②③⑤ 고유식별정보 등 저장 시 암호화 | 필드·파일 암호화 | V11 Cryptography, V14 Data Protection | |
| 고시 제7조④ 인터넷망 구간 송수신 암호화 | 전송 구간 | V12 Secure Communication | |
| 고시 제7조⑥ 암호 키 관리 절차 | 생성·이용·보관·배포·파기 | V11 Cryptography, V13 Configuration (비밀 관리) | 규모 기준 있음 |
| 고시 제8조 접속기록 보관·점검·위변조 방지 | 1년/2년 이상, 점검, 무결성 | V16 Security Logging and Error Handling | → [접속기록](/storage-retention/access-logs/) |
| 고시 제9조 악성프로그램 방지 | 백신, 보안 업데이트 | V15 Secure Coding and Architecture (의존성 관리, 일부) | 엔드포인트 보안은 범위 밖 |
| 고시 제10조 물리적 안전조치 | 출입통제, 잠금장치 | (해당 장 없음) | |
| 고시 제11조 재해·재난 대비 | 백업·복구 계획 | (해당 장 없음, V14 일부) | 규모 기준 있음 |
| 고시 제12조 출력·복사 시 항목 최소화 | 화면표시·파일생성 포함 | V4 API and Web Service, V8 Authorization, V14 Data Protection | → [최소 필드 반환](/app-security/minimal-response/) |
| 고시 제13조 파기 | 복원 불가능한 삭제 | V14 Data Protection | → [보존과 파기](/storage-retention/retention-destruction/) |

### 법률 조항 → ASVS 장 (보조)

| 법률 | 내용 | 관련 ASVS 장 |
| --- | --- | --- |
| 제3조, 제16조 최소 처리·수집 | 필요한 최소한만 처리 | V14 Data Protection, V4 API and Web Service |
| 제23조, 제24조, 제24조의2 민감정보·고유식별정보 | 별도 근거, 암호화 | V11, V14 |
| 제34조 유출등 통지·신고 | 탐지와 대응 | V16 (탐지 근거가 되는 로깅) |
| 제34조의2 공중 노출 방지 | 고유식별정보·계좌·카드 정보 노출 방지 | V13 Configuration, V14 |
| 제35조~제38조 정보주체 권리 | 열람·정정·삭제·처리정지·전송 | V8 Authorization(본인 확인 후 접근), V6 |

### 법령 매핑이 약한 ASVS 장

V1 Encoding and Sanitization, V2 Validation and Business Logic, V3 Web Frontend Security, V5 File Handling, V9 Self-contained Tokens, V10 OAuth and OIDC, V17 WebRTC는 특정 고시 조항과 직접 대응하지 않습니다. 하지만 이 장의 취약점(XSS, 인젝션, 토큰 위조)은 결국 유출등으로 이어지므로 법 제29조의 "안전성 확보에 필요한 기술적 조치"를 설명하는 근거로 함께 쓸 수 있습니다.

## 권장 설계

- 보안 검증 체크리스트의 각 항목에 `legal_ref`(고시 조항)와 `asvs_ref`(장, 원문 확인 후 세부 번호)를 같이 둡니다.
- 검증 결과는 "고시 이행 증거"와 "ASVS 레벨 달성"을 따로 집계합니다. 하나가 다른 하나를 대체하지 않습니다.
- ASVS 레벨(L1~L3)은 서비스 위험도로 고르고, 고시는 규모 기준(1만명, 5만명, 10만명, 100만명 등)에 따라 추가 의무가 생기는지 별도로 확인합니다.

```yaml
# security-requirements.yaml (예시)
- id: SEC-ENC-01
  title: 비밀번호 일방향 저장
  legal_ref: { source: safety-notice, article: "제7조제1항 단서", kind: notice }
  asvs_ref: { chapter: V11, item: null }   # 세부 번호는 원문 확인 후 기입
  test: tests/security/test_password_hash.py
- id: SEC-LOG-01
  title: 개인정보취급자 접속기록 2년 보관
  legal_ref: { source: safety-notice, article: "제8조제1항", kind: notice }
  asvs_ref: { chapter: V16, item: null }
  test: tests/security/test_access_log_retention.py
```

## 위험한 설계

- "ASVS L2 통과 = 개인정보 보호법 준수"라고 보고
- ASVS 세부 요구사항 번호를 원문 확인 없이 인용(버전 간 번호가 바뀜)
- 고시의 관리적 조치(내부 관리계획, 점검 기록, 교육)를 기술 검증만으로 대체
- 고시의 규모 기준(키 관리, 접속기록 2년, 재해 대비 등)을 확인하지 않고 일괄 적용 또는 일괄 제외

## Python/TypeScript 구현 예제

```python
# 요구사항 YAML 검증: legal_ref가 없는 보안 요구사항, ASVS 세부 번호 미확인 항목 리포트
import yaml

def lint_requirements(path: str) -> list[str]:
    problems = []
    for r in yaml.safe_load(open(path, encoding="utf-8")):
        if not r.get("legal_ref") and not r.get("asvs_ref"):
            problems.append(f"{r['id']}: 법령·표준 근거가 모두 없음")
        asvs = r.get("asvs_ref") or {}
        if asvs and not str(asvs.get("chapter", "")).startswith("V"):
            problems.append(f"{r['id']}: ASVS 장 표기 오류")
        if asvs and asvs.get("item") is None:
            problems.append(f"{r['id']}: ASVS 세부 번호 review-required")
        if r.get("legal_ref", {}).get("kind") not in (None, "law", "decree", "notice"):
            problems.append(f"{r['id']}: legal_ref에는 구속력 있는 근거만 둔다")
    return problems
```

```ts
// 대시보드 집계: 법적 의무 이행과 ASVS 달성을 분리해서 센다
type Req = { id: string; legalRef?: { kind: 'law' | 'decree' | 'notice' }; asvsRef?: { chapter: string }; passed: boolean };

export function summarize(reqs: Req[]) {
  const legal = reqs.filter((r) => r.legalRef);
  const asvs = reqs.filter((r) => r.asvsRef);
  return {
    legalObligations: { total: legal.length, passed: legal.filter((r) => r.passed).length },
    asvsChapters: [...new Set(asvs.map((r) => r.asvsRef!.chapter))].sort(),
    asvsPassed: asvs.filter((r) => r.passed).length,
  };
}
```

전체 예제는 [구현 예제](/tools/examples/)와 [코드 리뷰 체크리스트](/tools/code-review-checklist/)를 참고하세요.

## 개발 체크리스트

- [ ] 보안 요구사항마다 법령 근거(있다면)와 ASVS 장이 분리되어 기록되어 있다
- [ ] 법령 근거에는 law/decree/notice만, 권고는 standard/best-practice로 표시한다
- [ ] ASVS 세부 요구사항 번호는 5.0 원문으로 확인한 것만 기입했다 (`review-required`)
- [ ] 고시의 규모 기준(1만명, 5만명, 10만명, 100만명 등) 해당 여부를 확인했다
- [ ] 관리적·물리적 조치(내부 관리계획, 교육, 출입통제)는 별도 증거로 관리한다
- [ ] V1·V2·V3·V5 등 법령 매핑이 약한 장도 위험 분석에 포함했다
- [ ] 보안 검증 보고서에 "법률 준수 보증이 아님"을 명시했다

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 법 제29조, 시행령 제30조, 고시 제3조~제13조는 2026-10-23에 국가법령정보센터 Open API로 현행 원문을 확인했습니다. OWASP ASVS 5.0은 장 구성만 확인했으며, 법령과 ASVS 사이의 대응 관계는 이 프로젝트의 해석입니다.
