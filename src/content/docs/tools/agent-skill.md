---
title: AI 에이전트 Skill — kr-privacy-review
description: Claude Code, Codex 같은 AI 개발 에이전트가 한국 개인정보·보안 요구사항으로 코드와 PR을 검토하게 하는 Skill
---

[`skills/kr-privacy-review`](https://github.com/geniuskey/privacy-guide/tree/main/skills/kr-privacy-review)는 AI 개발 에이전트가 로그인, 개인정보 필드 추가, 관리자 페이지, 권한 변경, 활동 로그, 다운로드·공개 API, 외부 API·LLM 연동, 삭제 기능을 만들거나 PR을 검토할 때 쓰는 Skill입니다.

:::caution[한계]
AI가 자동으로 법률 준수를 보증할 수는 없습니다. Skill의 출력은 사람이 검토할 확인 목록이며, 원문으로 확인하지 못한 해석은 `review-required`로 표시하도록 지시되어 있습니다.
:::

## 구성

```text
skills/kr-privacy-review/
├─ SKILL.md                         # 사용 시점, 절차, 출력 10개 항목, 금지사항
└─ references/
   ├─ policy-map.md                 # 변경 유형별 확인 조문·통제 지도
   ├─ code-review-checklist.md      # 보안 코드리뷰 체크리스트
   ├─ test-case-templates.md        # 테스트 케이스 템플릿
   ├─ report-template.md            # 보고서 형식
├─ examples/sample-review.md        # 회원 내보내기 PR 검토 예시
   └─ law/                          # 국가법령정보센터 Open API로 받은 현행 원문 발췌
      ├─ pipa-key-articles.md
      ├─ pipa-decree-key-articles.md
      ├─ safety-measures-notice.md
      └─ related-laws-excerpts.md
```

Skill이 조문을 기억으로 만들지 않도록 원문 발췌를 함께 넣었습니다. CI 테스트가 Skill 참고 파일과 예시에 인용된 조문이 모두 발췌에 있는지, 발췌 버전이 출처 레지스트리와 같은지 확인합니다. 발췌의 수집일은 2026-10-23이며, 이 저장소의 [출처 변경 감지](/about/maintenance/)가 법령 개정을 알리면 함께 갱신합니다.

## 설치

설치 스크립트로 복사합니다.

```bash
# 사용자 전역 (~/.claude/skills)
curl -fsSL https://raw.githubusercontent.com/geniuskey/privacy-guide/main/skills/install.sh | sh -s -- --user

# 특정 프로젝트 (<repo>/.claude/skills)
sh skills/install.sh /path/to/your-repo
```

직접 복사해도 됩니다.

```bash
# Claude Code: 프로젝트 단위
mkdir -p .claude/skills
cp -R /path/to/privacy-guide/skills/kr-privacy-review .claude/skills/

# Claude Code: 사용자 전역
cp -R /path/to/privacy-guide/skills/kr-privacy-review ~/.claude/skills/
```

Codex 등 다른 에이전트는 각 도구의 Skill·지침 위치에 같은 폴더를 두거나, `AGENTS.md`에 "개인정보 관련 변경은 `skills/kr-privacy-review/SKILL.md` 절차를 따른다"고 적습니다.

## 출력 항목

1. 수집하는 개인정보
2. 수집 목적 및 처리 근거 확인사항
3. 개인정보 처리 흐름
4. 접근 가능한 역할
5. 외부 제공 및 국외이전 확인사항
6. 저장 및 파기 정책
7. 기술적 보안 통제
8. 추가 검토가 필요한 법적 쟁점
9. 테스트 케이스
10. 공식 근거 및 출처

## 사용 예

```text
> 이 PR을 kr-privacy-review로 검토해줘
> 회원 엑셀 다운로드 기능을 추가하려고 해. kr-privacy-review 기준으로 설계 검토해줘
```
