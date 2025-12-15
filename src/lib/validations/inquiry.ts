import { z } from 'zod';

/**
 * 프리미엄 업그레이드 문의 Zod 스키마
 */

// 문의 생성 스키마
export const createInquirySchema = z.object({
  message: z.string().max(1000, '문의 내용은 1000자 이내로 작성해주세요').optional(),
});

export type CreateInquiryInput = z.infer<typeof createInquirySchema>;

// 문의 상태 업데이트 스키마 (관리자용)
export const updateInquiryStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected'], {
    message: '유효하지 않은 상태입니다',
  }),
  adminNote: z.string().max(500, '관리자 메모는 500자 이내로 작성해주세요').optional(),
});

export type UpdateInquiryStatusInput = z.infer<typeof updateInquiryStatusSchema>;

// 문의 목록 필터 스키마
export const inquiryFilterSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'all']).optional().default('all'),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export type InquiryFilter = z.infer<typeof inquiryFilterSchema>;

// 문의 상태 타입
export type InquiryStatus = 'pending' | 'approved' | 'rejected';

// 문의 타입
export interface PremiumInquiry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  currentRole: string;
  message: string | null;
  status: InquiryStatus;
  adminNote: string | null;
  processedAt: string | null;
  processedBy: string | null;
  createdAt: string;
  updatedAt: string;
}
