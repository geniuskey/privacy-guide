#!/usr/bin/env node
// 공식 출처 변경 감지.
// - 법령·행정규칙: 국가법령정보센터 Open API(DRF)의 구조화된 버전 정보(일련번호·공포번호·시행일자)와
//   조문 단위 정규화 텍스트 해시를 비교한다. 페이지 HTML 해시는 쓰지 않는다.
// - GitHub 표준(OWASP ASVS): GitHub Releases API의 최신 태그를 비교한다.
// - 안내서처럼 공식 API가 없는 출처: 크롤링하지 않고, 확인 주기(intervalDays)가 지나면 수동 확인을 요청한다.
//
// 사용법:
//   LAW_OC=<open.law.go.kr 인증키> node scripts/check-sources.mjs [--report=report.json] [--update-snapshots] [--today=YYYY-MM-DD]
// 종료 코드는 항상 0이며, 결과는 report JSON과 표준출력 요약으로 전달한다 (이슈 생성은 워크플로가 담당).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';

const ROOT = new URL('..', import.meta.url).pathname;
const SNAP_DIR = join(ROOT, 'data/law-snapshots');
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const flag = (name) => process.argv.includes(`--${name}`);
// 법령 시행일·확인일은 한국 날짜 기준이다
const kstDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
const today = new Date(arg('today') ?? kstDate());
const OC = process.env.LAW_OC;
const API = 'https://www.law.go.kr/DRF';
const UA = 'kr-privacy-dev-source-watch/1.0 (+https://github.com/geniuskey/privacy-guide)';

const registry = JSON.parse(readFileSync(join(ROOT, 'data/sources.json'), 'utf8')).sources;

// ---- 문서 ↔ 출처/조문 역색인 ----
const DOCS = join(ROOT, 'src/content/docs');
const walk = (dir) => readdirSync(dir).flatMap((f) => {
	const p = join(dir, f);
	return statSync(p).isDirectory() ? walk(p) : /\.mdx?$/.test(f) ? [p] : [];
});
const docRefs = walk(DOCS).map((file) => {
	const m = readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---/);
	let fm = {};
	try { fm = m ? parse(m[1]) ?? {} : {}; } catch { console.warn(`frontmatter 파싱 실패: ${relative(DOCS, file)}`); }
	return {
		slug: relative(DOCS, file).replace(/\.mdx?$/, ''),
		sources: new Set([...(fm.sources ?? []), ...(fm.legalBasis ?? []).map((b) => b.source)]),
		articles: (fm.legalBasis ?? []).map((b) => ({ source: b.source, article: b.article ?? '' })),
	};
});
// "제28조의8제1항" → "28-8", "제15조제1항, 제22조" → ["15", "22"]
export const articleKeys = (text) => [...text.matchAll(/제(\d+)조(?:의(\d+))?/g)].map((m) => (m[2] ? `${m[1]}-${m[2]}` : m[1]));
const docsFor = (sourceId, changedArticles) =>
	docRefs
		.filter((d) => d.sources.has(sourceId))
		.map((d) => {
			const cited = d.articles.filter((a) => a.source === sourceId).flatMap((a) => articleKeys(a.article));
			const hits = changedArticles ? cited.filter((k) => changedArticles.includes(k)) : [];
			return { slug: d.slug, citedChangedArticles: [...new Set(hits)] };
		})
		.sort((a, b) => b.citedChangedArticles.length - a.citedChangedArticles.length);

// ---- 법령 API ----
async function getJson(url) {
	const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
	if (!res.ok) throw new Error(`${res.status} ${url.replace(OC, '***')}`);
	return res.json();
}
const asArray = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const flatText = (x) => {
	if (x == null) return '';
	if (typeof x === 'string') return x;
	if (Array.isArray(x)) return x.map(flatText).join('\n');
	if (typeof x === 'object') return ['조문내용', '항내용', '호내용', '목내용', '항', '호', '목'].filter((k) => k in x).map((k) => flatText(x[k])).join('\n');
	return String(x);
};
// 공백·개정 표기(<개정 2023.3.14>) 차이로 인한 오탐을 줄이기 위해 정규화 후 해시
const normalize = (s) => s.replace(/<(개정|신설|전문개정|본조신설)[^>]*>/g, '').replace(/\s+/g, '');
const hash = (s) => createHash('sha256').update(normalize(s)).digest('hex').slice(0, 16);

async function lawSnapshot(watch) {
	const search = await getJson(`${API}/lawSearch.do?OC=${OC}&target=law&type=JSON&query=${encodeURIComponent(watch.query)}`);
	const hits = asArray(search.LawSearch?.law).filter((l) => l.법령명한글 === watch.query);
	const current = hits.find((l) => l.현행연혁코드 === '현행') ?? hits[0];
	if (!current) throw new Error(`검색 결과 없음: ${watch.query}`);
	const upcoming = hits.filter((l) => l.현행연혁코드 && l.현행연혁코드 !== '현행' && l.시행일자 > current.시행일자);
	const body = await getJson(`${API}/lawService.do?OC=${OC}&target=law&MST=${current.법령일련번호}&type=JSON`);
	const articles = {};
	for (const a of asArray(body.법령?.조문?.조문단위)) {
		if (a.조문여부 !== '조문') continue;
		const key = a.조문가지번호 ? `${a.조문번호}-${a.조문가지번호}` : a.조문번호;
		articles[key] = { title: a.조문제목 ?? null, hash: hash(flatText(a)) };
	}
	return {
		version: { serial: current.법령일련번호, number: current.공포번호, promulgatedAt: current.공포일자, effectiveAt: current.시행일자, kind: current.제개정구분명 },
		upcoming: upcoming.map((u) => ({ serial: u.법령일련번호, number: u.공포번호, effectiveAt: u.시행일자 })),
		articles,
	};
}

async function admrulSnapshot(watch) {
	const search = await getJson(`${API}/lawSearch.do?OC=${OC}&target=admrul&type=JSON&query=${encodeURIComponent(watch.query)}`);
	const hits = asArray(search.AdmRulSearch?.admrul).filter((r) => r.행정규칙명 === watch.query);
	const current = hits.find((r) => r.현행연혁구분 === '현행') ?? hits[0];
	if (!current) throw new Error(`검색 결과 없음: ${watch.query}`);
	const body = await getJson(`${API}/lawService.do?OC=${OC}&target=admrul&ID=${current.행정규칙일련번호}&type=JSON`);
	const articles = {};
	for (const text of asArray(body.AdmRulService?.조문내용)) {
		const m = String(text).match(/^\s*제(\d+)조(?:의(\d+))?\(([^)]*)\)/);
		if (m) articles[m[2] ? `${m[1]}-${m[2]}` : m[1]] = { title: m[3], hash: hash(String(text)) };
	}
	return {
		version: { serial: current.행정규칙일련번호, number: current.발령번호, promulgatedAt: current.발령일자, effectiveAt: current.시행일자, kind: current.제개정구분명 },
		upcoming: [],
		articles,
	};
}

function diffArticles(prev, next) {
	const changed = [];
	for (const [k, v] of Object.entries(next)) if (!prev[k] || prev[k].hash !== v.hash) changed.push(k);
	for (const k of Object.keys(prev)) if (!next[k]) changed.push(k);
	return changed;
}

// ---- 실행 ----
const report = { checkedAt: today.toISOString().slice(0, 10), changes: [], upcoming: [], manualDue: [], errors: [], skipped: [] };

for (const s of registry) {
	const w = s.watch;
	if (!w) continue;
	try {
		if (w.type === 'law-api') {
			if (!OC) { report.skipped.push({ id: s.id, reason: 'LAW_OC 미설정' }); continue; }
			const snap = w.target === 'admrul' ? await admrulSnapshot(w) : await lawSnapshot(w);
			const file = join(SNAP_DIR, `${s.id}.json`);
			const prev = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
			if (prev && prev.version.serial !== snap.version.serial) {
				const changedArticles = diffArticles(prev.articles, snap.articles);
				report.changes.push({
					id: s.id, title: s.title, kind: 'version',
					from: prev.version, to: snap.version, changedArticles,
					affectedDocs: docsFor(s.id, changedArticles),
				});
			} else if (prev) {
				// 같은 버전인데 조문 텍스트가 바뀐 경우(정정 등)
				const changedArticles = diffArticles(prev.articles, snap.articles);
				if (changedArticles.length) report.changes.push({ id: s.id, title: s.title, kind: 'text', from: prev.version, to: snap.version, changedArticles, affectedDocs: docsFor(s.id, changedArticles) });
			} else if (s.version && !s.version.includes(snap.version.number)) {
				// 스냅샷이 없을 때는 레지스트리 표기 버전과 비교
				report.changes.push({ id: s.id, title: s.title, kind: 'version', from: { number: s.version }, to: snap.version, changedArticles: [], affectedDocs: docsFor(s.id, null) });
			}
			for (const u of snap.upcoming) report.upcoming.push({ id: s.id, title: s.title, ...u, affectedDocs: docsFor(s.id, null) });
			if (flag('update-snapshots') || !prev) {
				mkdirSync(SNAP_DIR, { recursive: true });
				writeFileSync(file, JSON.stringify({ id: s.id, fetchedAt: report.checkedAt, ...snap }, null, 2) + '\n');
			}
		} else if (w.type === 'github-release') {
			const res = await fetch(`https://api.github.com/repos/${w.repo}/releases?per_page=20`, {
				headers: { 'User-Agent': UA, Accept: 'application/vnd.github+json', ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) },
			});
			if (!res.ok) throw new Error(`GitHub ${res.status}`);
			// "latest" 같은 이동 태그는 무시하고 정식 버전 태그(v5.0.0_release 등) 중 가장 높은 것을 고른다
			const versions = (await res.json())
				.filter((r) => !r.prerelease && !r.draft)
				.map((r) => r.tag_name.match(/^v?(\d+)\.(\d+)\.(\d+)/))
				.filter(Boolean)
				.map((m) => m.slice(1, 4).map(Number))
				.sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2]);
			const latest = versions[0]?.join('.');
			if (latest && s.version && latest !== s.version) {
				report.changes.push({ id: s.id, title: s.title, kind: 'release', from: { number: s.version }, to: { number: latest }, changedArticles: [], affectedDocs: docsFor(s.id, null) });
			}
		} else if (w.type === 'manual') {
			const age = Math.floor((today - new Date(s.lastChecked)) / 86400000);
			if (age >= (w.intervalDays ?? 90)) report.manualDue.push({ id: s.id, title: s.title, lastChecked: s.lastChecked, ageDays: age, url: s.url, affectedDocs: docsFor(s.id, null) });
		}
	} catch (e) {
		report.errors.push({ id: s.id, message: String(e.message ?? e) });
	}
}

const out = arg('report');
if (out) writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(`변경 ${report.changes.length} · 시행 예정 ${report.upcoming.length} · 수동 확인 필요 ${report.manualDue.length} · 오류 ${report.errors.length} · 건너뜀 ${report.skipped.length}`);
for (const c of report.changes) console.log(`- [변경] ${c.title}: ${c.from.number ?? ''} → ${c.to.number} (조문 ${c.changedArticles.length}개, 영향 문서 ${c.affectedDocs.length}개)`);
for (const u of report.upcoming) console.log(`- [시행 예정] ${u.title}: 제${u.number}호, ${u.effectiveAt} 시행`);
for (const m of report.manualDue) console.log(`- [수동 확인] ${m.title}: 마지막 확인 ${m.lastChecked} (${m.ageDays}일 전)`);
for (const e of report.errors) console.log(`- [오류] ${e.id}: ${e.message}`);
