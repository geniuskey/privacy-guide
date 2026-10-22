import { describe, expect, it } from 'vitest';
import { relatedDocs, type RelatedCandidate } from '../src/lib/related';

const doc = (id: string, tags: string[], related: string[] = [], category = 'x'): RelatedCandidate => ({ id, title: id, tags, related, category });

describe('relatedDocs', () => {
	const all = [
		doc('a/current', ['동의', '회원가입']),
		doc('b/explicit', []),
		doc('c/two-tags', ['동의', '회원가입']),
		doc('d/one-tag', ['동의']),
		doc('e/backlink', ['기타'], ['a/current']),
		doc('f/none', ['무관']),
	];

	it('명시한 related를 먼저, 이어서 태그 겹침·역링크 점수순으로 정렬한다', () => {
		const r = relatedDocs({ id: 'a/current', tags: ['동의', '회원가입'], related: ['/b/explicit/'], category: 'x' }, all);
		expect(r.map((d) => d.id)).toEqual(['b/explicit', 'c/two-tags', 'e/backlink', 'd/one-tag']);
	});

	it('자기 자신과 관련 없는 문서는 빼고 limit을 지킨다', () => {
		const r = relatedDocs({ id: 'a/current', tags: ['동의'], related: [], category: 'x' }, all, 1);
		expect(r).toHaveLength(1);
		expect(r[0].id).not.toBe('a/current');
	});
});
