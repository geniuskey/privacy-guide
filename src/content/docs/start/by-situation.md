---
title: 상황별 찾기
description: 지금 만드는 기능에서 출발해 읽어야 할 문서를 찾습니다.
---

검색창(⌘K / Ctrl+K)에 "회원가입", "엑셀 다운로드", "LLM", "주민등록번호"처럼 기능 이름을 입력해도 됩니다.

## 외부 서비스

| 지금 만드는 것 | 먼저 읽기 | 이어서 |
| --- | --- | --- |
| 회원가입·로그인 | [회원가입 서비스 사례](/case-studies/signup-service/) | [처리 근거](/collection-consent/lawful-basis/), [동의 UI](/collection-consent/consent-ui/), [인증·세션](/auth-access/authentication-session/) |
| 만 14세 미만 가입 | [아동의 개인정보](/collection-consent/children/) | [동의 UI](/collection-consent/consent-ui/) |
| 본인확인·주민등록번호 | [고유식별정보](/sensitive-data/unique-identifiers/) | [암호화](/storage-retention/encryption/) |
| 건강·생체 정보 | [민감정보 구분](/sensitive-data/sensitive-vs-personal/) | [암호화](/storage-retention/encryption/) |
| 마이페이지 조회 API | [객체 단위 권한](/auth-access/object-level-authorization/) | [최소 필드 응답](/app-security/minimal-response/) |
| 탈퇴·계정 삭제 | [정보주체 권리 API](/app-security/data-subject-rights/) | [보존기간과 파기](/storage-retention/retention-destruction/) |
| 처리방침 작성 | [개인정보 처리방침](/collection-consent/privacy-policy/) | [국외 이전](/data-sharing/cross-border-transfer/) |
| 해외 클라우드·SaaS 사용 | [제3자 제공과 위탁](/data-sharing/provision-vs-outsourcing/) | [국외 이전](/data-sharing/cross-border-transfer/) |

## 사내 서비스

| 지금 만드는 것 | 먼저 읽기 | 이어서 |
| --- | --- | --- |
| 관리자 페이지·백오피스 | [관리자 권한과 열람 권한 분리](/internal-admin/admin-vs-data-access/) | [접근권한](/auth-access/access-control/), [접속기록](/storage-retention/access-logs/) |
| 인사·근태 시스템 | [직원 정보 처리](/internal-admin/employee-data/) | [HR 대시보드 사례](/case-studies/internal-hr-dashboard/) |
| 직원 활동 분석·모니터링 | [개인별 활동 분석](/internal-admin/activity-monitoring/) | [관련 법령](/laws/related-laws/) |
| 사내 공개 대시보드·엑셀 다운로드 | [데이터 공개와 다운로드](/data-sharing/public-data-and-downloads/) | [가명·익명 처리](/sensitive-data/pseudonymization/) |

## 공통

| 지금 만드는 것 | 먼저 읽기 | 이어서 |
| --- | --- | --- |
| 외부 LLM API 연동 | [LLM API 연동](/ai-llm/llm-api-integration/) | [LLM 고객센터 챗봇 사례](/case-studies/llm-support-chatbot/) |
| 사용자 데이터로 학습·RAG | [AI 학습 데이터](/ai-llm/ai-training-data/) | [가명정보](/sensitive-data/pseudonymization/) |
| 자동 심사·추천·점수화 | [자동화된 결정](/ai-llm/automated-decisions/) | |
| 로그·APM·에러 트래커 | [로그 마스킹](/app-security/log-masking/) | [접속기록](/storage-retention/access-logs/) |
| 보안 사고 대응 | [유출등 대응](/storage-retention/breach-response/) | [최근 개정](/laws/recent-amendments/) |
| 보안 요구사항 정리 | [OWASP ASVS 매핑](/app-security/owasp-asvs-mapping/) | [코드리뷰 체크리스트](/tools/code-review-checklist/) |
