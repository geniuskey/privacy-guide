/**
 * 자가진단 규칙 엔진. 순수 함수만 사용하고 브라우저 밖으로 아무것도 보내지 않는다.
 * 결과는 "확인할 사항"이며 법률적 승인이나 적합성 판단이 아니다.
 */

export type YesNoUnsure = 'yes' | 'no' | 'unsure';

export const DATA_ITEMS = {
	'basic-contact': '이름·이메일·전화번호 등 기본 연락처',
	account: '계정 ID·비밀번호',
	'resident-number': '주민등록번호',
	'other-unique-id': '여권번호·운전면허번호·외국인등록번호',
	sensitive: '건강·생체인식·사상·정치적 견해 등 민감정보',
	location: '위치정보',
	payment: '결제·계좌 정보',
	'behavior-log': '서비스 이용기록·행동 로그',
	child: '만 14세 미만 아동의 정보',
} as const;
export type DataItem = keyof typeof DATA_ITEMS;

export const BASES = {
	consent: '정보주체 동의 (제15조제1항제1호)',
	'legal-obligation': '법률 규정·법령상 의무 (제2호)',
	contract: '계약 체결·이행 (제4호)',
	'legitimate-interest': '개인정보처리자의 정당한 이익 (제6호)',
	unsure: '아직 정하지 않음',
} as const;
export type Basis = keyof typeof BASES;

export const ACCESS_CONTROLS = {
	rbac: '역할 기반 권한(RBAC)',
	'object-level': '객체 단위 소유권 검증',
	'separated-admin': '시스템 관리 권한과 개인정보 열람 권한 분리',
	'access-log': '개인정보취급자 접속기록 보관·점검',
	'admin-mfa': '관리자 화면 다중 인증',
} as const;
export type AccessControl = keyof typeof ACCESS_CONTROLS;

export const DISCLOSURE = {
	private: '본인만',
	team: '담당 팀 내부',
	company: '사내 전체',
	partner: '외부 협력사·고객사',
	public: '인터넷 공개',
} as const;
export type Disclosure = keyof typeof DISCLOSURE;

export const EXTERNAL_API = {
	none: '외부로 보내지 않음',
	processor: '외부 업체가 우리 업무를 대신 처리 (예: 발송·호스팅 SaaS)',
	'third-party': '외부가 자기 목적으로 받아 감 (예: 제휴사 제공)',
	unsure: '잘 모르겠음',
} as const;
export type ExternalApi = keyof typeof EXTERNAL_API;

export const LLM_USE = {
	none: '사용하지 않음',
	'no-pii': '사용하지만 개인정보는 보내지 않음',
	masked: '개인정보를 탐지·마스킹한 뒤 보냄',
	raw: '개인정보가 포함된 원문을 그대로 보냄',
} as const;
export type LlmUse = keyof typeof LLM_USE;

export const RETENTION = {
	automated: '보존기간을 정했고 자동 파기함',
	manual: '보존기간을 정했지만 수동으로 파기함',
	undefined: '보존기간을 정하지 않음',
} as const;
export type Retention = keyof typeof RETENTION;

export const ACTIVITY = {
	none: '하지 않음',
	aggregate: '집계·통계만 봄',
	individual: '개인별로 분석·평가함',
} as const;
export type Activity = keyof typeof ACTIVITY;

export interface SelfCheckInput {
	service: 'internal' | 'external';
	collects: YesNoUnsure;
	items: DataItem[];
	bases: Basis[];
	employeeData: boolean;
	activity: Activity;
	access: AccessControl[];
	disclosure: Disclosure;
	externalApi: ExternalApi;
	overseas: boolean;
	llm: LlmUse;
	retention: Retention;
}

export const DEFAULT_INPUT: SelfCheckInput = {
	service: 'external',
	collects: 'yes',
	items: [],
	bases: [],
	employeeData: false,
	activity: 'none',
	access: [],
	disclosure: 'private',
	externalApi: 'none',
	overseas: false,
	llm: 'none',
	retention: 'undefined',
};

export interface Finding {
	id: string;
	text: string;
	/** 근거 표기. 법률 조문이면 law, 안내서·표준·권장사항은 그대로 표시 */
	basis?: string;
	doc?: string;
}

export interface SelfCheckResult {
	requirements: Finding[];
	recommendations: Finding[];
	risks: Finding[];
	exceptions: Finding[];
	docs: string[];
	checklist: string[];
}

const PIPA = '개인정보 보호법';
const NOTICE = '안전성 확보조치 기준(고시)';

export function evaluate(input: SelfCheckInput): SelfCheckResult {
	const r: SelfCheckResult = { requirements: [], recommendations: [], risks: [], exceptions: [], docs: [], checklist: [] };
	const req = (f: Finding) => r.requirements.push(f);
	const rec = (f: Finding) => r.recommendations.push(f);
	const risk = (f: Finding) => r.risks.push(f);
	const exc = (f: Finding) => r.exceptions.push(f);
	const has = (i: DataItem) => input.items.includes(i);
	const ctl = (c: AccessControl) => input.access.includes(c);

	if (input.collects === 'no' && !input.employeeData) {
		exc({
			id: 'no-pii-confirm',
			text: '개인정보를 처리하지 않는다고 답했습니다. IP 주소, 기기 식별자, 로그인 ID, 행동 로그처럼 다른 정보와 쉽게 결합해 개인을 알아볼 수 있는 정보도 개인정보에 해당할 수 있으니 다시 확인하세요.',
			basis: `${PIPA} 제2조제1호`,
			doc: 'laws/key-definitions',
		});
		return finalize(r);
	}
	if (input.collects === 'unsure') {
		exc({
			id: 'pii-unsure',
			text: '개인정보 해당 여부부터 판단하세요. "다른 정보와 쉽게 결합하여 알아볼 수 있는지"는 결합 가능성을 시간·비용·기술을 합리적으로 고려해 판단합니다.',
			basis: `${PIPA} 제2조제1호나목`,
			doc: 'laws/key-definitions',
		});
	}

	// 1. 처리 근거
	req({
		id: 'basis-mapping',
		text: '수집하는 항목마다 수집·이용 근거를 하나씩 정하고 기록하세요.',
		basis: `${PIPA} 제15조제1항`,
		doc: 'collection-consent/lawful-basis',
	});
	if (input.bases.length === 0 || input.bases.includes('unsure')) {
		risk({
			id: 'basis-missing',
			text: '처리 근거를 아직 정하지 않았습니다. 근거 없는 수집은 가장 기본적인 위반 위험입니다.',
			basis: `${PIPA} 제15조제1항`,
			doc: 'collection-consent/lawful-basis',
		});
	}
	if (input.bases.includes('consent')) {
		req({
			id: 'consent-notice',
			text: '동의를 받을 때 수집·이용 목적, 항목, 보유·이용 기간, 동의 거부권과 거부 시 불이익을 알리고, 동의 사항을 구분해 받아야 합니다.',
			basis: `${PIPA} 제15조제2항, 제22조제1항`,
			doc: 'collection-consent/consent-ui',
		});
	}
	if (input.bases.some((b) => b !== 'consent' && b !== 'unsure')) {
		req({
			id: 'non-consent-disclosure',
			text: '동의 없이 처리하는 항목은 그 항목과 법적 근거를 동의 기반 항목과 구분해 처리방침 등으로 공개해야 하며, 동의 없이 처리할 수 있다는 입증책임은 처리자에게 있습니다.',
			basis: `${PIPA} 제22조제3항`,
			doc: 'collection-consent/privacy-policy',
		});
	}
	if (input.bases.includes('legitimate-interest')) {
		exc({
			id: 'legitimate-interest',
			text: '정당한 이익 근거는 "명백하게 정보주체의 권리보다 우선"하고 "합리적인 범위를 초과하지 않는" 경우에만 쓸 수 있습니다. 판단 근거를 문서로 남기고 법무 검토를 받으세요.',
			basis: `${PIPA} 제15조제1항제6호`,
			doc: 'collection-consent/lawful-basis',
		});
	}
	if (input.service === 'external') {
		req({
			id: 'privacy-policy',
			text: '개인정보 처리방침을 정하고 공개해야 합니다. 새 항목·위탁·국외 이전이 생기면 함께 갱신하세요.',
			basis: `${PIPA} 제30조`,
			doc: 'collection-consent/privacy-policy',
		});
	}

	// 2. 항목별 요건
	if (has('sensitive')) {
		req({
			id: 'sensitive',
			text: '민감정보는 다른 개인정보와 별도로 동의를 받거나 법령에서 허용하는 경우에만 처리할 수 있고, 안전성 확보에 필요한 조치를 해야 합니다.',
			basis: `${PIPA} 제23조, 시행령 제18조`,
			doc: 'sensitive-data/sensitive-vs-personal',
		});
	}
	if (has('resident-number')) {
		req({
			id: 'rrn',
			text: '주민등록번호는 법률·시행령 등에서 구체적으로 요구·허용하는 경우 등에만 처리할 수 있습니다. 근거 조문이 없다면 수집하지 않는 설계로 바꾸세요. 처리한다면 암호화가 필요합니다.',
			basis: `${PIPA} 제24조의2, 시행령 제21조의2`,
			doc: 'sensitive-data/unique-identifiers',
		});
		if (input.service === 'external') {
			req({
				id: 'rrn-signup-alt',
				text: '주민등록번호를 처리할 근거가 있더라도, 인터넷 홈페이지 회원가입 단계에서는 주민등록번호 없이 가입할 수 있는 방법을 제공해야 합니다.',
				basis: `${PIPA} 제24조의2제3항`,
				doc: 'sensitive-data/unique-identifiers',
			});
		}
		risk({
			id: 'rrn-risk',
			text: '본인확인이나 회원 식별 목적이라면 주민등록번호 대신 본인확인기관 연계 결과값·내부 식별자를 쓰는 대체 설계를 검토하세요.',
			doc: 'sensitive-data/unique-identifiers',
		});
	}
	if (has('other-unique-id')) {
		req({
			id: 'unique-id',
			text: '고유식별정보는 별도 동의 또는 법령의 구체적 요구·허용이 있어야 처리할 수 있고, 암호화 등 안전성 확보조치가 필요합니다.',
			basis: `${PIPA} 제24조, 시행령 제19조·제21조`,
			doc: 'sensitive-data/unique-identifiers',
		});
	}
	if (has('child')) {
		req({
			id: 'child',
			text: '만 14세 미만 아동의 개인정보를 동의 근거로 처리하려면 법정대리인의 동의를 받아야 합니다. 연령 확인 흐름과 법정대리인 동의 확인 방법을 설계하세요.',
			basis: `${PIPA} 제22조의2, 시행령 제17조의2`,
			doc: 'collection-consent/children',
		});
	}
	if (has('account')) {
		req({
			id: 'password',
			text: '비밀번호 등 인증정보는 저장·송수신 시 암호화해야 하고, 비밀번호는 복호화되지 않도록 일방향 암호화해 저장해야 합니다.',
			basis: `${NOTICE} 제7조`,
			doc: 'storage-retention/encryption',
		});
		rec({
			id: 'session',
			text: '세션 쿠키에 HttpOnly·Secure·SameSite를 설정하고, 로그인 시 세션을 재발급하고, 유휴·절대 만료 시간을 두세요.',
			basis: 'OWASP ASVS 5.0 V7 (기술 표준 권고)',
			doc: 'auth-access/authentication-session',
		});
	}
	if (has('location')) {
		exc({
			id: 'location',
			text: '위치정보는 「위치정보의 보호 및 이용 등에 관한 법률」의 별도 요건이 적용될 수 있습니다. 이 가이드는 해당 법률의 조문을 아직 대조하지 않았으므로 원문 확인과 법무 검토가 필요합니다. (review-required)',
			doc: 'laws/related-laws',
		});
	}
	if (has('payment')) {
		req({
			id: 'payment-encrypt',
			text: '이용자의 신용카드번호·계좌번호를 저장한다면 안전한 암호 알고리즘으로 암호화해야 합니다.',
			basis: `${NOTICE} 제7조제2항`,
			doc: 'storage-retention/encryption',
		});
		exc({
			id: 'payment',
			text: '결제·계좌 정보는 전자금융·신용정보 관련 법령과 결제대행사 계약 조건이 함께 적용될 수 있습니다. 직접 저장하지 않고 결제대행사 토큰을 쓰는 설계를 우선 검토하세요. (review-required)',
			doc: 'laws/related-laws',
		});
	}
	if (has('behavior-log')) {
		rec({
			id: 'behavior-log',
			text: '이용기록·행동 로그도 계정과 연결되면 개인정보입니다. 수집 목적과 보존기간을 정하고, 분석용으로는 가명처리하거나 집계하세요.',
			basis: `${PIPA} 제3조, 제28조의2`,
			doc: 'sensitive-data/pseudonymization',
		});
	}

	// 3. 직원 데이터·활동 분석
	if (input.employeeData || input.service === 'internal') {
		req({
			id: 'employee-basis',
			text: '직원 정보도 개인정보 보호법이 적용됩니다. 근로계약 이행·법령상 의무 등 항목별 처리 근거를 정하고, 인사 목적 외 사용을 제한하세요.',
			basis: `${PIPA} 제15조, 제18조`,
			doc: 'internal-admin/employee-data',
		});
		exc({
			id: 'hr-guideline',
			text: '개인정보 보호 가이드라인(인사·노무편)의 해석과 근로관계 법령 적용 여부를 확인하세요. (안내서 원문 대조 전, review-required)',
			doc: 'internal-admin/employee-data',
		});
	}
	if (input.activity === 'individual') {
		risk({
			id: 'individual-monitoring',
			text: '개인별 활동 분석은 직원·이용자의 예상 범위를 넘기 쉬운 고위험 처리입니다. 목적을 좁히고, 집계·익명화로 같은 목적을 달성할 수 있는지 먼저 검토하세요.',
			basis: `${PIPA} 제3조(최소처리 원칙)`,
			doc: 'internal-admin/activity-monitoring',
		});
		exc({
			id: 'monitoring-laws',
			text: '이메일·메신저 내용 열람은 통신비밀보호법, 근로자 감시 설비 도입은 근로자참여법상 노사협의회 협의사항에 해당하는지 확인이 필요합니다. (review-required)',
			doc: 'laws/related-laws',
		});
	}

	// 4. 접근권한
	if (!ctl('rbac')) {
		risk({
			id: 'no-rbac',
			text: '개인정보처리시스템 접근 권한을 업무에 따라 차등 부여하는 구조가 없습니다.',
			basis: `${NOTICE} 제5조`,
			doc: 'auth-access/access-control',
		});
	}
	if (!ctl('object-level')) {
		risk({
			id: 'no-object-level',
			text: '객체 단위 소유권 검증이 없으면 ID만 바꿔 다른 사람의 데이터를 조회하는 취약점(IDOR/BOLA)이 생깁니다.',
			basis: 'OWASP ASVS 5.0 V8 (기술 표준 권고)',
			doc: 'auth-access/object-level-authorization',
		});
	}
	if (!ctl('separated-admin')) {
		rec({
			id: 'separated-admin',
			text: '시스템 관리 권한(계정·설정)과 개인정보 열람 권한을 분리하고, 예외 열람은 사유·기간·감사로그를 남기세요.',
			basis: '프로젝트 권장사항',
			doc: 'internal-admin/admin-vs-data-access',
		});
	}
	if (!ctl('access-log')) {
		risk({
			id: 'no-access-log',
			text: '개인정보취급자의 개인정보처리시스템 접속기록을 보관·점검해야 합니다. 보관 기간과 점검 주기는 고시 원문을 확인하세요.',
			basis: `${NOTICE} 제8조`,
			doc: 'storage-retention/access-logs',
		});
	}
	if (!ctl('admin-mfa')) {
		rec({
			id: 'admin-mfa',
			text: '관리자·개인정보취급자 화면에 다중 인증 등 안전한 인증수단을 적용하세요. 외부에서 접속하는 경우 고시의 요건을 확인하세요.',
			basis: `${NOTICE} 제6조`,
			doc: 'auth-access/authentication-session',
		});
	}

	// 5. 공개 범위
	if (input.disclosure === 'company' || input.disclosure === 'public') {
		risk({
			id: 'wide-disclosure',
			text: `공개 범위가 "${DISCLOSURE[input.disclosure]}"입니다. 업무상 필요한 사람에게만 보이도록 범위를 줄이거나, 공개용 데이터는 집계·익명화하고 소규모 집단은 숨기세요.`,
			basis: `${PIPA} 제3조, 제58조의2`,
			doc: 'data-sharing/public-data-and-downloads',
		});
	}
	if (input.disclosure === 'partner') {
		req({
			id: 'partner-provision',
			text: '외부 협력사·고객사가 개인정보를 보게 되면 제3자 제공 또는 업무위탁 중 무엇인지 판단하고 그에 맞는 근거와 절차를 갖추세요.',
			basis: `${PIPA} 제17조, 제26조`,
			doc: 'data-sharing/provision-vs-outsourcing',
		});
	}
	if (input.disclosure !== 'private') {
		rec({
			id: 'download-control',
			text: '개인정보 다운로드 상황은 내부 관리계획에 정한 주기·방법으로 확인·점검해야 합니다. 대량 조회·다운로드에는 사유 입력과 건수 제한도 두는 것을 권장합니다.',
			basis: `${NOTICE} 제8조제2항 (사유 입력·건수 제한은 프로젝트 권장사항)`,
			doc: 'data-sharing/public-data-and-downloads',
		});
	}

	// 6. 외부 전송
	if (input.externalApi === 'processor') {
		req({
			id: 'outsourcing',
			text: '업무위탁이라면 위탁 문서에 필요한 사항을 정하고, 위탁 업무 내용과 수탁자를 공개하고, 수탁자를 관리·감독해야 합니다.',
			basis: `${PIPA} 제26조, 시행령 제28조`,
			doc: 'data-sharing/provision-vs-outsourcing',
		});
	}
	if (input.externalApi === 'third-party') {
		req({
			id: 'third-party',
			text: '제3자 제공은 별도 근거(동의 등)가 필요하고, 동의로 제공할 때는 제공받는 자, 목적, 항목, 보유기간 등을 알려야 합니다.',
			basis: `${PIPA} 제17조`,
			doc: 'data-sharing/provision-vs-outsourcing',
		});
	}
	if (input.externalApi === 'unsure') {
		exc({
			id: 'transfer-unsure',
			text: '외부 전송이 위탁인지 제3자 제공인지에 따라 필요한 절차가 다릅니다. 받는 쪽이 누구의 목적으로 처리하는지 확인하세요. (사안별 판단, review-required)',
			doc: 'data-sharing/provision-vs-outsourcing',
		});
	}
	if (input.overseas) {
		req({
			id: 'overseas',
			text: '개인정보가 국외로 이전(국외 리전 저장, 해외 SaaS·API 포함)된다면 국외 이전 요건 중 어떤 근거에 해당하는지 확인하고 처리방침 등에 공개하세요.',
			basis: `${PIPA} 제28조의8`,
			doc: 'data-sharing/cross-border-transfer',
		});
	}

	// 7. 외부 LLM
	if (input.llm !== 'none') {
		rec({
			id: 'llm-vendor',
			text: 'LLM 제공자의 입력 데이터 학습 이용 여부, 보존 기간, 처리 지역을 계약·설정에서 확인하고 기록하세요.',
			basis: '생성형 AI 개인정보 처리 안내서(2025.8.) — 원문 대조 전, review-required',
			doc: 'ai-llm/llm-api-integration',
		});
	}
	if (input.llm === 'raw') {
		risk({
			id: 'llm-raw',
			text: '개인정보가 담긴 원문을 그대로 외부 LLM에 보내고 있습니다. 필드 허용목록과 전송 전 개인정보 탐지·마스킹을 적용하세요. 전송이 위탁·제3자 제공·국외 이전 중 무엇인지도 판단해야 합니다.',
			basis: `${PIPA} 제3조, 제17조, 제26조, 제28조의8`,
			doc: 'ai-llm/llm-api-integration',
		});
	}
	if (input.llm === 'masked' || input.llm === 'no-pii') {
		rec({
			id: 'llm-filter-test',
			text: '"개인정보를 보내지 않는다"는 전제를 테스트로 고정하세요. 가짜 LLM 클라이언트로 실제 전송 payload를 검사하는 테스트가 효과적입니다.',
			basis: '프로젝트 권장사항',
			doc: 'ai-llm/llm-api-integration',
		});
	}
	if (input.llm !== 'none' && input.overseas === false) {
		exc({
			id: 'llm-region',
			text: '국외 이전이 없다고 답했지만, 외부 LLM API의 처리 지역이 국외라면 국외 이전에 해당할 수 있습니다. 제공자의 처리 지역을 확인하세요.',
			basis: `${PIPA} 제28조의8`,
			doc: 'data-sharing/cross-border-transfer',
		});
	}

	// 8. 보존·파기
	req({
		id: 'destruction',
		text: '보유기간이 지나거나 처리 목적을 달성해 불필요해진 개인정보는 지체 없이 파기하고, 다른 법령에 따라 보존해야 하면 분리해 저장·관리해야 합니다.',
		basis: `${PIPA} 제21조, 시행령 제16조`,
		doc: 'storage-retention/retention-destruction',
	});
	if (input.retention === 'undefined') {
		risk({
			id: 'retention-undefined',
			text: '보존기간을 정하지 않았습니다. 항목별 보존기간과 근거(목적 달성, 개별 법령의 보존 의무)를 정하세요.',
			basis: `${PIPA} 제21조`,
			doc: 'storage-retention/retention-destruction',
		});
	}
	if (input.retention === 'manual') {
		rec({
			id: 'retention-automate',
			text: '수동 파기는 누락되기 쉽습니다. 만료 데이터를 찾는 배치와 파기 결과 기록을 자동화하고, 백업·로그·검색 인덱스까지 범위를 확인하세요.',
			basis: '프로젝트 권장사항',
			doc: 'storage-retention/retention-destruction',
		});
	}

	// 공통
	rec({
		id: 'breach-ready',
		text: '유출등이 발생했거나 그 가능성을 알게 된 경우의 통지·신고 절차를 미리 정하세요. 2026.9.11. 시행 개정법은 유출 가능성 통지를 새로 규정합니다.',
		basis: `${PIPA} 제34조, 시행령 제39조~제40조`,
		doc: 'storage-retention/breach-response',
	});
	rec({
		id: 'log-masking',
		text: '애플리케이션 로그·에러 트래커에 개인정보와 인증 토큰이 남지 않도록 마스킹 필터를 적용하세요.',
		basis: 'OWASP ASVS 5.0 V16 (기술 표준 권고)',
		doc: 'app-security/log-masking',
	});
	rec({
		id: 'minimal-response',
		text: 'API 응답은 화면에 필요한 필드만 허용목록으로 반환하세요.',
		basis: `${PIPA} 제3조제1항(최소 수집 원칙) · OWASP ASVS 5.0 V4`,
		doc: 'app-security/minimal-response',
	});
	if (input.service === 'external') {
		rec({
			id: 'rights',
			text: '열람·정정·삭제·처리정지 요청을 처리하는 기능과 절차를 준비하세요.',
			basis: `${PIPA} 제35조~제38조`,
			doc: 'app-security/data-subject-rights',
		});
	}

	return finalize(r);
}

function finalize(r: SelfCheckResult): SelfCheckResult {
	const all = [...r.requirements, ...r.risks, ...r.exceptions, ...r.recommendations];
	r.docs = [...new Set(all.map((f) => f.doc).filter((d): d is string => !!d))];
	r.checklist = [
		...r.risks.map((f) => `[위험] ${f.text}`),
		...r.requirements.map((f) => `[법적 요건 확인] ${f.text}`),
		...r.exceptions.map((f) => `[예외·추가 검토] ${f.text}`),
		...r.recommendations.map((f) => `[권장] ${f.text}`),
	];
	return r;
}

export const DISCLAIMER =
	'이 결과는 입력한 답변을 바탕으로 확인할 사항을 정리한 것으로, 법률 자문이나 적합성 인증이 아닙니다. 최종 판단은 공식 원문과 사내 법무·개인정보 보호책임자의 검토를 거치세요.';

export function toMarkdown(input: SelfCheckInput, result: SelfCheckResult, docUrl: (slug: string) => string): string {
	const line = (f: Finding) => `- [ ] ${f.text}${f.basis ? ` _(근거: ${f.basis})_` : ''}${f.doc ? ` — [가이드](${docUrl(f.doc)})` : ''}`;
	const section = (title: string, items: Finding[]) => (items.length ? [`## ${title}`, '', ...items.map(line), ''] : []);
	return [
		'# 개인정보·보안 개발 체크리스트',
		'',
		`> ${DISCLAIMER}`,
		'',
		`- 서비스 유형: ${input.service === 'internal' ? '사내 서비스' : '외부 서비스'}`,
		`- 수집 항목: ${input.items.map((i) => DATA_ITEMS[i]).join(', ') || '없음/미선택'}`,
		`- 처리 근거: ${input.bases.map((b) => BASES[b]).join(', ') || '미선택'}`,
		`- 공개 범위: ${DISCLOSURE[input.disclosure]} · 외부 전송: ${EXTERNAL_API[input.externalApi]}${input.overseas ? ' (국외 포함)' : ''}`,
		`- 외부 LLM: ${LLM_USE[input.llm]} · 보존·파기: ${RETENTION[input.retention]}`,
		'',
		...section('위험하거나 누락된 항목', result.risks),
		...section('확인해야 할 법률 요건', result.requirements),
		...section('확인이 필요한 예외사항', result.exceptions),
		...section('설계 권장 사항', result.recommendations),
	].join('\n');
}
