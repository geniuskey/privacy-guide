import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { CATEGORY_IDS, BASIS_KINDS, DOC_STATUSES } from './lib/content-model';

/**
 * 법적 근거 한 건. kind로 "법률상 의무"와 "권고/모범사례"를 구분한다.
 * - law / decree / notice: 법령·시행령·고시 (법적 구속력)
 * - guide: 행정기관 안내서 (해석·권고)
 * - standard: OWASP 등 기술 표준 (권고)
 * - best-practice: 이 프로젝트 자체 모범사례 (법적 의무 아님)
 */
const legalBasis = z.object({
	source: z.string(),
	article: z.string().optional(),
	kind: z.enum(BASIS_KINDS),
	summary: z.string(),
	status: z.enum(['verified', 'review-required']).default('review-required'),
});

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: z.object({
				category: z.enum(CATEGORY_IDS).optional(),
				/** draft: 작성 중 · review-required: 법률 검토 전 · reviewed: 검토자 승인 완료 */
				status: z.enum(DOC_STATUSES).optional(),
				/** 공식 원문과 대조한 마지막 날짜 (문서 수정일과 별개) */
				lastVerified: z.coerce.date().optional(),
				reviewedBy: z.string().optional(),
				reviewedAt: z.coerce.date().optional(),
				legalBasis: z.array(legalBasis).default([]),
				sources: z.array(z.string()).default([]),
				related: z.array(z.string()).default([]),
				tags: z.array(z.string()).default([]),
			}),
		}),
	}),
};
