---
title: 구현 예제
description: FastAPI와 TypeScript로 작성한 실행 가능한 개인정보·보안 구현 예제와 자동 테스트
---

저장소의 [`examples/`](https://github.com/geniuskey/privacy-guide/tree/main/examples) 폴더에 실행 가능한 예제와 테스트가 있습니다. CI에서 매번 테스트를 실행합니다.

:::note
예제는 교육용입니다. 테스트를 통과했다고 해서 법률을 준수한다는 뜻은 아닙니다.
:::

| 주제 | Python (FastAPI) | TypeScript | 관련 문서 |
| --- | --- | --- | --- |
| RBAC 접근제어 | ✓ | ✓ | [접근권한 관리](/auth-access/access-control/) |
| 객체 단위 소유권 검증 | ✓ | ✓ | [객체 단위 권한](/auth-access/object-level-authorization/) |
| 관리자 권한과 열람 권한 분리 | ✓ | ✓ | [관리자 권한 분리](/internal-admin/admin-vs-data-access/) |
| 최소 필드 반환 API | ✓ | ✓ | [최소 필드 응답](/app-security/minimal-response/) |
| 개인정보 로그 마스킹 | ✓ | ✓ | [로그 마스킹](/app-security/log-masking/) |
| 감사로그 기록 (해시 체인) | ✓ | ✓ | [접속기록](/storage-retention/access-logs/) |
| 보존기간 만료 데이터 삭제 | ✓ | ✓ | [보존기간과 파기](/storage-retention/retention-destruction/) |
| 내보내기·삭제 요청 처리 | ✓ | ✓ | [정보주체 권리 API](/app-security/data-subject-rights/) |
| 외부 LLM 전송 데이터 필터링 | ✓ | ✓ | [LLM API 연동](/ai-llm/llm-api-integration/) |
| 세션·인증정보 보안 | ✓ | ✓ | [인증·세션](/auth-access/authentication-session/) |

## 실행

```bash
# Python (uv 필요, Python 3.12+)
cd examples/python-fastapi
uv run pytest -q

# TypeScript (Node 20+)
cd examples/typescript
npm ci && npm test
```
