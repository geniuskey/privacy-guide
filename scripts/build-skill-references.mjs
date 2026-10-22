#!/usr/bin/env node
// kr-privacy-review Skill의 법령 원문 발췌(references/law/*.md)를 국가법령정보센터 Open API로 다시 만든다.
// 법령 개정 이슈를 처리하는 PR에서 실행한다. 사용법: LAW_OC=<인증키> node scripts/build-skill-references.mjs
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'skills/kr-privacy-review/references/law');
const OC = process.env.LAW_OC;
if (!OC) {
	console.error('LAW_OC 환경변수(국가법령정보 공동활용 인증키)가 필요합니다.');
	process.exit(1);
}
const API = 'https://www.law.go.kr/DRF';
const UA = 'kr-privacy-dev-skill-references/1.0 (+https://github.com/geniuskey/privacy-guide)';
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());

// 발췌 대상 조문. 키는 "조" 또는 "조-가지"
const TARGETS = [
	{
		file: 'pipa-key-articles.md',
		query: '개인정보 보호법',
		articles: '2,3,4,15,16,17,18,19,20,21,22,22-2,23,24,24-2,26,28,28-2,28-8,28-9,29,30,30-3,31,34,34-2,35,35-2,36,37,37-2,38,58,58-2'.split(','),
		latestAddendum: true,
	},
	{
		file: 'pipa-decree-key-articles.md',
		query: '개인정보 보호법 시행령',
		articles: '2,14-2,15-2,16,17,17-2,18,19,21,21-2,28,29-10,30,31,32,39,39-2,39-3,40,40-2,41,42,44,44-2,44-3,44-4'.split(','),
	},
	{ file: null, query: '통신비밀보호법', articles: ['2', '3'], group: 'related' },
	{ file: null, query: '근로자참여 및 협력증진에 관한 법률', articles: ['20', '21'], group: 'related' },
	{ file: null, query: '저작권법', articles: ['7'], group: 'related' },
];

const asArray = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const flat = (x) => {
	if (x == null) return '';
	if (typeof x === 'string') return x;
	if (Array.isArray(x)) return x.map(flat).join('\n');
	if (typeof x === 'object') return ['조문내용', '항내용', '호내용', '목내용', '항', '호', '목'].filter((k) => k in x).map((k) => flat(x[k])).filter(Boolean).join('\n');
	return String(x);
};
const getJson = async (url) => {
	const res = await fetch(url, { headers: { 'User-Agent': UA } });
	if (!res.ok) throw new Error(`${res.status}`);
	return res.json();
};
const ymd = (s) => `${s.slice(0, 4)}.${Number(s.slice(4, 6))}.${Number(s.slice(6, 8))}.`;

async function law(query) {
	const s = await getJson(`${API}/lawSearch.do?OC=${OC}&target=law&type=JSON&query=${encodeURIComponent(query)}`);
	const cur = asArray(s.LawSearch?.law).find((l) => l.법령명한글 === query && l.현행연혁코드 === '현행');
	if (!cur) throw new Error(`현행 법령 없음: ${query}`);
	const body = (await getJson(`${API}/lawService.do?OC=${OC}&target=law&MST=${cur.법령일련번호}&type=JSON`)).법령;
	return { cur, body };
}

function render({ cur, body }, articles, latestAddendum) {
	const lines = [`# ${cur.법령명한글} (${cur.법령구분명} 제${cur.공포번호}호, 공포 ${ymd(cur.공포일자)}, 시행 ${ymd(cur.시행일자)})`, ''];
	for (const a of asArray(body.조문?.조문단위)) {
		if (a.조문여부 !== '조문') continue;
		const key = a.조문가지번호 ? `${a.조문번호}-${a.조문가지번호}` : a.조문번호;
		if (articles.includes(key)) lines.push(flat(a), '');
	}
	if (latestAddendum) {
		const units = asArray(body.부칙?.부칙단위);
		const last = units[units.length - 1];
		if (last) lines.push('## 부칙(최근)', flat(last.부칙내용), '');
	}
	return lines.join('\n');
}

const header = (extra = '') =>
	`<!-- 출처: 국가법령정보센터 Open API (https://www.law.go.kr/DRF/). 법령은 저작권법 제7조에 따른 비보호저작물. 수집일 ${today}. 최신 원문은 반드시 law.go.kr에서 재확인.${extra} -->\n`;

const related = [];
for (const t of TARGETS) {
	const data = await law(t.query);
	const text = render(data, t.articles, t.latestAddendum);
	if (t.group === 'related') related.push(text.replace(/^# /, '## '));
	else {
		writeFileSync(join(OUT, t.file), header() + text);
		console.log(`wrote ${t.file} (제${data.cur.공포번호}호)`);
	}
}
writeFileSync(join(OUT, 'related-laws-excerpts.md'), header() + '# 관련 법령 발췌\n\n' + related.join('\n'));
console.log('wrote related-laws-excerpts.md');

// 행정규칙(고시)
const s = await getJson(`${API}/lawSearch.do?OC=${OC}&target=admrul&type=JSON&query=${encodeURIComponent('개인정보의 안전성 확보조치 기준')}`);
const rule = asArray(s.AdmRulSearch?.admrul).find((r) => r.행정규칙명 === '개인정보의 안전성 확보조치 기준' && r.현행연혁구분 === '현행');
const rb = (await getJson(`${API}/lawService.do?OC=${OC}&target=admrul&ID=${rule.행정규칙일련번호}&type=JSON`)).AdmRulService;
writeFileSync(
	join(OUT, 'safety-measures-notice.md'),
	header() + `# 개인정보의 안전성 확보조치 기준 (개인정보보호위원회 고시 제${rule.발령번호}호, 발령 ${ymd(rule.발령일자)}, 시행 ${ymd(rule.시행일자)})\n\n` + asArray(rb.조문내용).join('\n') + '\n',
);
console.log(`wrote safety-measures-notice.md (고시 제${rule.발령번호}호)`);
