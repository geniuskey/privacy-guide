---
title: 개인정보 처리방침 — 코드와 동기화되는 문서로 만들기
description: 개인정보 보호법 제30조와 시행령 제31조의 처리방침 필수 기재사항과 공개 방법을 정리하고, 필드 레지스트리에서 처리방침 초안을 생성해 코드와 문서가 어긋나지 않게 하는 방법을 설명합니다.
category: collection-consent
status: review-required
lastVerified: 2026-10-23
tags: [처리방침, 개인정보 처리방침, 필드 레지스트리, 동의, 공개, 위탁]
related: [collection-consent/lawful-basis, collection-consent/consent-ui, data-sharing/provision-vs-outsourcing, data-sharing/cross-border-transfer, storage-retention/retention-destruction, sensitive-data/pseudonymization]
sources: [pipa, pipa-decree, pipc-privacy-policy-guide, pipc-integrated-guide]
legalBasis:
  - source: pipa
    article: 제30조제1항
    kind: law
    summary: 처리방침 필수 기재사항(처리 목적, 처리·보유 기간, 제3자 제공, 파기 절차·방법, 민감정보 공개 가능성, 위탁, 가명정보, 권리·행사방법, 보호책임자 연락처, 자동 수집 장치, 대통령령 사항)
    status: verified
  - source: pipa
    article: 제30조제2항·제3항
    kind: law
    summary: 수립·변경 시 대통령령 방법으로 공개. 처리방침과 계약 내용이 다르면 정보주체에게 유리한 것을 적용
    status: verified
  - source: pipa
    article: 제30조제4항, 제30조의2
    kind: law
    summary: 보호위원회는 작성지침을 정해 준수를 권장할 수 있고, 처리방침의 적정성·이해 용이성·공개 방법을 평가해 개선을 권고할 수 있음
    status: verified
  - source: pipa-decree
    article: 제31조
    kind: decree
    summary: 추가 기재사항(처리 항목, 국외 이전 근거와 사항, 안전성 확보 조치, 국외에서 직접 수집 시 국가명)과 홈페이지 지속 게재, 게재 불가 시 대체 공개 방법
    status: verified
  - source: pipa
    article: 제22조제3항
    kind: law
    summary: 동의 없이 처리하는 개인정보의 항목과 법적 근거를 동의 기반 정보와 구분하여 처리방침으로 공개할 수 있음
    status: verified
  - source: pipa-decree
    article: 제14조의2제2항
    kind: decree
    summary: 추가적인 이용·제공이 지속적으로 발생하면 판단 기준을 처리방침에 공개하고 보호책임자가 점검
    status: verified
  - source: pipa-decree
    article: 제28조제2항
    kind: decree
    summary: 위탁하는 업무 내용과 수탁자를 홈페이지에 지속적으로 게재
    status: verified
  - source: pipc-privacy-policy-guide
    kind: guide
    summary: 2026 개인정보 처리방침 작성지침 — 목차, 표기 방식, 라벨링 등 권장 작성 방법(원문 대조 필요)
    status: review-required
---

## 한 문장 결론

처리방침은 법무팀이 따로 쓰는 문서가 아니라 **시스템이 실제로 처리하는 필드·목적·근거·보유기간·수탁자·국외 이전의 공개본**이므로, 코드의 필드 레지스트리에서 생성하거나 최소한 CI에서 대조해야 하고, 문서와 계약 내용이 다르면 **정보주체에게 유리한 쪽이 적용**됩니다(제30조제3항).

## 적용 조건과 예외

- 모든 개인정보처리자가 처리방침을 정해야 합니다(제30조제1항). 공공기관은 제32조에 따라 등록대상이 되는 개인정보파일에 대해 정합니다.
- 제58조제3항: 동창회·동호회 등 친목 단체 운영을 위한 처리에는 제30조가 적용되지 않습니다.
- "해당되는 경우에만 정한다"고 된 항목(제3자 제공, 민감정보 공개 가능성, 위탁, 가명정보, 자동 수집 장치)은 해당 처리가 없으면 생략할 수 있습니다. 다만 **실제로 하고 있는데 빠뜨리는 것**이 흔한 오류입니다.

## 실제 법적 근거

### 필수 기재사항 (제30조제1항 + 시행령 제31조제1항)

| 근거 | 기재사항 | 코드에서 가져올 곳 |
| --- | --- | --- |
| 법 제30조제1항제1호 | 처리 목적 | `FieldPolicy.purpose` |
| 제2호 | 처리 및 보유 기간 | `FieldPolicy.retention` |
| 제3호 | 제3자 제공(해당 시) | 제공 레지스트리(제공받는 자, 목적, 항목, 기간) |
| 제3호의2 | 파기 절차·방법, 다른 법령에 따라 보존 시 보존근거와 항목 | 파기 배치 설정, 보존 홀드 레지스트리 |
| 제3호의3 | 제23조제3항 민감정보 공개 가능성과 비공개 선택 방법(해당 시) | 공개 프로필 설정 |
| 제4호 | 처리 위탁(해당 시) | 수탁자 레지스트리(클라우드, 메일 발송, 결제대행) |
| 제4호의2 | 가명정보 처리(해당 시) | 가명처리 작업 목록 |
| 제5호 | 정보주체·법정대리인의 권리·의무와 행사방법 | 권리행사 API·화면 경로 |
| 제6호 | 보호책임자 성명 또는 담당 부서명·전화번호 등 연락처 | 설정값 |
| 제7호 | 쿠키 등 자동 수집 장치의 설치·운영과 거부 방법(해당 시) | 쿠키·SDK 목록 |
| 제8호 → 영 제31조제1항제1호 | 처리하는 개인정보의 항목 | 필드 레지스트리 |
| 영 제31조제1항제2호 | 국외 이전 시 근거와 제28조의8제2항 사항(항목, 국가·시기·방법, 이전받는 자, 목적·기간, 거부 방법) | 국외 이전 레지스트리 |
| 영 제31조제1항제3호 | 시행령 제30조 안전성 확보 조치 | 보안 통제 목록 |
| 영 제31조제1항제4호 | 국외에서 국내 정보주체 정보를 직접 수집·처리하는 경우 처리 국가명 | 인프라 리전 |

처리방침에 공개할 수 있거나 공개해야 하는 다른 항목:

- 제22조제3항: 동의 없이 처리하는 정보의 항목과 법적 근거를 **동의 기반 정보와 구분하여** 공개
- 시행령 제14조의2제2항: 추가적인 이용·제공이 **지속적으로** 발생하면 판단 기준 공개
- 자동화된 결정을 하는 경우 시행령 제44조의4의 공개 사항은 "인터넷 홈페이지 등"을 통해 공개해야 하며, 처리방침에 함께 둘지는 작성지침 확인이 필요합니다(`review-required`).

### 공개 방법 (제30조제2항, 시행령 제31조제2항·제3항)

- 원칙: 처리자의 **인터넷 홈페이지에 지속적으로 게재**.
- 홈페이지에 게재할 수 없는 경우: 사업장 게시, 관보(공공기관)·신문 게재, 연 2회 이상 발행 간행물 게재, 계약서 등에 실어 발급 중 하나 이상.

### 평가와 작성지침

- 제30조제4항: 보호위원회는 **작성지침**을 정해 준수를 권장할 수 있습니다. 2026 작성지침은 권고이며, 그 세부 내용(목차·라벨 등)은 이 사이트에서 원문 대조 전입니다(`review-required`).
- 제30조의2: 보호위원회는 기재사항의 적정성, 알기 쉬운 작성, 쉬운 확인 방법 공개를 평가하고 개선을 권고할 수 있습니다. 평가 대상 선정 시 민감정보·고유식별정보 처리 규모, 아동·청소년 등 정보주체 특성 등을 고려합니다(시행령 제31조의2제1항).

(현행 법률 제21445호·시행령 제36671호 기준. 국가법령정보센터 원문과 대조함.)

## 개발자용 실무 해설

1. **처리방침과 코드가 어긋나는 지점은 대개 정해져 있습니다.** 새 SDK(분석·광고·크래시 리포트) 추가, 새 수탁자(SaaS) 도입, 리전 변경, 보존기간 배치 변경, 새 선택 항목 추가. 이 변경을 PR 단계에서 잡아야 합니다.
2. **"항목"은 DB 컬럼 단위가 아니라 사람이 이해하는 단위로 씁니다.** 레지스트리에는 `display_name`을 따로 두고, `phone_e164`와 `phone_verified_at`을 "휴대전화번호"로 묶는 식으로 매핑합니다.
3. **근거별로 나눠서 렌더링합니다.** 제22조제3항 때문에 "동의를 받아 처리하는 정보"와 "동의 없이 처리하는 정보(근거: 계약 이행 등)"를 구분된 표로 보여주는 것이 좋습니다.
4. **버전을 남깁니다.** 처리방침은 변경 이력과 이전 버전을 열람할 수 있게 하는 것이 일반적인 관행입니다(작성지침 확인 필요, `review-required`). 생성 결과를 Git에 커밋하면 변경 diff가 자동으로 남습니다.
5. **계약(약관)과 일치시킵니다.** 제30조제3항: 처리방침과 계약 내용이 다르면 정보주체에게 유리한 것이 적용됩니다. 약관의 보유기간이 처리방침보다 짧다면 짧은 쪽이 적용될 수 있으니 한 소스에서 생성하세요.

## 권장 설계

```text
privacy/registry/
├─ fields.yaml          항목·목적·근거·보유기간·민감도   (법 제30조제1항제1·2호, 영 제31조제1항제1호)
├─ processors.yaml      수탁자·위탁 업무               (제4호, 영 제28조제2항)
├─ recipients.yaml      제3자 제공                     (제3호)
├─ transfers.yaml       국외 이전                      (영 제31조제1항제2호)
├─ cookies.yaml         자동 수집 장치                 (제7호)
├─ safeguards.yaml      안전성 확보 조치               (영 제31조제1항제3호)
└─ contact.yaml         보호책임자·담당부서            (제6호)
        │
        ▼  scripts/render_policy.py  (CI에서 실행)
docs/privacy-policy/2026-10-23.md   ← 법무 검토 후 게시
```

- CI 규칙 예: 모델에 새 개인정보 필드가 추가됐는데 `fields.yaml`에 없으면 실패, `package.json`/`requirements.txt`에 등록된 분석 SDK가 `cookies.yaml`·`processors.yaml`에 없으면 경고.
- 생성 결과는 **초안**입니다. 게시 전에 법무 검토를 거치고, 표현은 작성지침에 맞춰 다듬습니다.

## 위험한 설계

- 다른 회사 처리방침을 복사해 회사명만 바꿈 — 실제 처리와 다를 가능성이 높습니다
- "서비스 개선 등"처럼 모든 목적을 포괄하는 문구
- 수탁자 목록을 "○○ 등"으로 생략
- 해외 리전 사용 사실 누락(영 제31조제1항제2호·제4호)
- 처리방침 링크를 로그인 후 설정 메뉴 깊숙이 배치 — "지속적으로 게재"와 "쉽게 확인" 취지에 어긋납니다
- 이전 버전을 덮어써서 언제 무엇이 바뀌었는지 확인 불가

## Python/TypeScript 구현 예제

```python
# 필드 레지스트리에서 처리방침 표를 생성하고, 모델 필드와 레지스트리를 대조한다
from dataclasses import dataclass

@dataclass(frozen=True)
class Field:
    name: str
    display: str
    purpose: str
    basis: str        # "동의" | "계약 이행(제15조제1항제4호)" | ...
    retention: str

FIELDS = [
    Field("email", "이메일", "계정 생성·로그인", "계약 이행(제15조제1항제4호)", "탈퇴 시까지"),
    Field("interests", "관심사", "맞춤 추천", "동의(제15조제1항제1호)", "동의 철회 또는 탈퇴 시까지"),
]

def render_items_table(fields: list[Field]) -> str:
    consent = [f for f in fields if f.basis.startswith("동의")]
    other = [f for f in fields if not f.basis.startswith("동의")]
    out = []
    for title, group in (("동의를 받아 처리하는 정보", consent),
                         ("동의 없이 처리하는 정보 (제22조제3항)", other)):
        out.append(f"### {title}\n\n| 항목 | 목적 | 근거 | 보유기간 |\n|---|---|---|---|")
        out += [f"| {f.display} | {f.purpose} | {f.basis} | {f.retention} |" for f in group]
        out.append("")
    return "\n".join(out)

def assert_registry_covers(model_fields: set[str]) -> None:
    missing = model_fields - {f.name for f in FIELDS}
    if missing:
        raise AssertionError(f"처리방침 레지스트리에 없는 필드: {sorted(missing)}")
```

```ts
// 의존성 목록에 있는 SDK가 처리방침 레지스트리에 등록되어 있는지 확인하는 CI 스크립트 조각
import { readFileSync } from 'node:fs';

const TRACKED_SDKS = ['@sentry/browser', 'mixpanel-browser', '@amplitude/analytics-browser'];

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
const registered: string[] = JSON.parse(readFileSync('privacy/registry/processors.json', 'utf8'))
  .map((p: { sdk?: string }) => p.sdk)
  .filter(Boolean);

const unregistered = deps.filter((d) => TRACKED_SDKS.includes(d) && !registered.includes(d));
if (unregistered.length) {
  console.error(`처리방침(위탁·자동 수집 장치)에 없는 SDK: ${unregistered.join(', ')}`);
  process.exit(1);
}
```

전체 실행 가능한 예제는 [구현 예제](/tools/examples/)를 참고하세요.

## 개발 체크리스트

- [ ] 처리방침이 제30조제1항 각 호와 시행령 제31조제1항 각 호를 모두 다룬다(해당 없는 항목은 이유 확인)
- [ ] 항목·목적·보유기간이 코드의 필드 레지스트리와 일치한다(CI 검사)
- [ ] 동의 기반 정보와 동의 없이 처리하는 정보가 근거와 함께 구분되어 있다
- [ ] 수탁자, 제3자 제공, 국외 이전, 처리 국가가 실제 인프라와 일치한다
- [ ] 쿠키·SDK 등 자동 수집 장치와 거부 방법이 적혀 있다
- [ ] 홈페이지에서 쉽게 찾을 수 있는 위치에 지속 게재되고 이전 버전을 확인할 수 있다
- [ ] 약관과 처리방침의 보유기간·목적이 서로 충돌하지 않는다
- [ ] 2026 작성지침의 목차·표기 권고를 반영했는지 법무 검토를 받았다 (`review-required`)

## 공식 원문 링크와 확인일

아래 "근거 구분표"와 "공식 원문 링크"를 참고하세요. 법률 제22조·제30조·제30조의2와 시행령 제14조의2·제28조·제31조·제31조의2는 2026-10-23에 국가법령정보센터 Open API 현행본과 대조했습니다. 2026 개인정보 처리방침 작성지침의 세부 권고는 원문 대조 전이라 `review-required`입니다.
