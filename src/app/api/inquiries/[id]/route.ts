import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { updateInquiryStatusSchema } from '@/lib/validations/inquiry';
import { getUserRole } from '@/lib/auth/roles';
import { ZodError } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/inquiries/[id] - 문의 상세 조회
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 1. 인증 체크
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '로그인이 필요합니다', null, 401);
    }

    // 2. 현재 역할 조회
    const userRole = await getUserRole(user.id);
    const isAdmin = userRole.role.name === 'admin';

    // 3. 문의 조회 (supabaseAdmin 사용하여 RLS 무한재귀 방지)
    const { data: inquiry, error } = await supabaseAdmin
      .from('premium_inquiries')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !inquiry) {
      return errorResponse(ErrorCode.NOT_FOUND, '문의를 찾을 수 없습니다', null, 404);
    }

    // 4. 권한 체크 (본인 또는 관리자만)
    if (!isAdmin && inquiry.userId !== user.id) {
      return errorResponse(ErrorCode.FORBIDDEN, '접근 권한이 없습니다', null, 403);
    }

    return successResponse(inquiry);
  } catch (error) {
    console.error('Inquiry detail error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '문의 조회 중 오류가 발생했습니다', null, 500);
  }
}

/**
 * PATCH /api/inquiries/[id] - 문의 상태 업데이트 (관리자 전용)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 1. 인증 체크
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '로그인이 필요합니다', null, 401);
    }

    // 2. 관리자 권한 체크
    const userRole = await getUserRole(user.id);
    if (userRole.role.name !== 'admin') {
      return errorResponse(ErrorCode.FORBIDDEN, '관리자만 접근 가능합니다', null, 403);
    }

    // 3. 요청 바디 파싱 및 검증
    const body = await request.json();
    const validated = updateInquiryStatusSchema.parse(body);

    // 4. 문의 조회 (supabaseAdmin 사용하여 RLS 무한재귀 방지)
    const { data: inquiry, error: fetchError } = await supabaseAdmin
      .from('premium_inquiries')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !inquiry) {
      return errorResponse(ErrorCode.NOT_FOUND, '문의를 찾을 수 없습니다', null, 404);
    }

    // 5. 이미 처리된 문의인지 확인
    if (inquiry.status !== 'pending') {
      return errorResponse(ErrorCode.BAD_REQUEST, '이미 처리된 문의입니다', null, 400);
    }

    // 6. 문의 상태 업데이트 (supabaseAdmin 사용)
    const { data: updatedInquiry, error: updateError } = await supabaseAdmin
      .from('premium_inquiries')
      .update({
        status: validated.status,
        adminNote: validated.adminNote || null,
        processedAt: new Date().toISOString(),
        processedBy: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Inquiry update error:', updateError);
      return errorResponse(
        ErrorCode.INTERNAL_ERROR,
        '문의 상태 업데이트에 실패했습니다',
        updateError.message,
        500
      );
    }

    // 7. 승인된 경우 사용자 역할을 프리미엄으로 업그레이드
    if (validated.status === 'approved') {
      // premium 역할 ID 조회
      const { data: premiumRole } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', 'premium')
        .single();

      if (premiumRole) {
        // 기존 역할 삭제 후 프리미엄 역할 추가
        await supabaseAdmin.from('user_roles').delete().eq('userId', inquiry.userId);

        await supabaseAdmin.from('user_roles').insert({
          userId: inquiry.userId,
          roleId: premiumRole.id,
        });
      }
    }

    return successResponse(updatedInquiry);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '입력값이 올바르지 않습니다',
        error.issues,
        400
      );
    }
    console.error('Inquiry update error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '문의 상태 업데이트 중 오류가 발생했습니다',
      null,
      500
    );
  }
}
