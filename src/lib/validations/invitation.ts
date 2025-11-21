import { z } from 'zod';

// 초대 신청 스키마
export const invitationSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  name: z.string().min(1, '이름을 입력해주세요'),
  companyName: z.string().optional(),
});

// TypeScript 타입 export
export type InvitationInput = z.infer<typeof invitationSchema>;
