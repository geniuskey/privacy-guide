---
title: 법령 변경 감지와 리뷰 워크플로
description: 공식 출처의 변경을 감지하고, 검토자 승인을 거쳐 콘텐츠를 갱신하는 절차
sidebar:
  order: 3
---

## 변경 감지

`.github/workflows/source-watch.yml`이 매주 `scripts/check-sources.mjs`를 실행합니다.

| 출처 종류 | 감지 방법 |
| --- | --- |
| 법률·시행령 | 국가법령정보센터 Open API(DRF)의 법령일련번호·공포번호·시행일자 비교, 조문 단위 정규화 텍스트 해시 비교 |
| 행정규칙(고시) | 같은 API의 행정규칙일련번호·발령번호·시행일자 비교, 조문 단위 해시 |
| OWASP ASVS | GitHub Releases API의 정식 버전 태그 비교 |
| 행정기관 안내서 | 공식 API가 없어 크롤링하지 않음. 확인 주기(60~90일)가 지나면 수동 확인 이슈 생성 |

- 웹 페이지 HTML 해시는 쓰지 않습니다. 광고 배너나 레이아웃 변경으로 생기는 오탐을 피하기 위해서입니다.
- 조문 텍스트는 공백과 `<개정 …>` 표기를 제거한 뒤 해시합니다.
- 공식 API 사용에는 국가법령정보 공동활용 인증키가 필요합니다. 저장소 Secret `LAW_OC`에 등록하세요. 없으면 법령 확인은 건너뜁니다.

변경이 감지되면 `source-watch`, `review-required` 라벨을 단 이슈가 생깁니다. 이슈에는 변경된 조문과, 그 조문을 `legalBasis`로 인용한 **검토가 필요한 문서** 목록이 들어갑니다.

## 리뷰 워크플로

1. 이슈 담당자가 공식 원문에서 변경 내용과 시행일을 확인합니다.
2. 영향받는 문서를 고치는 PR을 엽니다. `legalBasis[].status`, `lastVerified`, `data/sources.json`을 갱신하고 `node scripts/check-sources.mjs --update-snapshots`로 스냅샷(`data/law-snapshots/`)을, `node scripts/build-skill-references.mjs`로 Skill의 원문 발췌를 갱신합니다(둘 다 `LAW_OC` 필요).
3. CI가 `validate:content`, 테스트, 빌드를 실행합니다.
4. 검토자(CODEOWNERS)가 승인하면 병합하고, main 브랜치 병합 시 자동으로 배포됩니다.
5. 법률 전문가 검토를 마친 문서만 `status: reviewed`와 `reviewedBy`, `reviewedAt`을 적습니다.

## 문서 버전 관리

- 모든 변경은 Git 이력으로 남고, 각 페이지 하단의 "마지막 업데이트"는 Git 커밋 시각입니다.
- 법령 개정에 따른 서술 변경은 [변경 이력](/about/changelog/)에 기록합니다.
- 원문 스냅샷(`data/law-snapshots/*.json`)은 어떤 버전의 법령을 기준으로 썼는지 보여줍니다.
