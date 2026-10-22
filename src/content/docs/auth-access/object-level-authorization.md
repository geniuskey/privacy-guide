---
title: 객체 단위 소유권 검증 — IDOR/BOLA 막기
description: 로그인 여부만이 아니라 요청한 객체마다 소유권·권한을 서버에서 확인해야 하는 이유와, FastAPI·TypeScript 구현 및 테스트 패턴을 정리합니다.
category: auth-access
status: review-required
lastVerified: 2026-10-23
tags: [접근권한, IDOR, BOLA, 소유권검증, API보안]
related: [auth-access/access-control, auth-access/authentication-session, app-security/minimal-response, app-security/owasp-asvs-mapping, storage-retention/breach-response]
sources: [pipa, pipa-decree, safety-notice, owasp-asvs-5]
legalBasis:
  - source: pipa
    article: 제29조
    kind: law
    summary: 개인정보가 유출등이 되지 않도록 안전성 확보에 필요한 기술적·관리적·물리적 조치
    status: verified
  - source: pipa-decree
    article: 제30조제1항제2호다목, 제3호다목
    kind: decree
    summary: 그 밖에 개인정보에 대한 접근 권한을 제한하고 접근을 통제하기 위하여 필요한 조치
    status: verified
  - source: safety-notice
    article: 제5조제1항
    kind: notice
    summary: 접근 권한을 업무 수행에 필요한 최소한의 범위로 차등 부여
    status: verified
  - source: safety-notice
    article: 제6조제3항
    kind: notice
    summary: 처리하는 개인정보가 인터넷 홈페이지 등을 통하여 권한이 없는 자에게 공개되거나 유출되지 않도록 개인정보처리시스템 등에 조치
    status: verified
  - source: pipa
    article: 제34조제1항
    kind: law
    summary: 유출등이 되었음을 알게 되었을 때 지체 없이 정보주체에게 통지 (IDOR로 타인 정보가 노출된 경우 유출등에 해당하는지 검토 필요)
    status: verified
  - source: owasp-asvs-5
    article: V8 Authorization
    kind: standard
    summary: 데이터 객체 단위 접근 제어(객체 소유권·관계 검증)를 서버 측 신뢰 계층에서 수행
    status: verified
  - source: owasp-asvs-5
    article: V4 API and Web Service
    kind: standard
    summary: API 엔드포인트별 접근 제어와 응답 데이터 범위 검증
    status: verified
---

## 한 문장 결론

`GET /orders/{id}`처럼 식별자로 객체를 가져오는 모든 API는 **요청자가 그 객체에 접근할 권한이 있는지를 서버에서, 객체마다** 확인해야 합니다. 이 검증이 빠지면 로그인한 사용자 누구나 ID만 바꿔 타인의 개인정보를 볼 수 있고, 이는 고시 제6조제3항이 막으라고 한 "권한이 없는 자에게 공개" 상태가 됩니다.

## 적용 조건과 예외

| 상황 | 검증 기준 |
| --- | --- |
| 회원이 자기 주문·주소·문의를 조회 | `resource.owner_id == session.user_id` |
| 팀/조직 단위 리소스 (B2B, 사내 도구) | 요청자가 리소스의 조직에 속하고 역할이 허용하는지 |
| CS 상담원이 고객 정보를 조회 | 배정된 티켓의 고객인지, 또는 열람 사유가 기록되었는지 → [관리자 권한 분리](/internal-admin/admin-vs-data-access/) |
| 파일 다운로드 (첨부, 증빙) | 파일 메타데이터의 소유자·연결 객체로 다시 검증. 추측 불가능한 URL만으로 대체하지 않음 |
| 공개가 의도된 객체 (공개 프로필) | 공개 필드만 반환하는 별도 표현(DTO)을 사용 → [최소 필드 응답](/app-security/minimal-response/) |

경계:

- 법령은 "IDOR"이나 "객체 단위 검증"이라는 용어를 쓰지 않습니다. 법적 근거는 **제29조의 안전조치 의무**와 고시 **제5조제1항(최소 범위 차등 부여)**, **제6조제3항(권한 없는 자에게 공개·유출 방지)** 에 있고, 구체적 기법은 OWASP ASVS V8의 기술 표준입니다.
- IDOR로 타인 정보가 실제로 노출되었다면 **제34조의 유출등 통지·신고** 대상인지 판단해야 합니다. 판단 기준은 법무·보안 검토가 필요합니다(`review-required`). → [유출 대응](/storage-retention/breach-response/)

## 실제 법적 근거

- 「개인정보 보호법」 제29조: 개인정보가 유출등이 되지 아니하도록 안전성 확보에 필요한 기술적·관리적·물리적 조치를 해야 합니다.
- 시행령 제30조제1항제2호(접근 권한 제한 조치)와 제3호(접근 통제 조치). 각 호 다목은 "그 밖에 ... 필요한 조치"로, 열거된 조치 외에도 필요한 통제를 하도록 합니다.
- 안전성 확보조치 기준 제5조제1항: 접근 권한을 업무 수행에 필요한 최소한의 범위로 차등 부여합니다.
- 같은 기준 제6조제3항: 처리하는 개인정보가 인터넷 홈페이지, P2P, 공유설정 등을 통하여 권한이 없는 자에게 공개되거나 유출되지 않도록 개인정보처리시스템, 취급자의 컴퓨터 및 모바일 기기 등에 조치를 해야 합니다.
- 같은 법 제34조제1항: 유출등이 되었음을 알게 되었을 때 지체 없이 정보주체에게 항목, 시점·경위 등을 알려야 합니다.

(2026-10-23 국가법령정보센터 원문 대조.)

## 개발자용 실무 해설

1. **인증과 인가는 다른 단계입니다.** 미들웨어가 "로그인했는가"를 확인해도 "이 객체가 당신 것인가"는 확인하지 않습니다. 대부분의 IDOR는 이 두 번째 검사가 빠져서 생깁니다.
2. **쿼리에 소유 조건을 넣는 것이 가장 단단합니다.** `SELECT ... WHERE id = ? AND owner_id = ?`처럼 조회 자체에 범위를 넣으면, 핸들러에서 검사를 잊어도 데이터가 나가지 않습니다. 저장소 계층에 "스코프된 조회" 함수만 노출하세요.
3. **UUID는 통제가 아닙니다.** 추측하기 어려운 ID는 열거 공격을 늦출 뿐, 링크가 공유되거나 로그에 찍히면 그대로 노출됩니다. 소유권 검증과 함께 쓰세요.
4. **404와 403을 일관되게 씁니다.** 타인 객체 요청에 404를 반환하면 존재 여부를 숨길 수 있습니다. 어떤 방식을 택하든 엔드포인트 전체에 일관되게 적용합니다.
5. **목록·검색·내보내기도 같은 검증을 탑니다.** 단건 조회만 막고 `GET /orders?user_id=...`나 CSV 내보내기에서 필터를 클라이언트 값으로 받으면 같은 취약점이 됩니다. → [데이터 공개와 다운로드](/data-sharing/public-data-and-downloads/)
6. **쓰기 작업이 더 위험합니다.** `PATCH /users/{id}`, `DELETE /addresses/{id}`에서 소유권 검증이 빠지면 노출을 넘어 위조·변조(제29조가 막으라는 "유출등"의 일부)가 됩니다.

## 권장 설계

```text
HTTP handler
   │  user = authenticate(request)            ← 인증 (V6/V7)
   ▼
Service: get_order(user, order_id)
   │  repo.find_order_for(user, order_id)     ← 소유 조건이 쿼리에 포함 (V8)
   │  None → 404
   ▼
DTO: OrderView (역할별 필드만)               ← 최소 응답 (V4, V14)
```

- 저장소 계층은 `find_by_id(id)` 대신 `find_for(actor, id)`만 공개합니다.
- 멀티테넌트 서비스는 테넌트 ID를 세션에서 가져오고 요청 본문·쿼리의 테넌트 값은 무시합니다. 가능하면 DB 행 수준 보안(RLS)을 함께 씁니다.
- 직원의 고객 정보 조회는 "배정 관계" 또는 "사유 입력 + 감사로그"를 거치게 합니다.
- 거부된 접근 시도를 로그로 남기고, 짧은 시간에 여러 ID를 시도하는 패턴을 탐지합니다(고시 제6조제1항제2호의 유출 시도 탐지와 연결).

## 위험한 설계

- `GET /api/users/{id}`가 세션 사용자와 `id`를 비교하지 않음
- 요청 본문의 `user_id`, `tenant_id`, `role`을 신뢰
- 프론트엔드가 자기 데이터만 요청하니 서버 검증이 불필요하다는 가정
- GraphQL 리졸버에서 최상위 쿼리만 검증하고 중첩 필드(`order { customer { phone } }`)는 검증하지 않음
- 순차 증가 정수 ID + 소유권 검증 없음 (전체 열거 가능)
- 파일 저장소의 공개 버킷 URL을 그대로 응답에 넣음 (고시 제6조제3항)

## Python/TypeScript 구현 예제

```python
# FastAPI: 소유 조건을 쿼리에 넣은 스코프 조회 + 404 일관 응답
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter()

def find_order_for(db: Session, actor, order_id: str):
    stmt = select(Order).where(Order.id == order_id)
    if "order:read_any" not in actor.permissions:     # 일반 회원
        stmt = stmt.where(Order.owner_id == actor.id)
    return db.scalars(stmt).first()

@router.get("/orders/{order_id}")
def get_order(order_id: str, actor=Depends(current_user), db: Session = Depends(get_db)):
    order = find_order_for(db, actor, order_id)
    if order is None:
        raise HTTPException(404)        # 타인 객체와 없는 객체를 구분하지 않는다
    return OrderView.from_model(order)  # 필요한 필드만

# pytest: 두 사용자를 만들어 교차 접근을 반드시 시험한다
def test_user_cannot_read_others_order(client, make_user, make_order):
    alice, bob = make_user(), make_user()
    order = make_order(owner=alice)
    res = client.get(f"/orders/{order.id}", headers=bob.auth_headers)
    assert res.status_code == 404
```

```ts
// TypeScript: 리소스 정책을 한곳에 모으고 모든 핸들러가 이를 거치게 한다
type Actor = { id: string; tenantId: string; permissions: Set<string> };
type Resource = { ownerId: string; tenantId: string };

export function canAccess(actor: Actor, res: Resource, action: 'read' | 'write'): boolean {
  if (res.tenantId !== actor.tenantId) return false;          // 테넌트 경계 우선
  if (res.ownerId === actor.id) return true;                   // 소유자
  return actor.permissions.has(`order:${action}_any`);         // 명시적 위임 권한
}

// 핸들러
const order = await repo.findById(params.id);
if (!order || !canAccess(actor, order, 'read')) return reply.code(404).send();
return toOrderView(order);
```

전체 실행 가능한 예제와 테스트는 [구현 예제](/tools/examples/)를 참고하세요.

## 개발 체크리스트

- [ ] 경로·쿼리·본문으로 객체 ID를 받는 모든 엔드포인트가 소유권 또는 관계를 서버에서 검증한다
- [ ] 저장소 계층이 스코프 없는 `find_by_id`를 외부에 노출하지 않는다
- [ ] 테넌트·사용자 식별자는 세션에서만 가져온다
- [ ] 목록, 검색, 내보내기, 파일 다운로드, GraphQL 중첩 필드도 같은 정책을 탄다
- [ ] "사용자 A가 사용자 B의 객체를 읽기·수정·삭제" 교차 테스트가 엔드포인트마다 있다
- [ ] 거부된 접근이 로그로 남고 다수 ID 시도 탐지 규칙이 있다
- [ ] 노출 사고 시 유출등 통지 여부 판단 절차가 정해져 있다 (`review-required`)

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 법률·시행령·고시 조문은 2026-10-23 원문과 대조했습니다. OWASP ASVS는 장 단위로만 인용했으며 세부 요구사항 번호는 원문 대조 후 추가합니다.
