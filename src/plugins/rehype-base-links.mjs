// 문서 안의 루트 상대 링크(/laws/...)에 배포 base 경로를 붙인다.
// 콘텐츠 작성자는 base를 신경 쓰지 않고 "/카테고리/문서/" 형식으로 링크하면 된다.
export default function rehypeBaseLinks({ base = '/' } = {}) {
	const prefix = base.replace(/\/$/, '');
	const visit = (node) => {
		if (node.type === 'element' && node.tagName === 'a') {
			const href = node.properties?.href;
			if (prefix && typeof href === 'string' && href.startsWith('/') && !href.startsWith('//') && !href.startsWith(`${prefix}/`)) {
				node.properties.href = prefix + href;
			}
		}
		// MDX 컴포넌트(<LinkCard href="/...">)의 href/link 속성도 처리
		if ((node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && prefix) {
			for (const attr of node.attributes ?? []) {
				if ((attr.name === 'href' || attr.name === 'link') && typeof attr.value === 'string' && attr.value.startsWith('/') && !attr.value.startsWith('//') && !attr.value.startsWith(`${prefix}/`)) {
					attr.value = prefix + attr.value;
				}
			}
		}
		node.children?.forEach(visit);
	};
	return (tree) => visit(tree);
}
