/**
 * @file /api/auth/update-password
 * @description 비밀번호 업데이트 API
 *
 * 비밀번호 재설정 링크를 통해 인증된 사용자의 새 비밀번호를 설정합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// 요청 검증 스키마
const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
      .regex(/[A-Za-z]/, '비밀번호에 영문자가 포함되어야 합니다')
      .regex(/[0-9]/, '비밀번호에 숫자가 포함되어야 합니다'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  });

/**
 * POST /api/auth/update-password
 * 새 비밀번호 설정
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 입력 검증
    const validationResult = updatePasswordSchema.safeParse(body);
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

    const { password } = validationResult.data;
    const supabase = await createClient();

    // 현재 세션 확인 (recovery 토큰으로 생성된 세션)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '유효하지 않거나 만료된 링크입니다. 비밀번호 재설정을 다시 요청해주세요.',
          },
        },
        { status: 401 }
      );
    }

    // 비밀번호 업데이트
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      console.error('[Update Password] Error:', updateError.message);

      // 이전 비밀번호와 동일한 경우
      if (
        updateError.message.includes('same_password') ||
        updateError.message.includes('different from the old password') ||
        updateError.message.includes('should be different')
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'SAME_PASSWORD',
              message: '이전 비밀번호와 동일합니다. 새로운 비밀번호를 입력해주세요.',
            },
          },
          { status: 400 }
        );
      }

      // 일반적인 오류 메시지 반환
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: '비밀번호 변경에 실패했습니다. 다시 시도해주세요.',
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: '비밀번호가 성공적으로 변경되었습니다.',
      },
    });
  } catch (error) {
    console.error('[Update Password] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '비밀번호 변경 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    );
  }
}
