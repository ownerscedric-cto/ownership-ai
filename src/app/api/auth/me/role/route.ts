/**
 * @file /api/auth/me/role/route.ts
 * @description 현재 로그인한 사용자의 역할 정보 조회 API
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserRole } from '@/lib/auth/roles';
import { successResponse, errorResponse } from '@/lib/api/response';

// =====================================================
// GET: 현재 사용자 역할 조회
// =====================================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    // 인증 체크
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse('UNAUTHORIZED', '로그인이 필요합니다', undefined, 401);
    }

    // 사용자 역할 조회
    const userRole = await getUserRole(user.id);

    return successResponse({
      userId: userRole.userId,
      role: userRole.role,
      assignedAt: userRole.assignedAt,
    });
  } catch (error) {
    console.error('GET /api/auth/me/role error:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      '역할 정보를 불러오는데 실패했습니다',
      error instanceof Error ? error.message : undefined,
      500
    );
  }
}
