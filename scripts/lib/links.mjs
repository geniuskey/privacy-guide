// 외부 링크 점검용 URL 추출과 판정. check-links.mjs와 테스트가 함께 쓴다.

// Markdown 링크 [text](https://...), MDX/HTML href="https://...", 꺾쇠 자동 링크 <https://...>
const LINK_PATTERNS = [/\]\((https?:\/\/[^)\s]+)\)/g, /href="(https?:\/\/[^"]+)"/g, /<(https?:\/\/[^>\s]+)>/g];

// 예시·자리표시 도메인은 점검하지 않는다
const SKIP_HOSTS = /(^|\.)(example\.(com|org|net)|localhost|127\.0\.0\.1)$/;

export function extractLinks(text) {
	// 코드 블록 안의 URL은 예시 코드이므로 제외
	const prose = text.replace(/```[\s\S]*?```/g, '');
	const out = new Set();
	for (const p of LINK_PATTERNS) for (const m of prose.matchAll(p)) out.add(m[1].replace(/[.,;]+$/, ''));
	return [...out].filter((u) => {
		try {
			return !SKIP_HOSTS.test(new URL(u).hostname);
		} catch {
			return false;
		}
	});
}

/** 상태 코드 판정. 403/429는 봇 차단·속도 제한일 수 있어 깨짐이 아니라 "확인 필요"로 둔다. */
export function classify(status) {
	if (status >= 200 && status < 400) return 'ok';
	if (status === 403 || status === 429) return 'unverified';
	return 'broken';
}

// 서버가 중간 인증서를 보내지 않는 경우: 브라우저는 AIA로 보완해 열리지만 Node는 거부한다. 링크가 깨진 것은 아니다.
const TLS_CHAIN_ERRORS = new Set(['UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY']);

/** 요청 자체가 실패했을 때의 판정 */
export const classifyError = (code) => (TLS_CHAIN_ERRORS.has(code) ? 'unverified' : 'broken');
