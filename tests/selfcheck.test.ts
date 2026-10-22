import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUT, evaluate, toMarkdown, DISCLAIMER, type SelfCheckInput } from '../src/lib/selfcheck/rules';

const input = (over: Partial<SelfCheckInput>): SelfCheckInput => ({ ...DEFAULT_INPUT, ...over });
const ids = (fs: { id: string }[]) => fs.map((f) => f.id);

describe('selfcheck evaluate', () => {
	it('개인정보 미처리 응답은 해당 여부 재확인만 안내한다', () => {
		const r = evaluate(input({ collects: 'no' }));
		expect(ids(r.exceptions)).toEqual(['no-pii-confirm']);
		expect(r.requirements).toHaveLength(0);
	});

	it('처리 근거가 없으면 위험으로 표시한다', () => {
		const r = evaluate(input({ bases: [] }));
		expect(ids(r.risks)).toContain('basis-missing');
	});

	it('동의 근거는 고지사항·구분 동의를, 비동의 근거는 구분 공개를 요구한다', () => {
		const r = evaluate(input({ bases: ['consent', 'contract'] }));
		expect(ids(r.requirements)).toEqual(expect.arrayContaining(['consent-notice', 'non-consent-disclosure']));
		expect(ids(r.risks)).not.toContain('basis-missing');
	});

	it('주민등록번호는 근거·암호화·회원가입 대체수단을 안내한다', () => {
		const r = evaluate(input({ items: ['resident-number'], bases: ['legal-obligation'] }));
		expect(ids(r.requirements)).toEqual(expect.arrayContaining(['rrn', 'rrn-signup-alt']));
		expect(ids(r.risks)).toContain('rrn-risk');
	});

	it('개인별 활동 분석은 위험 + 관련 법령 예외 검토로 나온다', () => {
		const r = evaluate(input({ service: 'internal', employeeData: true, activity: 'individual', bases: ['contract'] }));
		expect(ids(r.risks)).toContain('individual-monitoring');
		expect(ids(r.exceptions)).toEqual(expect.arrayContaining(['monitoring-laws', 'hr-guideline']));
		expect(ids(r.requirements)).not.toContain('privacy-policy');
	});

	it('접근통제를 모두 갖추면 접근권한 관련 위험이 없다', () => {
		const r = evaluate(input({ bases: ['contract'], access: ['rbac', 'object-level', 'separated-admin', 'access-log', 'admin-mfa'] }));
		expect(ids(r.risks)).not.toEqual(expect.arrayContaining(['no-rbac']));
		expect(ids(r.risks).filter((id) => id.startsWith('no-'))).toHaveLength(0);
	});

	it('원문 그대로 외부 LLM 전송은 위험이며, 국외 이전 미선택 시 처리 지역 확인을 요구한다', () => {
		const r = evaluate(input({ llm: 'raw', bases: ['contract'] }));
		expect(ids(r.risks)).toContain('llm-raw');
		expect(ids(r.exceptions)).toContain('llm-region');
	});

	it('국외 이전과 위탁은 각각의 요건을 낸다', () => {
		const r = evaluate(input({ externalApi: 'processor', overseas: true, bases: ['contract'] }));
		expect(ids(r.requirements)).toEqual(expect.arrayContaining(['outsourcing', 'overseas']));
	});

	it('보존기간 미정은 위험, 파기 요건은 항상 포함한다', () => {
		const r = evaluate(input({ bases: ['contract'] }));
		expect(ids(r.risks)).toContain('retention-undefined');
		expect(ids(r.requirements)).toContain('destruction');
		expect(ids(evaluate(input({ bases: ['contract'], retention: 'automated' })).risks)).not.toContain('retention-undefined');
	});

	it('모든 결과 항목은 가이드 문서로 연결된다', () => {
		const r = evaluate(input({ items: ['sensitive', 'child', 'account', 'payment', 'location'], bases: ['consent', 'legitimate-interest'], llm: 'masked', disclosure: 'partner' }));
		for (const f of [...r.requirements, ...r.risks, ...r.exceptions, ...r.recommendations]) expect(f.doc).toBeTruthy();
		expect(r.docs.length).toBeGreaterThan(5);
	});
});

describe('toMarkdown', () => {
	it('면책 문구와 체크박스를 포함하고 승인·적합 표현을 쓰지 않는다', () => {
		const i = input({ bases: ['consent'], items: ['account'] });
		const md = toMarkdown(i, evaluate(i), (s) => `https://example.test/${s}/`);
		expect(md).toContain(DISCLAIMER);
		expect(md).toMatch(/^- \[ \] /m);
		expect(md).toContain('https://example.test/collection-consent/consent-ui/');
		expect(md).not.toMatch(/적합합니다|합법입니다|승인되었습니다|준수 완료/);
	});
});
