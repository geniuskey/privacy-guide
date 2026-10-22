import sourcesJson from '../../data/sources.json';

export const CATEGORIES = [
	{ id: 'laws', label: '개인정보 보호법과 관련 법령', dir: 'laws' },
	{ id: 'collection-consent', label: '수집·이용 및 동의', dir: 'collection-consent' },
	{ id: 'sensitive-data', label: '개인정보와 민감정보의 구분', dir: 'sensitive-data' },
	{ id: 'auth-access', label: '사용자 인증 및 접근권한', dir: 'auth-access' },
	{ id: 'internal-admin', label: '사내 관리자 권한과 직원 정보', dir: 'internal-admin' },
	{ id: 'data-sharing', label: '데이터 공개·공유·제3자 제공', dir: 'data-sharing' },
	{ id: 'storage-retention', label: '저장·암호화·로그·보존·파기', dir: 'storage-retention' },
	{ id: 'app-security', label: 'API·DB·웹 애플리케이션 보안', dir: 'app-security' },
	{ id: 'ai-llm', label: '생성형 AI 및 LLM API 연동', dir: 'ai-llm' },
	{ id: 'case-studies', label: '개발 프로젝트별 실제 사례', dir: 'case-studies' },
] as const;

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as unknown as [
	(typeof CATEGORIES)[number]['id'],
	...(typeof CATEGORIES)[number]['id'][],
];

export const DOC_STATUSES = ['draft', 'review-required', 'reviewed'] as const;
export type DocStatus = (typeof DOC_STATUSES)[number];

export const BASIS_KINDS = ['law', 'decree', 'notice', 'guide', 'standard', 'best-practice'] as const;
export type BasisKind = (typeof BASIS_KINDS)[number];

export const BASIS_KIND_LABEL: Record<BasisKind, string> = {
	law: '법률',
	decree: '시행령',
	notice: '고시',
	guide: '행정기관 안내서',
	standard: '기술 표준',
	'best-practice': '프로젝트 권장사항',
};

/** 법적 구속력이 있는 근거인지. 안내서·표준·모범사례는 "의무"로 표시하지 않는다. */
export const isBinding = (kind: BasisKind) => kind === 'law' || kind === 'decree' || kind === 'notice';

export const STATUS_LABEL: Record<DocStatus, string> = {
	draft: '작성 중',
	'review-required': '검토 필요',
	reviewed: '검토 완료',
};

export interface Source {
	id: string;
	title: string;
	kind: string;
	publisher: string;
	url: string;
	version?: string;
	promulgatedAt?: string;
	effectiveAt?: string;
	lastChecked: string;
	verification: 'verified' | 'review-required';
	/** false: 발행기관이 과거 판으로 분류한 자료 */
	current?: boolean;
	notes?: string;
}

export const SOURCES: Source[] = sourcesJson.sources as Source[];
const byId = new Map(SOURCES.map((s) => [s.id, s]));
export const getSource = (id: string) => byId.get(id);
