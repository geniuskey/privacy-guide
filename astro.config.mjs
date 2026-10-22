// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import { unified } from '@astrojs/markdown-remark';
import rehypeBaseLinks from './src/plugins/rehype-base-links.mjs';

// 배포 위치는 환경변수로 바꾼다.
// - GitHub Pages 기본 주소: SITE_URL=https://geniuskey.github.io BASE_PATH=/privacy-guide
// - 커스텀 도메인:          SITE_URL=https://privacy.euiyun.com BASE_PATH=/
const site = process.env.SITE_URL ?? 'https://geniuskey.github.io';
const base = process.env.BASE_PATH ?? '/privacy-guide';
const repo = 'https://github.com/geniuskey/privacy-guide';

const category = (label, directory) => ({ label, collapsed: false, items: [{ autogenerate: { directory } }] });

export default defineConfig({
	site,
	base,
	trailingSlash: 'always',
	markdown: { processor: unified({ rehypePlugins: [[rehypeBaseLinks, { base }]] }) },
	integrations: [
		starlight({
			title: 'Korea Privacy Dev Guide',
			description: '한국에서 웹 서비스를 만드는 개발자를 위한 개인정보 보호·정보보안 실무 가이드',
			defaultLocale: 'root',
			locales: { root: { label: '한국어', lang: 'ko' } },
			logo: { src: './src/assets/logo.svg', replacesTitle: false },
			social: [{ icon: 'github', label: 'GitHub', href: repo }],
			editLink: { baseUrl: `${repo}/edit/main/` },
			lastUpdated: true,
			customCss: ['./src/styles/custom.css'],
			components: {
				PageTitle: './src/components/overrides/PageTitle.astro',
				MarkdownContent: './src/components/overrides/MarkdownContent.astro',
			},
			sidebar: [
				{
					label: '시작하기',
					items: [
						{ label: '이 가이드 사용법', slug: 'start/how-to-use' },
						{ label: '자가진단', slug: 'self-check' },
						{ label: '상황별 찾기', slug: 'start/by-situation' },
						{ label: '상세 검색', slug: 'start/search' },
					],
				},
				category('1. 개인정보 보호법과 관련 법령', 'laws'),
				category('2. 수집·이용 및 동의', 'collection-consent'),
				category('3. 개인정보와 민감정보', 'sensitive-data'),
				category('4. 인증 및 접근권한', 'auth-access'),
				category('5. 사내 관리자와 직원 정보', 'internal-admin'),
				category('6. 공개·공유·제3자 제공', 'data-sharing'),
				category('7. 저장·암호화·로그·파기', 'storage-retention'),
				category('8. API·DB·웹 보안', 'app-security'),
				category('9. 생성형 AI·LLM', 'ai-llm'),
				category('10. 프로젝트 사례', 'case-studies'),
				{
					label: '개발 도구',
					items: [
						{ label: '구현 예제', slug: 'tools/examples' },
						{ label: 'AI 에이전트 Skill', slug: 'tools/agent-skill' },
						{ label: '보안 코드리뷰 체크리스트', slug: 'tools/code-review-checklist' },
					],
				},
				{ label: '프로젝트 정보', collapsed: true, items: [{ autogenerate: { directory: 'about' } }] },
			],
		}),
		react(),
	],
});
