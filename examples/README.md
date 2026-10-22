# 구현 예제

가이드에서 설명한 개인정보보호·보안 원칙을 **실행 가능한 코드와 자동 테스트**로 보여주는 예제입니다.
같은 10개 주제를 Python(FastAPI)과 TypeScript(Node) 두 가지로 구현했습니다.

> **주의 — 교육용 예제입니다.**
> - 이 코드는 개념을 보여주기 위한 최소 구현입니다. 저장소는 모두 인메모리이며 운영 환경용이 아닙니다.
> - **테스트가 통과한다고 해서 개인정보 보호법 등 관련 법령을 준수한다는 뜻이 아닙니다.**
>   보존기간·법령 근거 등은 예시 값이므로, 실제 적용 전 최신 법령 확인과 법무·개인정보 보호책임자 검토가 필요합니다.
> - 정규식 기반 마스킹·필터링은 이름·주소 같은 자유 형식 개인정보를 완전히 탐지하지 못합니다. 최후 방어선으로만 사용하세요.

## 주제별 매핑

| 주제 | 가이드 문서 | Python (`python-fastapi/src/kr_privacy_examples/`) | TypeScript (`typescript/src/`) |
| --- | --- | --- | --- |
| RBAC 접근제어 | [/auth-access/access-control/](/auth-access/access-control/) | `rbac.py` | `rbac.ts` |
| 객체 단위 소유권 검증 (BOLA/IDOR) | [/auth-access/object-level-authorization/](/auth-access/object-level-authorization/) | `ownership.py` | `ownership.ts` |
| 관리자 권한과 데이터 열람 권한 분리 | [/internal-admin/admin-vs-data-access/](/internal-admin/admin-vs-data-access/) | `admin_separation.py` | `adminSeparation.ts` |
| 최소 필드 반환 API | [/app-security/minimal-response/](/app-security/minimal-response/) | `minimal_response.py` | `minimalResponse.ts` |
| 개인정보 로그 마스킹 | [/app-security/log-masking/](/app-security/log-masking/) | `log_masking.py` | `logMasking.ts` |
| 감사로그 기록 | [/storage-retention/access-logs/](/storage-retention/access-logs/) | `audit_log.py` | `auditLog.ts` |
| 보존기간 만료 데이터 삭제 | [/storage-retention/retention-destruction/](/storage-retention/retention-destruction/) | `retention.py` | `retention.ts` |
| 개인정보 내보내기 및 삭제 요청 처리 | [/app-security/data-subject-rights/](/app-security/data-subject-rights/) | `data_subject_rights.py` | `dataSubjectRights.ts` |
| 외부 LLM 전송 데이터 필터링 | [/ai-llm/llm-api-integration/](/ai-llm/llm-api-integration/) | `llm_filter.py` | `llmFilter.ts` |
| 세션·인증정보 보안 | [/auth-access/authentication-session/](/auth-access/authentication-session/) | `session_security.py` | `session.ts` |

테스트는 각 모듈과 같은 이름으로 `python-fastapi/tests/test_*.py`, `typescript/test/*.test.ts`에 있습니다.

## 주제별로 보여주는 내용

- **RBAC 접근제어**: 역할 → 권한 매핑, 기본 거부(알 수 없는 역할은 권한 없음), 코드에서는 역할이 아니라 권한을 검사. FastAPI는 `Depends(require_permission(...))`, TypeScript는 `withPermission()` 가드.
- **객체 단위 소유권 검증**: 식별자로 조회하는 모든 요청에서 소유자 확인. 타인 객체와 존재하지 않는 객체를 똑같이 **404**로 응답해 존재 여부를 노출하지 않고, 실제 사유는 감사로그에 기록. 목록 조회는 조건 자체를 소유자로 한정.
- **관리자 권한과 데이터 열람 권한 분리**: `system_admin`은 계정·역할을 관리하지만 개인정보 원문을 볼 수 없음. `pii:read`는 어떤 역할에도 없고 `privacy_officer`가 타인에게만 별도 부여(자기 부여 금지, 보호 역할 부여·자기 역할 변경 금지). 긴급 열람(break-glass)은 사유 필수·대상 1명·최대 1시간·전 과정 감사로그.
- **최소 필드 반환 API**: 응답 모델을 허용 목록으로 정의하고 변환 함수에서 필드를 명시적으로 선택. 테스트로 `password_hash`, 주민등록번호, 내부 메모, 배송지 등이 어떤 응답에도 나오지 않음을 회귀 검사.
- **개인정보 로그 마스킹**: 이메일, 휴대전화(010-xxxx-xxxx), 주민등록번호, 카드번호, Bearer/JWT 토큰 마스킹. 메시지 인자, 구조화 필드(중첩 포함), 민감 키(`password`, `token` 등), 예외 트레이스까지 처리.
- **감사로그 기록**: 누가/언제/무엇을/누구의 정보에/어떤 행위를/왜. append-only, 해시 체인(선택적 HMAC)으로 변조·삭제 탐지 `verify()`. 감사로그 자체의 개인정보도 마스킹.
- **보존기간 만료 데이터 삭제**: 기록 유형별 보존 규칙과 근거, 처리 목적 종료 시점부터 기간 계산, 법정 보존 대상은 분리보관 저장소로 이동(목적 외 열람 차단), 주입 가능한 시계로 테스트하는 멱등 파기 배치, 규칙 없는 유형은 "미분류"로 보고.
- **개인정보 내보내기 및 삭제 요청 처리**: 본인 데이터 JSON 내보내기, 삭제 요청 시 운영 데이터 파기 + 법정 보존 대상 최소 항목만 분리보관 + 계정 파기 + 세션 전부 폐기 + 감사로그, 처리 결과 보고서 반환.
- **외부 LLM 전송 데이터 필터링**: 허용 목록 필드만 선택 → 텍스트 내 개인정보를 `[EMAIL]` 등 토큰으로 치환 → 최종 프롬프트 재검사 후 남아 있으면 전송 차단(fail closed). 테스트에서 가짜 LLM 클라이언트가 받은 프롬프트에 개인정보가 없음을 확인.
- **세션·인증정보 보안**: scrypt 비밀번호 해시(솔트·파라미터 저장·재해시), 상수 시간 비교, 계정 존재 여부를 드러내지 않는 로그인 실패 처리, 세션 ID 해시 저장, 유휴/절대 타임아웃, 로그인 시 세션 재발급, `__Host-` 쿠키 + HttpOnly/Secure/SameSite.

## 실행 방법

### Python (FastAPI)

Python 3.12 이상과 [uv](https://docs.astral.sh/uv/)가 필요합니다. uv가 필요한 Python 버전을 자동으로 받아옵니다.

```bash
cd examples/python-fastapi
uv sync
uv run pytest -q
```

앱을 직접 띄워 보려면(선택): `uv run --with uvicorn uvicorn kr_privacy_examples.app:app --reload`
세션 쿠키에 `Secure` 플래그가 있으므로 브라우저에서는 HTTPS 환경이 필요합니다. 데모 계정은 `app.py`의 `seed_demo_data()`를 참고하세요.

### TypeScript (Node)

Node.js 20 이상이 필요합니다. 웹 프레임워크 없이 순수 함수로 구현했습니다.

```bash
cd examples/typescript
npm install
npm test             # vitest run
npx tsc --noEmit     # 타입 검사
```

## 운영 적용 시 추가로 고려할 것

- 인메모리 저장소 → 실제 DB, 감사로그는 별도 저장소(WORM 등)와 HMAC 키의 KMS 보관
- 백업·복제본·캐시·검색 인덱스·로그 수집 파이프라인까지 포함한 파기
- 로그인 시도 제한, 다중 인증(MFA), CSRF 토큰(SameSite만으로 부족한 경우)
- 외부 LLM 사용 시 처리위탁·국외이전 고지, 학습 사용 여부 계약 확인
- 정보주체 요청의 본인 확인·대리인 위임 확인 절차와 처리 기한 관리
