/**
 * @file /api/auth/reset-password
 * @description 비밀번호 초기화 요청 API
 *
 * Supabase Auth의 resetPasswordForEmail 기능을 사용하여
 * 사용자에게 비밀번호 재설정 이메일을 발송합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// 요청 검증 스키마
const resetPasswordRequestSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요'),
});

/**
 * POST /api/auth/reset-password
 * 비밀번호 재설정 이메일 발송
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 입력 검증
    const validationResult = resetPasswordRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationResult.error.issues[0]?.message || '입력값이 유효하지 않습니다',
          },
        },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;
    const supabase = await createClient();

    // 비밀번호 재설정 URL 생성
    // 프로덕션에서는 실제 도메인 사용
    const origin =
      request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectTo = `${origin}/auth/reset-password`;

    // Supabase resetPasswordForEmail 호출
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error('[Reset Password] Error:', error.message);

      // 보안상 이메일 존재 여부를 노출하지 않음
      // 모든 경우에 성공 메시지 반환
      return NextResponse.json({
        success: true,
        data: {
          message: '입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다. 이메일을 확인해주세요.',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: '입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다. 이메일을 확인해주세요.',
      },
    });
  } catch (error) {
    console.error('[Reset Password] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '비밀번호 재설정 요청 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    );
  }
}
