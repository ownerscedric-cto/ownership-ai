import { z } from 'zod';

// 카테고리 생성 스키마
export const createKeywordCategorySchema = z.object({
  name: z
    .string()
    .min(1, '카테고리 이름은 필수입니다')
    .max(50, '카테고리 이름은 50자 이하여야 합니다')
    .regex(/^[a-z_]+$/, '카테고리 이름은 영문 소문자와 언더스코어만 사용 가능합니다'),
  displayName: z
    .string()
    .min(1, '표시 이름은 필수입니다')
    .max(100, '표시 이름은 100자 이하여야 합니다'),
  color: z.enum(['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'gray'], {
    message: '유효한 색상을 선택해주세요',
  }),
  order: z.number().int().min(0).optional(),
});

// 카테고리 수정 스키마
export const updateKeywordCategorySchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  color: z.enum(['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'gray']).optional(),
  order: z.number().int().min(0).optional(),
});

// 키워드 생성 스키마
export const createKeywordSchema = z.object({
  categoryId: z.string().uuid('유효한 카테고리 ID가 아닙니다'),
  keyword: z.string().min(1, '키워드는 필수입니다').max(100, '키워드는 100자 이하여야 합니다'),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// 키워드 수정 스키마
export const updateKeywordSchema = z.object({
  keyword: z.string().min(1).max(100).optional(),
  categoryId: z.string().uuid().optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// 키워드 일괄 수정 스키마 (순서 변경용)
export const updateKeywordsOrderSchema = z.object({
  keywords: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().min(0),
    })
  ),
});

// TypeScript 타입 export
export type CreateKeywordCategoryInput = z.infer<typeof createKeywordCategorySchema>;
export type UpdateKeywordCategoryInput = z.infer<typeof updateKeywordCategorySchema>;
export type CreateKeywordInput = z.infer<typeof createKeywordSchema>;
export type UpdateKeywordInput = z.infer<typeof updateKeywordSchema>;
export type UpdateKeywordsOrderInput = z.infer<typeof updateKeywordsOrderSchema>;
