#!/usr/bin/env node
// 출처 레지스트리와 문서·Skill의 외부 링크가 살아 있는지 확인한다.
// 링크당 한 번만, 요청 사이에 간격을 두고 순서대로 요청한다(크롤링하지 않음).
// 사용법: node scripts/check-links.mjs [--report=links-report.json] [--issue]
//   --issue: 깨진 링크가 있으면 GitHub 이슈를 열거나 갱신한다(GH_TOKEN 필요).
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { classify, classifyError, extractLinks } from './lib/links.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const UA = 'kr-privacy-dev-link-check/1.0 (+https://github.com/geniuskey/privacy-guide)';
const DELAY_MS = 1000;
const TIMEOUT_MS = 20000;
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];

const walk = (dir) => readdirSync(dir).flatMap((f) => {
	const p = join(dir, f);
	return statSync(p).isDirectory() ? walk(p) : /\.mdx?$/.test(f) ? [p] : [];
});

// URL → 이 URL을 쓰는 위치
const where = new Map();
const add = (url, from) => where.set(url, [...(where.get(url) ?? []), from]);

for (const s of JSON.parse(readFileSync(join(ROOT, 'data/sources.json'), 'utf8')).sources) add(s.url, `data/sources.json#${s.id}`);
for (const f of [...walk(join(ROOT, 'src/content/docs')), ...walk(join(ROOT, 'skills')), join(ROOT, 'README.md')]) {
	for (const u of extractLinks(readFileSync(f, 'utf8'))) add(u, relative(ROOT, f));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function probe(url) {
	const req = (method) => fetch(url, { method, redirect: 'follow', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(TIMEOUT_MS) });
	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			let res = await req('HEAD');
			// HEAD를 지원하지 않는 서버가 많다
			if (res.status === 405 || res.status === 403 || res.status === 501 || res.status === 404) res = await req('GET');
			return { status: res.status, result: classify(res.status) };
		} catch (e) {
			const code = e.cause?.code ?? e.name;
			if (attempt === 1 || classifyError(code) === 'unverified') return { status: 0, result: classifyError(code), error: code };
			await sleep(DELAY_MS * 3);
		}
	}
}

const results = [];
for (const [url, from] of where) {
	const r = await probe(url);
	results.push({ url, ...r, from });
	console.log(`${r.result.padEnd(10)} ${String(r.status).padStart(3)} ${url}${r.error ? ` (${r.error})` : ''}`);
	await sleep(DELAY_MS);
}

const broken = results.filter((r) => r.result === 'broken');
const unverified = results.filter((r) => r.result === 'unverified');
const report = { checkedAt: new Date().toISOString(), total: results.length, broken, unverified };
const out = arg('report');
if (out) writeFileSync(out, JSON.stringify(report, null, 2));
console.log(`\n링크 ${results.length}개: 깨짐 ${broken.length}, 확인 필요 ${unverified.length}`);

if (process.argv.includes('--issue') && broken.length) {
	const gh = (args) => execFileSync('gh', args, { encoding: 'utf8' });
	try { gh(['label', 'create', 'link-check', '--color', 'd93f0b', '--description', '외부 링크 점검']); } catch { /* 이미 있음 */ }
	const row = (r) => `| ${r.url} | ${r.status || r.error} | ${[...new Set(r.from)].map((f) => `\`${f}\``).join('<br>')} |`;
	const body = [
		`외부 링크 점검(${report.checkedAt.slice(0, 10)})에서 응답하지 않거나 오류를 돌려준 링크가 ${broken.length}개 있습니다.`,
		'',
		'| URL | 상태 | 사용 위치 |',
		'| --- | --- | --- |',
		...broken.map(row),
		'',
		'공식 출처의 주소가 바뀐 경우 `data/sources.json`의 url과 `lastChecked`를 고치고, 게시물이 내려간 경우 대체 출처를 찾은 뒤 해당 근거를 `review-required`로 되돌리세요.',
	].join('\n');
	const [open] = JSON.parse(gh(['issue', 'list', '--state', 'open', '--label', 'link-check', '--limit', '1', '--json', 'number']));
	if (open) gh(['issue', 'edit', String(open.number), '--body', body]);
	else gh(['issue', 'create', '--title', '[링크 점검] 깨진 외부 링크', '--label', 'link-check', '--body', body]);
}

process.exit(broken.length ? 1 : 0);
