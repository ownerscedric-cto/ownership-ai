import { z } from 'zod';

// 사업자등록번호 검증 (10자리 숫자)
const businessNumberRegex = /^\d{10}$/;
// 법인등록번호 검증 (13자리 숫자)
const corporateNumberRegex = /^\d{13}$/;

// 사업자 유형 enum
export const BusinessType = {
  INDIVIDUAL: 'INDIVIDUAL', // 개인사업자
  CORPORATE: 'CORPORATE', // 법인사업자
} as const;

export type BusinessType = (typeof BusinessType)[keyof typeof BusinessType];

// 고객 생성 스키마
export const createCustomerSchema = z.object({
  // 사업자 정보 (필수)
  businessNumber: z.string().regex(businessNumberRegex, '사업자등록번호는 10자리 숫자여야 합니다'),
  businessType: z.enum(['INDIVIDUAL', 'CORPORATE'], {
    message: '개인사업자 또는 법인사업자를 선택해주세요',
  }),
  // 법인등록번호 - 빈 문자열 허용 (개인사업자는 빈 값)
  corporateNumber: z
    .union([
      z.literal(''),
      z.string().regex(corporateNumberRegex, '법인등록번호는 13자리 숫자여야 합니다'),
    ])
    .optional()
    .nullable(),
  name: z.string().min(1, '사업자명/상호는 필수입니다'),

  // 기업 정보
  industry: z.string().min(1, '업종은 필수입니다'),
  companySize: z.string().optional(),
  location: z.string().min(1, '지역은 필수입니다'),
  budget: z.number().int().positive().optional(),

  // 관심 키워드 (필수 - 최소 1개 이상)
  keywords: z.array(z.string()).min(1, '최소 1개 이상의 키워드를 선택해주세요'),

  // 연락처 정보 (선택) - 빈 문자열 허용
  contactEmail: z
    .union([z.literal(''), z.string().email('올바른 이메일 형식이 아닙니다')])
    .optional(),
  contactPhone: z.string().optional(),

  // 기타 (선택)
  notes: z.string().optional(),
});

// 고객 수정 스키마 (모든 필드 선택적, refine 검증 제거)
export const updateCustomerSchema = z.object({
  businessNumber: z
    .string()
    .regex(businessNumberRegex, '사업자등록번호는 10자리 숫자여야 합니다')
    .optional(),
  businessType: z
    .enum(['INDIVIDUAL', 'CORPORATE'], {
      message: '개인사업자 또는 법인사업자를 선택해주세요',
    })
    .optional(),
  // 법인등록번호 - 빈 문자열 허용 (개인사업자는 빈 값)
  corporateNumber: z
    .union([
      z.literal(''),
      z.string().regex(corporateNumberRegex, '법인등록번호는 13자리 숫자여야 합니다'),
    ])
    .optional()
    .nullable(),
  name: z.string().min(1, '사업자명/상호는 필수입니다').optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  location: z.string().optional(),
  budget: z.number().int().positive().optional(),
  keywords: z.array(z.string()).optional(),
  // 연락처 정보 (선택) - 빈 문자열 허용
  contactEmail: z
    .union([z.literal(''), z.string().email('올바른 이메일 형식이 아닙니다')])
    .optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
});

// 고객 필터링 스키마 (GET /api/customers 쿼리 파라미터)
export const customerFilterSchema = z.object({
  // 페이지네이션
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),

  // 정렬
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'businessNumber']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // 필터링
  businessType: z.enum(['INDIVIDUAL', 'CORPORATE']).optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  search: z.string().optional(), // 사업자명, 사업자등록번호 검색
});

// TypeScript 타입 export
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerFilterInput = z.infer<typeof customerFilterSchema>;
