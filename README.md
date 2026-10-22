# Korea Privacy Dev Guide

한국에서 사내 시스템과 웹 서비스를 만드는 개발자를 위한 **개인정보 보호법·정보보안 실무 가이드**입니다. 개인정보 보호법, 정보보안, 접근권한, 민감정보, 데이터 공개, 생성형 AI 활용을 한곳에 정리하고, 자가진단 도구, 실행 가능한 코드 예제, AI 에이전트용 검토 Skill을 함께 제공합니다.

- 사이트: https://geniuskey.github.io/privacy-guide/ (커스텀 도메인 예정: `privacy.euiyun.com`)
- 기준 법령: 「개인정보 보호법」 법률 제21445호(2026.9.11. 시행), 시행령 대통령령 제36671호, 「개인정보의 안전성 확보조치 기준」 고시 제2026-9호. 원문은 2026-10-23에 국가법령정보센터 Open API로 확인했습니다.

> [!IMPORTANT]
> 이 프로젝트는 법률 자문이 아닙니다. 모든 문서는 현재 법률 전문가 검토 전(`review-required`) 상태입니다. 문서마다 표시된 근거 종류와 공식 원문 확인일을 확인하세요.

## 구성

```text
.
├─ src/content/docs/        # 문서 (Markdown/MDX). 10개 카테고리 + 시작하기·도구·프로젝트 정보
├─ src/components/          # 자가진단(React island), Starlight 오버라이드(상태·근거표·관련 문서)
├─ src/lib/                 # 콘텐츠 모델, 자가진단 규칙 엔진, 관련 문서 계산
├─ data/sources.json        # 공식 출처 레지스트리 (버전·시행일·확인일·감지 설정)
├─ data/law-snapshots/      # 법령 조문 단위 스냅샷 (변경 감지 기준)
├─ examples/                # FastAPI·TypeScript 구현 예제와 테스트
├─ skills/kr-privacy-review # AI 개발 에이전트용 Skill (원문 발췌 포함)
├─ scripts/                 # 콘텐츠 검사, 출처 변경 감지, 이슈 생성
└─ .github/workflows/       # 배포, CI, 출처 변경 감지, 외부 링크 점검
```

## 개발

```bash
npm ci
npm run dev               # http://localhost:4321/privacy-guide/
npm run validate:content  # frontmatter·필수 섹션·출처·내부 링크 검사
npm test                  # 자가진단 규칙·관련 문서 로직 테스트
npm run build             # 정적 사이트 + Pagefind 검색 인덱스

# 예제
(cd examples/python-fastapi && uv run pytest -q)
(cd examples/typescript && npm ci && npm test)

# 공식 출처 변경 감지 (국가법령정보 공동활용 인증키 필요)
LAW_OC=<인증키> npm run watch:sources

# 외부 링크 점검 (출처 레지스트리·문서·Skill)
npm run check:links
```

## 배포

`main`에 푸시하면 GitHub Actions가 검사·테스트·빌드 후 GitHub Pages에 배포합니다.

1. 저장소 Settings → Pages → Source를 **GitHub Actions**로 설정
2. (선택) 커스텀 도메인: Settings → Pages에 `privacy.euiyun.com`을 등록하고 DNS CNAME을 `geniuskey.github.io`로 설정한 뒤, 저장소 Variables에 `SITE_URL=https://privacy.euiyun.com`, `BASE_PATH=/`를 추가
3. (선택) 출처 변경 감지: 저장소 Secret `LAW_OC`에 국가법령정보 공동활용 인증키 등록

## 원칙

- 외부 광고·분석 추적 스크립트를 쓰지 않습니다.
- 자가진단 입력값은 브라우저 안에서만 계산하며 서버로 보내거나 저장하지 않습니다.
- 법률상 의무, 행정기관 권고, 기술 표준, 프로젝트 권장사항을 구분해 표시합니다.
- 공식 원문으로 확인하지 못한 내용은 `review-required`로 남깁니다.

## 라이선스

- 코드(사이트, 예제, 스크립트, Skill): MIT
- 문서 콘텐츠: CC BY 4.0
- 법령 원문 발췌는 저작권법 제7조에 따른 비보호저작물입니다.
