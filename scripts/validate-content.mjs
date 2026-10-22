#!/usr/bin/env node
// 콘텐츠 품질 검사: frontmatter 근거·확인일·상태, 필수 섹션 순서, 내부 링크, 출처 레지스트리 참조를 확인한다.
// 사용법: node scripts/validate-content.mjs [--today=YYYY-MM-DD]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';

const ROOT = new URL('..', import.meta.url).pathname;
const DOCS = join(ROOT, 'src/content/docs');
const CATEGORY_DIRS = ['laws', 'collection-consent', 'sensitive-data', 'auth-access', 'internal-admin', 'data-sharing', 'storage-retention', 'app-security', 'ai-llm', 'case-studies'];
const REQUIRED_SECTIONS = ['한 문장 결론', '적용 조건과 예외', '실제 법적 근거', '개발자용 실무 해설', '권장 설계', '위험한 설계', 'Python/TypeScript 구현 예제', '개발 체크리스트', '공식 원문 링크와 확인일'];
const BASIS_KINDS = new Set(['law', 'decree', 'notice', 'guide', 'standard', 'best-practice']);
const STALE_DAYS = 180;

const todayArg = process.argv.find((a) => a.startsWith('--today='));
// 법령 시행일·확인일은 한국 날짜 기준이다
const kstDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
const today = new Date(todayArg ? todayArg.slice(8) : kstDate());

const registry = JSON.parse(readFileSync(join(ROOT, 'data/sources.json'), 'utf8')).sources;
const sourceById = new Map(registry.map((s) => [s.id, s]));

const walk = (dir) => readdirSync(dir).flatMap((f) => {
	const p = join(dir, f);
	return statSync(p).isDirectory() ? walk(p) : /\.mdx?$/.test(f) ? [p] : [];
});

const files = walk(DOCS);
const slugOf = (p) => relative(DOCS, p).replace(/\.mdx?$/, '').replace(/(^|\/)index$/, '');
const slugs = new Set(files.map(slugOf));

const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${relative(ROOT, file)}: ${msg}`);
const warn = (file, msg) => warnings.push(`${relative(ROOT, file)}: ${msg}`);

for (const file of files) {
	const raw = readFileSync(file, 'utf8');
	const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!m) { err(file, 'frontmatter가 없습니다'); continue; }
	let fm;
	try { fm = parse(m[1]) ?? {}; } catch (e) { err(file, `frontmatter YAML 오류: ${e.message}`); continue; }
	const body = m[2];
	const slug = slugOf(file);
	const isGuideDoc = CATEGORY_DIRS.includes(slug.split('/')[0]);

	if (!fm.title) err(file, 'title이 없습니다');
	if (!fm.description) warn(file, 'description이 없습니다');

	if (isGuideDoc) {
		if (fm.category !== slug.split('/')[0]) err(file, `category(${fm.category})가 디렉터리(${slug.split('/')[0]})와 다릅니다`);
		if (!fm.status) err(file, 'status가 없습니다 (draft | review-required | reviewed)');
		if (!fm.lastVerified) err(file, 'lastVerified(공식 원문 확인일)가 없습니다');
		if (!Array.isArray(fm.legalBasis) || fm.legalBasis.length === 0) err(file, 'legalBasis가 비어 있습니다');

		// 필수 섹션이 지정된 순서로 있는지
		const headings = [...body.matchAll(/^## (.+)$/gm)].map((h) => h[1].trim());
		let cursor = -1;
		for (const s of REQUIRED_SECTIONS) {
			const idx = headings.indexOf(s);
			if (idx === -1) err(file, `필수 섹션 "## ${s}"이 없습니다`);
			else if (idx < cursor) err(file, `섹션 "## ${s}"의 순서가 올바르지 않습니다`);
			else cursor = idx;
		}
	}

	if (fm.status === 'reviewed' && !(fm.reviewedBy && fm.reviewedAt)) err(file, 'reviewed 상태에는 reviewedBy와 reviewedAt이 필요합니다');
	if (fm.status === 'reviewed' && fm.legalBasis?.some((b) => b.status !== 'verified')) err(file, 'reviewed 문서에 review-required 근거가 남아 있습니다');

	if (fm.lastVerified) {
		const d = new Date(fm.lastVerified);
		if (d > today) err(file, `lastVerified(${fm.lastVerified})가 미래 날짜입니다`);
		else if ((today - d) / 86400000 > STALE_DAYS) warn(file, `lastVerified가 ${STALE_DAYS}일을 넘었습니다. 원문 재확인 필요`);
	}

	for (const id of fm.sources ?? []) if (!sourceById.has(id)) err(file, `sources의 "${id}"가 data/sources.json에 없습니다`);
	for (const [i, b] of (fm.legalBasis ?? []).entries()) {
		const where = `legalBasis[${i}]`;
		if (!sourceById.has(b.source)) err(file, `${where}.source "${b.source}"가 레지스트리에 없습니다`);
		if (!BASIS_KINDS.has(b.kind)) err(file, `${where}.kind "${b.kind}"가 올바르지 않습니다`);
		if (!b.summary) err(file, `${where}.summary가 없습니다`);
		const s = sourceById.get(b.source);
		// 레지스트리에서 원문 미확인인 출처를 근거로 "verified" 표시할 수 없다
		if (s && s.verification !== 'verified' && b.status === 'verified') err(file, `${where}: 출처 "${b.source}"가 레지스트리에서 review-required인데 verified로 표시했습니다`);
		// 안내서·표준·권장사항을 법률 출처로, 또는 그 반대로 잘못 분류하지 않았는지
		if (s && ['law', 'decree', 'notice'].includes(s.kind) && !['law', 'decree', 'notice'].includes(b.kind)) warn(file, `${where}: 법령 출처인데 kind가 ${b.kind}입니다`);
		if (s && s.kind === 'guide' && b.kind !== 'guide') err(file, `${where}: 안내서 출처는 kind: guide여야 합니다`);
		if (s && s.kind === 'standard' && b.kind !== 'standard') err(file, `${where}: 기술 표준 출처는 kind: standard여야 합니다`);
		if ((b.kind === 'best-practice') !== (s?.kind === 'best-practice')) err(file, `${where}: 프로젝트 권장사항은 source: project, kind: best-practice로 짝지어야 합니다`);
	}

	for (const r of fm.related ?? []) if (!slugs.has(r.replace(/^\/|\/$/g, ''))) err(file, `related "${r}" 문서가 없습니다`);

	// 내부 링크 (/slug/ 또는 /slug/#anchor)
	for (const l of body.matchAll(/\]\((\/[^)\s#]*)(#[^)\s]*)?\)|href="(\/[^"#]*)/g)) {
		const target = (l[1] ?? l[3]).replace(/^\/|\/$/g, '');
		if (target && !slugs.has(target) && !target.startsWith('pagefind')) err(file, `깨진 내부 링크: /${target}/`);
	}
}

for (const w of warnings) console.warn(`WARN  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);
const guideCount = files.filter((f) => CATEGORY_DIRS.includes(slugOf(f).split('/')[0])).length;
console.log(`\n문서 ${files.length}개(카테고리 문서 ${guideCount}개) 검사: 오류 ${errors.length}, 경고 ${warnings.length}`);
process.exit(errors.length ? 1 : 0);
