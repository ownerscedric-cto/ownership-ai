import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

/**
 * Request Schema
 */
const updateRoleSchema = z.object({
  role: z.enum(['admin', 'consultant']),
});

/**
 * PATCH /api/admin/users/[id]/role - 사용자 역할 변경 (관리자 전용)
 *
 * ⚠️ requireAdmin 미들웨어로 보호됨
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 1. Admin 권한 체크
  const authResult = await requireAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { id: userId } = await params;

    // 2. Request body validation
    const body = await request.json();
    const { role } = updateRoleSchema.parse(body);

    // 3. Update user role using Supabase Admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: {
        role,
      },
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPDATE_ROLE_FAILED',
            message: 'Failed to update user role',
            details: error.message,
          },
        },
        { status: 500 }
      );
    }

    // 4. Success response
    return NextResponse.json({
      success: true,
      data: {
        userId: data.user.id,
        email: data.user.email,
        role: data.user.app_metadata?.role || 'consultant',
      },
      message: `역할이 ${role === 'admin' ? '관리자' : '컨설턴트'}로 변경되었습니다.`,
    });
  } catch (error) {
    console.error(`PATCH /api/admin/users/[id]/role error:`, error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid request body',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update user role',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
