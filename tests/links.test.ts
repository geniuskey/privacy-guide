import { describe, expect, it } from 'vitest';
// @ts-expect-error 스크립트용 ESM 모듈(타입 선언 없음)
import { classify, classifyError, extractLinks } from '../scripts/lib/links.mjs';

describe('외부 링크 추출', () => {
	it('Markdown·href·자동 링크를 뽑고 중복을 없앤다', () => {
		const text = [
			'[법령](https://www.law.go.kr/법령/개인정보보호법) 참고.',
			'<a href="https://www.pipc.go.kr/">PIPC</a>',
			'<https://github.com/OWASP/ASVS>, 다시 [법령](https://www.law.go.kr/법령/개인정보보호법).',
		].join('\n');
		expect(extractLinks(text)).toEqual([
			'https://www.law.go.kr/법령/개인정보보호법',
			'https://www.pipc.go.kr/',
			'https://github.com/OWASP/ASVS',
		]);
	});

	it('코드 블록, 예시 도메인, 내부 링크는 제외한다', () => {
		const text = '```ts\nfetch("https://api.real.com/x")\n[a](https://inside.code.block)\n```\n[b](https://example.com/x) [c](/laws/pipa-overview/) [d](http://localhost:4321/)';
		expect(extractLinks(text)).toEqual([]);
	});
});

describe('상태 판정', () => {
	it('2xx·3xx는 정상, 403·429는 확인 필요, 나머지는 깨짐', () => {
		expect(classify(200)).toBe('ok');
		expect(classify(301)).toBe('ok');
		expect(classify(403)).toBe('unverified');
		expect(classify(429)).toBe('unverified');
		expect(classify(404)).toBe('broken');
		expect(classify(500)).toBe('broken');
		expect(classify(0)).toBe('broken');
	});

	it('중간 인증서 누락은 확인 필요, 연결 실패는 깨짐', () => {
		expect(classifyError('UNABLE_TO_VERIFY_LEAF_SIGNATURE')).toBe('unverified');
		expect(classifyError('ENOTFOUND')).toBe('broken');
		expect(classifyError('TimeoutError')).toBe('broken');
	});
});
