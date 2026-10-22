export interface RelatedCandidate {
	id: string;
	title: string;
	related: string[];
	tags: string[];
	category?: string;
}

/**
 * 관련 문서 자동 링크: 명시한 related를 먼저, 이어서 태그가 많이 겹치는 문서를 점수순으로 붙인다.
 * 역방향(다른 문서가 이 문서를 related로 지정)도 가산점을 준다.
 */
export function relatedDocs(
	current: Omit<RelatedCandidate, 'title'>,
	all: RelatedCandidate[],
	limit = 6,
): RelatedCandidate[] {
	const byId = new Map(all.map((d) => [d.id, d]));
	const explicit = current.related.map((id) => byId.get(id.replace(/^\/|\/$/g, ''))).filter((d): d is RelatedCandidate => !!d);
	const taken = new Set([current.id, ...explicit.map((d) => d.id)]);
	const tagSet = new Set(current.tags);

	const scored = all
		.filter((d) => !taken.has(d.id) && d.tags.length > 0)
		.map((d) => {
			let score = d.tags.filter((t) => tagSet.has(t)).length * 2;
			if (d.related.includes(current.id)) score += 3;
			if (score > 0 && d.category === current.category) score += 1;
			return { d, score };
		})
		.filter((x) => x.score > 0)
		.sort((a, b) => b.score - a.score || a.d.id.localeCompare(b.d.id))
		.map((x) => x.d);

	return [...explicit, ...scored].slice(0, limit);
}
