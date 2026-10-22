#!/usr/bin/env node
// check-sources.mjs 보고서를 GitHub Issue로 만든다. 같은 제목의 열린 이슈가 있으면 새로 만들지 않는다.
// 사용법: GH_TOKEN=... node scripts/report-to-issues.mjs source-report.json [--dry-run]
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { articleLabel } from './lib/law-text.mjs';

const [file] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const dryRun = process.argv.includes('--dry-run');
const report = JSON.parse(readFileSync(file, 'utf8'));

const gh = (args) => execFileSync('gh', args, { encoding: 'utf8' });
const openTitles = dryRun
	? new Set()
	: new Set(JSON.parse(gh(['issue', 'list', '--state', 'open', '--label', 'source-watch', '--limit', '200', '--json', 'title'])).map((i) => i.title));

const ensureLabels = () => {
	for (const [name, color, desc] of [
		['source-watch', '1d76db', '공식 출처 변경 감지'],
		['review-required', 'fbca04', '법률·사실 검토 필요'],
	]) {
		try { gh(['label', 'create', name, '--color', color, '--description', desc]); } catch { /* 이미 있음 */ }
	}
};

const docsTable = (docs) =>
	docs.length
		? ['| 문서 | 변경 조문 인용 |', '| --- | --- |', ...docs.map((d) => `| \`${d.slug}\` | ${d.citedChangedArticles.length ? d.citedChangedArticles.map(articleLabel).join(', ') : '-'} |`)].join('\n')
		: '영향 문서 없음';

const REVIEW_STEPS = `
### 검토 절차
1. 공식 원문(국가법령정보센터·발행기관)에서 변경 내용과 **시행일**을 확인한다. 시행 전이면 현재 의무로 쓰지 않는다.
2. 위 문서에서 영향받는 서술을 고치고, \`legalBasis\`의 상태와 \`lastVerified\`를 갱신한다.
3. \`data/sources.json\`의 version/effectiveAt/lastChecked를 갱신하고 \`node scripts/check-sources.mjs --update-snapshots\`로 스냅샷을, \`node scripts/build-skill-references.mjs\`로 Skill 원문 발췌를 갱신한다.
4. AI로 변경 비교 초안을 만들 수 있지만, 검토자 승인 전에는 확정 내용으로 병합하지 않는다.
`;

const issues = [];
for (const c of report.changes) {
	issues.push({
		title: `[출처 변경] ${c.title} → ${c.to.number}`,
		body: [
			`**${c.title}**의 ${c.kind === 'text' ? '조문 텍스트' : '버전'} 변경을 감지했습니다 (${report.checkedAt}).`,
			'',
			`- 이전: ${c.from.number ?? '-'} ${c.from.effectiveAt ? `(시행 ${c.from.effectiveAt})` : ''}`,
			`- 현재: ${c.to.number} ${c.to.effectiveAt ? `(${c.kind === 'guide' ? '게시' : '시행'} ${c.to.effectiveAt})` : ''}`,
			c.changedArticles.length ? `- 변경 조문: ${c.changedArticles.join(', ')}` : '',
			c.url ? `- 게시글: ${c.url}` : '',
			'',
			'### 검토가 필요한 문서',
			docsTable(c.affectedDocs),
			REVIEW_STEPS,
		].join('\n'),
	});
}
for (const u of report.upcoming) {
	issues.push({
		title: `[시행 예정] ${u.title} 제${u.number}호 (${u.effectiveAt})`,
		body: [`${u.title}의 시행 예정 개정(제${u.number}호, ${u.effectiveAt} 시행)이 공포되었습니다.`, '', '시행일 전까지 문서에는 "시행 예정"으로만 표시합니다.', '', '### 관련 문서', docsTable(u.affectedDocs)].join('\n'),
	});
}
for (const m of report.manualDue) {
	issues.push({
		title: `[정기 확인] ${m.title}`,
		body: [
			m.reason ? `${m.reason}. 마지막 확인일 ${m.lastChecked}.` : `공식 API가 없어 자동 비교하지 않는 출처입니다. 마지막 확인일 ${m.lastChecked}(${m.ageDays}일 전).`,
			'',
			`- 발행기관 페이지: ${m.url}`,
			'- 최신판 발행 여부, 원문 URL, 버전을 확인하고 `data/sources.json`의 `lastChecked`를 갱신하세요.',
			'',
			'### 관련 문서',
			docsTable(m.affectedDocs),
		].join('\n'),
	});
}
if (report.errors.length) {
	issues.push({ title: `[감지 오류] 출처 확인 실패 ${report.checkedAt.slice(0, 7)}`, body: report.errors.map((e) => `- ${e.id}: ${e.message}`).join('\n') });
}

if (!dryRun && issues.length) ensureLabels();
for (const i of issues) {
	if (openTitles.has(i.title)) { console.log(`skip (open): ${i.title}`); continue; }
	if (dryRun) { console.log(`--- ${i.title}\n${i.body}\n`); continue; }
	gh(['issue', 'create', '--title', i.title, '--body', i.body, '--label', 'source-watch', '--label', 'review-required']);
	console.log(`created: ${i.title}`);
}
if (!issues.length) console.log('새 이슈 없음');
