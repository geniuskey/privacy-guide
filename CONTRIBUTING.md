# 기여 가이드

## 이슈

- **법적 근거 오류**: 공식 원문 링크(국가법령정보센터, 개인정보보호위원회 등)와 조항을 함께 적어 주세요. 언론·블로그만으로는 수정 근거가 되지 않습니다.
- **기술 오류·예제 버그**: 재현 방법을 적어 주세요.

## 문서 작성 규칙

1. 문서는 `src/content/docs/<카테고리>/<slug>.md`에 둡니다.
2. 본문 섹션 순서: 한 문장 결론 → 적용 조건과 예외 → 실제 법적 근거 → 개발자용 실무 해설 → 권장 설계 → 위험한 설계 → Python/TypeScript 구현 예제 → 개발 체크리스트 → 공식 원문 링크와 확인일
3. frontmatter의 `legalBasis`마다 `kind`(law/decree/notice/guide/standard/best-practice)와 `status`(verified/review-required)를 적습니다.
4. 출처는 `data/sources.json`의 id로 참조합니다. 새 출처를 추가하려면 발행기관 원문 URL과 버전을 함께 적습니다.
5. 공식 원문으로 확인하지 못한 내용은 `review-required`로 표시합니다. 시행 예정 규정은 현재 의무로 쓰지 않습니다.
6. 내부 링크는 `/카테고리/slug/` 형식으로 씁니다(배포 base 경로는 빌드 시 자동으로 붙습니다).
7. PR 전에 `npm run validate:content && npm test && npm run build`를 실행합니다.

## AI 도구 사용

AI로 초안이나 법령 변경 비교를 만들 수 있습니다. 다만 AI가 쓴 법적 서술은 사람이 공식 원문과 대조하기 전까지 `review-required`로 둡니다.

## 검토 상태 올리기

`status: reviewed`는 지정 검토자만 설정합니다. `reviewedBy`, `reviewedAt`을 함께 적고, 모든 `legalBasis` 항목이 `verified`여야 합니다(검사 스크립트가 확인).

## 라이선스

기여한 코드는 MIT, 문서는 CC BY 4.0으로 배포됩니다.
