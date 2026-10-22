// 국가법령정보센터 Open API 응답을 다루는 공통 함수. check-sources·build-skill-references·테스트가 함께 쓴다.
import { createHash } from 'node:crypto';

export const asArray = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);

/** 조문 객체(조문내용 → 항 → 호 → 목)를 본문 텍스트로 편다. */
export const flatText = (x) => {
	if (x == null) return '';
	if (typeof x === 'string') return x;
	if (Array.isArray(x)) return x.map(flatText).filter(Boolean).join('\n');
	if (typeof x === 'object') return ['조문내용', '항내용', '호내용', '목내용', '항', '호', '목'].filter((k) => k in x).map((k) => flatText(x[k])).filter(Boolean).join('\n');
	return String(x);
};

/** 공백·개정 표기(<개정 2023.3.14>) 차이로 인한 오탐을 줄이기 위해 정규화한다. */
export const normalize = (s) => s.replace(/<(개정|신설|전문개정|본조신설)[^>]*>/g, '').replace(/\s+/g, '');
export const articleHash = (s) => createHash('sha256').update(normalize(s)).digest('hex').slice(0, 16);

/** "제28조의8제1항, 제15조" → ["28-8", "15"] */
export const articleKeys = (text) => [...text.matchAll(/제(\d+)조(?:의(\d+))?/g)].map((m) => (m[2] ? `${m[1]}-${m[2]}` : m[1]));

/** 조문 스냅샷({키: {hash}}) 사이에서 바뀌거나 추가·삭제된 조문 키 */
export function diffArticles(prev, next) {
	const changed = [];
	for (const [k, v] of Object.entries(next)) if (!prev[k] || prev[k].hash !== v.hash) changed.push(k);
	for (const k of Object.keys(prev)) if (!next[k]) changed.push(k);
	return changed;
}

/** "28-8" → "제28조의8" */
export const articleLabel = (key) => (key.includes('-') ? `제${key.replace('-', '조의')}` : `제${key}조`);

/**
 * 개인정보보호위원회 게시판 목록 HTML에서 게시글 행(제목·nttId·작성일)만 뽑는다.
 * 페이지 전체 해시가 아니라 구조화된 필드로 비교해 레이아웃 변경으로 인한 오탐을 피한다.
 */
export function parseBoardRows(html) {
	const rows = [];
	for (const tr of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
		const ntt = tr[1].match(/nttId=(\d+)/);
		if (!ntt) continue;
		const cells = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) =>
			c[1].replace(/<[^>]+>/g, ' ').replace(/&#0?39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim(),
		);
		const title = cells.find((c) => c.includes('[')) ?? cells[1] ?? '';
		const date = cells.find((c) => /^\d{4}-\d{2}-\d{2}$/.test(c)) ?? null;
		rows.push({ nttId: ntt[1], title, date, notice: cells[0] === '공지' });
	}
	return rows;
}

/** 검색 결과 행 중 같은 안내서 계열(match 포함)의 [현재 안내서] 최신 글 */
export function latestCurrentGuide(rows, match) {
	return rows
		.filter((r) => !r.notice && r.title.includes(match) && r.title.includes('[현재 안내서]'))
		.sort((a, b) => Number(b.nttId) - Number(a.nttId))[0] ?? null;
}
