---
title: 최소 필드 반환 API — 응답 DTO 허용목록과 과다 노출 방지
description: 개인정보 보호법 제3조·제16조의 최소 처리 원칙과 안전성 확보조치 기준 제12조의 출력 항목 최소화를 응답 DTO 허용목록, GraphQL·ORM 과다 노출 방지 설계로 옮깁니다.
category: app-security
status: review-required
lastVerified: 2026-10-23
tags: [최소수집, API, 응답필드, 과다노출, 접근권한, OWASP]
related: [auth-access/object-level-authorization, auth-access/access-control, app-security/log-masking, data-sharing/public-data-and-downloads]
sources: [pipa, safety-notice, owasp-asvs-5]
legalBasis:
  - source: pipa
    article: 제3조제1항, 제2항, 제6항
    kind: law
    summary: 목적에 필요한 범위에서 최소한의 개인정보만 수집, 목적에 필요한 범위에서 적합하게 처리, 사생활 침해를 최소화하는 방법으로 처리
    status: verified
  - source: pipa
    article: 제16조제1항
    kind: law
    summary: 목적에 필요한 최소한의 개인정보를 수집해야 하고 최소 수집의 입증책임은 개인정보처리자가 부담
    status: verified
  - source: safety-notice
    article: 제12조제1항
    kind: notice
    summary: 개인정보처리시스템에서 개인정보 출력 시(인쇄, 화면표시, 파일생성 등) 용도를 특정하고 용도에 따라 출력 항목을 최소화
    status: verified
  - source: safety-notice
    article: 제5조제1항
    kind: notice
    summary: 개인정보처리시스템 접근 권한을 업무 수행에 필요한 최소한의 범위로 차등 부여
    status: verified
  - source: owasp-asvs-5
    article: V4 API and Web Service, V8 Authorization, V14 Data Protection
    kind: standard
    summary: API 응답 구조, 필드 수준 권한, 민감 데이터 노출 최소화에 관한 검증 요구사항(장 단위, 세부 번호는 원문 확인 필요)
    status: verified
  - source: project
    kind: best-practice
    summary: 응답 DTO 허용목록, GraphQL 필드 권한, ORM 엔터티 직접 직렬화 금지는 이 프로젝트의 권장사항이며 법적 의무로 명시된 것은 아님
    status: review-required
---

## 한 문장 결론

API는 **엔터티를 통째로 직렬화하지 말고, 화면·용도별로 정의한 응답 DTO의 허용목록 필드만** 반환해야 합니다. 프런트엔드에서 숨기는 것은 최소화가 아닙니다. 응답 본문에 담긴 순간 이미 출력된 것입니다.

## 적용 조건과 예외

| 상황 | 검토 포인트 | 근거 구분 |
| --- | --- | --- |
| 회원 본인 프로필 API | 본인에게도 필요한 필드만. 비밀번호 해시, 내부 플래그, 다른 시스템 ID는 제외 | 법 제3조 (원칙) |
| 관리자 목록·검색 화면 | 목록은 마스킹·요약 필드, 상세 조회는 사유와 권한이 있을 때만 | 고시 제12조제1항 (출력 항목 최소화), 제5조제1항 |
| 공개 API·다른 사용자 프로필 | 닉네임 등 공개 동의된 항목만 | 법 제3조, 제17조 검토 |
| 파일 다운로드(엑셀/CSV) | 용도별 컬럼 세트를 고정, 전체 컬럼 다운로드 금지 | 고시 제12조제1항 ("파일생성") |
| 내부 서비스 간 API | 호출 서비스의 목적에 맞는 필드 세트 | 법 제3조제2항 |
| 로그·APM 전송 | 응답 본문 전체를 남기지 않음 | → [로그 마스킹](/app-security/log-masking/) |

경계:

- 법 제3조와 제16조는 **원칙과 수집 단계의 최소화**를 규정합니다. "API 응답 필드 수"를 직접 규정한 조문은 없습니다. 다만 고시 제12조제1항은 **화면표시와 파일생성을 포함한 출력**에서 용도를 특정하고 항목을 최소화하라고 명시하므로, 개인정보처리시스템(관리자 화면 등)의 출력에는 직접 적용되는 기준으로 볼 수 있습니다. 일반 사용자용 API에 어디까지 적용되는지는 해석이 필요합니다(`review-required`).
- 응답 DTO 허용목록, GraphQL 필드 권한 같은 구현 방식은 OWASP ASVS와 이 프로젝트의 권장사항이며 법적 의무가 아닙니다.

## 실제 법적 근거

- 「개인정보 보호법」 제3조제1항: "처리 목적을 명확하게 하여야 하고 그 목적에 필요한 범위에서 최소한의 개인정보만을 적법하고 정당하게 수집하여야 한다."
- 같은 조 제2항: "처리 목적에 필요한 범위에서 적합하게 개인정보를 처리하여야 하며, 그 목적 외의 용도로 활용하여서는 아니 된다."
- 같은 조 제6항: "정보주체의 사생활 침해를 최소화하는 방법으로 개인정보를 처리하여야 한다."
- 제16조제1항: 목적에 필요한 최소한의 개인정보를 수집해야 하며 "최소한의 개인정보 수집이라는 입증책임은 개인정보처리자가 부담한다."
- 고시 제12조제1항: "개인정보처리시스템에서 개인정보의 출력시(인쇄, 화면표시, 파일생성 등) 용도를 특정하여야 하며, 용도에 따라 출력 항목을 최소화하여야 한다."

(법률 제21445호, 고시 제2026-9호 기준. 2026-10-23 원문 대조.)

## 개발자용 실무 해설

1. **"처리"에는 출력·제공이 포함됩니다.** 법 제2조제2호의 처리 정의에는 검색, 출력, 제공, 공개가 들어 있습니다. 응답에 필드를 넣는 것은 처리입니다. 쓰지 않는 필드를 보내면 목적에 필요한 범위를 넘는 처리라는 지적을 받을 수 있습니다.
2. **ORM 엔터티 직렬화가 가장 흔한 원인입니다.** `return user`, `res.json(user)`, `model_dump()`는 컬럼이 추가될 때마다 응답도 자동으로 늘어납니다. 새 컬럼(예: `resident_no_cipher`)이 의도치 않게 외부로 나갑니다. 응답 스키마를 명시적으로 정의하고, 새 필드는 리뷰를 거쳐 허용목록에 추가합니다.
3. **차단목록(exclude)보다 허용목록(include)**: `exclude={"password_hash"}`는 새 민감 컬럼을 막지 못합니다.
4. **필드 수준 권한**: 같은 리소스라도 역할에 따라 필드 세트가 다릅니다(ASVS V8 권고). 상담원은 전화번호 뒷자리 마스킹, 배송 담당은 주소만, 정산 담당은 계좌만. 권한 판단은 서버에서 하고 응답 DTO를 역할별로 고릅니다.
5. **GraphQL**: 클라이언트가 필드를 고르므로 "요청한 것만 준다"는 착각이 생깁니다. 공격자는 모든 필드를 요청합니다. 스키마에 노출하는 필드 자체를 줄이고, 개인정보 필드에 리졸버 단위 권한 검사를 붙이며, 프로덕션 인트로스펙션 노출 여부를 검토합니다.
6. **중첩 관계(N+1 직렬화)**: `order.user.addresses[]`처럼 연관 엔터티가 따라 나오는 구조를 막기 위해 직렬화 깊이와 관계 포함을 명시적으로 지정합니다.
7. **입증책임 대비**: 응답 스키마를 OpenAPI로 관리하면 "어떤 API가 어떤 개인정보 필드를 내보내는지"를 문서로 보여줄 수 있습니다. 처리방침·데이터 매핑과 대조하기 쉽습니다.

## 권장 설계

```text
Entity (DB)                 Response DTO (용도별 허용목록)
users                       UserSelfView        : id, nickname, email, phone_masked
├─ id                       UserPublicView      : id, nickname
├─ email                    AdminListRow        : id, name_masked, phone_last4, joined_at
├─ phone                    AdminDetailView     : id, name, phone, address  (사유 입력 + 접속기록)
├─ name                     ShippingView        : name, address, phone      (배송 역할만)
├─ address
├─ password_hash   ✗ 어떤 DTO에도 없음
├─ rrn_ciphertext  ✗ 별도 복호화 API만
└─ internal_flags  ✗
```

- CI에서 OpenAPI 스키마 diff를 확인해 개인정보 태그가 붙은 필드 추가를 리뷰 대상으로 만듭니다.
- 응답 직렬화 계층에서 "DTO가 아닌 객체 반환"을 금지하는 린트 규칙을 둡니다.

## 위험한 설계

- `return db.query(User).get(id)`처럼 ORM 엔터티를 그대로 반환
- 프런트엔드에서 `display: none`이나 마스킹 처리만 하고 API는 원문 반환
- 목록 API가 상세 API와 같은 DTO를 사용해 검색 결과 수백 건에 전화번호·주소가 포함
- GraphQL에서 `User` 타입이 모든 컬럼을 노출하고 권한 검사는 쿼리 루트에서만
- `?fields=` 파라미터로 클라이언트가 임의 필드를 선택하는데 서버 허용목록이 없음
- 에러 응답에 DB 행 전체나 스택 트레이스가 포함

## Python/TypeScript 구현 예제

```python
# FastAPI + Pydantic: 역할별 응답 DTO, 엔터티 직접 반환 금지
from pydantic import BaseModel, ConfigDict

class UserPublicView(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    nickname: str

class AdminListRow(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    name_masked: str
    phone_last4: str

def mask_name(name: str) -> str:
    return name[0] + "*" * (len(name) - 1) if name else ""

@app.get("/users/{user_id}", response_model=UserPublicView)
def get_public_profile(user_id: str):
    u = repo.get_user(user_id)
    return UserPublicView(id=u.id, nickname=u.nickname)   # 허용목록 필드만 복사

@app.get("/admin/users", response_model=list[AdminListRow])
def list_users(q: str, staff=Depends(require_role("support"))):
    return [
        AdminListRow(id=u.id, name_masked=mask_name(u.name), phone_last4=u.phone[-4:])
        for u in repo.search_users(q, limit=50)
    ]
```

```ts
// GraphQL 리졸버: 개인정보 필드마다 필드 수준 권한 검사
const PII_FIELD_ROLES: Record<string, string[]> = {
  phone: ['self', 'support'],
  address: ['self', 'shipping'],
};

function guardField<T>(field: keyof typeof PII_FIELD_ROLES, resolve: (u: User) => T) {
  return (user: User, _args: unknown, ctx: { viewer: Viewer }) => {
    const roles = ctx.viewer.id === user.id ? ['self', ...ctx.viewer.roles] : ctx.viewer.roles;
    if (!PII_FIELD_ROLES[field].some((r) => roles.includes(r))) return null;
    return resolve(user);
  };
}

export const resolvers = {
  User: {
    nickname: (u: User) => u.nickname,
    phone: guardField('phone', (u) => u.phone),
    address: guardField('address', (u) => u.address),
    // passwordHash, rrnCiphertext 는 스키마에 정의하지 않는다
  },
};
```

전체 예제는 [구현 예제](/tools/examples/)를 참고하세요.

## 개발 체크리스트

- [ ] 모든 API가 명시적 응답 스키마(DTO)를 반환하고, ORM 엔터티를 직접 직렬화하지 않는다
- [ ] 응답 DTO는 허용목록 방식이며 `extra="forbid"` 또는 동등한 설정이 있다
- [ ] 목록 API와 상세 API의 필드 세트가 다르고, 목록에는 마스킹·요약 값만 있다
- [ ] 역할별 필드 세트가 서버에서 결정된다
- [ ] GraphQL 스키마에 비밀번호 해시·암호문·내부 플래그가 정의되어 있지 않고, 개인정보 필드에 리졸버 권한 검사가 있다
- [ ] 파일 다운로드 컬럼 세트가 용도별로 고정되어 있다(고시 제12조제1항)
- [ ] OpenAPI diff에서 개인정보 필드 추가가 리뷰 대상으로 표시된다
- [ ] 에러 응답에 내부 데이터나 스택 트레이스가 없다
- [ ] 일반 사용자 API에 대한 고시 제12조 적용 범위를 확인했다 (`review-required`)

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 법 제3조·제16조와 고시 제5조·제12조는 2026-10-23에 국가법령정보센터 Open API로 현행 원문을 확인했습니다. OWASP ASVS는 장 단위로만 인용했고, 구현 방식은 이 프로젝트의 권장사항입니다.
