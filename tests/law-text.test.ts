import { describe, expect, it } from 'vitest';
// @ts-expect-error 스크립트용 ESM 모듈(타입 선언 없음)
import { articleHash, articleKeys, articleLabel, diffArticles, flatText, normalize } from '../scripts/lib/law-text.mjs';

describe('law-text', () => {
	it('조문 인용에서 조 키를 뽑는다', () => {
		expect(articleKeys('제28조의8제1항, 제15조제1항제4호 및 제22조')).toEqual(['28-8', '15', '22']);
		expect(articleLabel('28-8')).toBe('제28조의8');
		expect(articleLabel('15')).toBe('제15조');
	});

	it('조문 객체를 항·호 순서대로 편다', () => {
		const a = { 조문내용: '제1조(목적)', 항: [{ 항내용: '① 가', 호: [{ 호내용: '1. 나' }] }, { 항내용: '② 다' }] };
		expect(flatText(a)).toBe('제1조(목적)\n① 가\n1. 나\n② 다');
	});

	it('공백·개정 표기만 다른 조문은 같은 해시를 낸다 (오탐 방지)', () => {
		const before = '제21조(개인정보의 파기) ① 지체 없이 파기하여야 한다. <개정 2023.3.14>';
		const after = '제21조(개인정보의 파기)\n①  지체 없이 파기하여야 한다. <개정 2023.3.14, 2026.3.10>';
		expect(normalize(before)).toBe(normalize(after));
		expect(articleHash(before)).toBe(articleHash(after));
		expect(articleHash(before)).not.toBe(articleHash(before.replace('지체 없이', '5일 이내에')));
	});

	it('변경·추가·삭제된 조문을 찾는다', () => {
		const prev = { '15': { hash: 'a' }, '22': { hash: 'b' }, '40': { hash: 'c' } };
		const next = { '15': { hash: 'a' }, '22': { hash: 'B' }, '22-3': { hash: 'd' } };
		expect(diffArticles(prev, next).sort()).toEqual(['22', '22-3', '40']);
	});
});

// @ts-expect-error 스크립트용 ESM 모듈
import { latestCurrentGuide, parseBoardRows } from '../scripts/lib/law-text.mjs';

describe('PIPC 게시판 목록 해석', () => {
	const html = `<table><tr><th>번호</th><th>제목</th></tr>
<tr><td>공지</td><td><a href="selectBoardArticle.do?bbsId=BS217&nttId=12353">[현재 안내서] 개인정보위 안내서 전체 목록</a></td><td>정책과</td><td>2026-08-03</td></tr>
<tr><td>117</td><td><a href="selectBoardArticle.do?bbsId=BS217&nttId=12018">[현재 안내서] 개인정보 처리방침 작성지침(2026.4. 개정)</a></td><td>자율보호정책과</td><td>2026-04-23</td></tr>
<tr><td>107</td><td><a href="selectBoardArticle.do?bbsId=BS217&nttId=11134">[과거 안내서] 개인정보 처리방침 작성지침(2025.4.)</a></td><td>개인정보보호위원회</td><td>2025-04-21</td></tr></table>`;

	it('게시글 행의 제목·nttId·작성일만 뽑는다', () => {
		const rows = parseBoardRows(html);
		expect(rows).toHaveLength(3);
		expect(rows[1]).toEqual({ nttId: '12018', title: '[현재 안내서] 개인정보 처리방침 작성지침(2026.4. 개정)', date: '2026-04-23', notice: false });
		expect(rows[0].notice).toBe(true);
	});

	it('같은 계열의 [현재 안내서] 최신 글을 고르고 과거 안내서·공지는 제외한다', () => {
		expect(latestCurrentGuide(parseBoardRows(html), '개인정보 처리방침 작성지침')?.nttId).toBe('12018');
		expect(latestCurrentGuide(parseBoardRows(html.replace('[현재 안내서] 개인정보 처리방침', '[과거 안내서] 개인정보 처리방침')), '개인정보 처리방침 작성지침')).toBeNull();
	});
});
