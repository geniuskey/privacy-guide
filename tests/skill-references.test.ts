import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import sources from '../data/sources.json';
import { ACCESS_CONTROLS, BASES, DATA_ITEMS, DEFAULT_INPUT, evaluate, type SelfCheckInput } from '../src/lib/selfcheck/rules';

// Skill·자가진단이 인용하는 조문이 실제 원문 발췌에 있는지, 발췌 버전이 출처 레지스트리와 같은지 확인한다.
const LAW_DIR = new URL('../skills/kr-privacy-review/references/law/', import.meta.url);
const read = (f: string) => readFileSync(new URL(f, LAW_DIR), 'utf8');
const REF = {
	law: read('pipa-key-articles.md'),
	decree: read('pipa-decree-key-articles.md'),
	notice: read('safety-measures-notice.md'),
};
type Kind = keyof typeof REF;

const articleKey = (m: RegExpMatchArray) => (m[2] ? `${m[1]}-${m[2]}` : m[1]);
const available = (text: string) => new Set([...text.matchAll(/(?:^|\n|\.)제(\d+)조(?:의(\d+))?\(/g)].map(articleKey));
const AVAILABLE: Record<Kind, Set<string>> = { law: available(REF.law), decree: available(REF.decree), notice: available(REF.notice) };
const cited = (segment: string) => [...segment.matchAll(/제(\d+)조(?:의(\d+))?/g)].map(articleKey);
// "제35조~제38조" 같은 범위는 양 끝만 확인한다(사이 조문은 각 문서가 별도로 인용)

const version = (id: string) => sources.sources.find((s) => s.id === id)?.version ?? '';

describe('법령 원문 발췌 버전', () => {
	it('발췌 헤더의 공포번호가 data/sources.json과 같다', () => {
		expect(REF.law).toContain(`제${version('pipa').match(/\d+/)![0]}호`);
		expect(REF.decree).toContain(`제${version('pipa-decree').match(/\d+/)![0]}호`);
		expect(REF.notice).toContain(`고시 제${version('safety-notice').replace(/^.*고시 제/, '').replace(/호$/, '')}호`);
	});
});

describe('Skill 참고 파일의 조문 인용', () => {
	const TAG: Record<string, Kind> = { '[법률]': 'law', '[시행령]': 'decree', '[고시]': 'notice' };
	for (const file of ['../policy-map.md', '../code-review-checklist.md', '../../examples/sample-review.md']) {
		it(`${file.split('/').pop()}의 [법률]·[시행령]·[고시] 인용이 발췌에 있다`, () => {
			const text = read(file);
			const missing: string[] = [];
			for (const m of text.matchAll(/(\[법률\]|\[시행령\]|\[고시\])([^[\n/|]*)/g)) {
				const kind = TAG[m[1]];
				for (const key of cited(m[2])) if (!AVAILABLE[kind].has(key)) missing.push(`${m[1]} 제${key.replace('-', '조의')}`);
			}
			expect(missing).toEqual([]);
		});
	}
});

describe('자가진단 결과의 조문 인용', () => {
	it('모든 결과 항목의 법령 근거가 발췌에 있다', () => {
		const all: SelfCheckInput = {
			...DEFAULT_INPUT,
			items: Object.keys(DATA_ITEMS) as SelfCheckInput['items'],
			bases: Object.keys(BASES) as SelfCheckInput['bases'],
			employeeData: true,
			activity: 'individual',
			access: [] as (keyof typeof ACCESS_CONTROLS)[],
			disclosure: 'partner',
			externalApi: 'processor',
			overseas: true,
			llm: 'raw',
			retention: 'manual',
		};
		const variants = [all, { ...all, externalApi: 'third-party' as const, disclosure: 'public' as const, llm: 'masked' as const, retention: 'undefined' as const }];
		const missing = new Set<string>();
		for (const v of variants) {
			const r = evaluate(v);
			for (const f of [...r.requirements, ...r.risks, ...r.exceptions, ...r.recommendations]) {
				if (!f.basis) continue;
				// "개인정보 보호법 제23조, 시행령 제18조" → 법률/시행령 구간을 나눠 확인
				const [lawPart, decreePart = ''] = f.basis.split('시행령');
				const kind: Kind = lawPart.includes('안전성 확보조치 기준') ? 'notice' : 'law';
				if (lawPart.includes('개인정보 보호법') || kind === 'notice') for (const k of cited(lawPart)) if (!AVAILABLE[kind].has(k)) missing.add(`${f.id}: ${kind} 제${k}`);
				for (const k of cited(decreePart)) if (!AVAILABLE.decree.has(k)) missing.add(`${f.id}: decree 제${k}`);
			}
		}
		expect([...missing]).toEqual([]);
	});
});
