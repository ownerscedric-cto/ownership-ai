/**
 * @file /api/customers/[id]/projects/[projectId]/route.ts
 * @description 개별 진행사업 API
 * - PATCH: 상태/메모 업데이트
 * - DELETE: 진행사업 삭제
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';

/**
 * PATCH 요청 스키마
 */
const updateProjectSchema = z.object({
  status: z
    .enum(['preparing', 'submitted', 'reviewing', 'selected', 'rejected', 'cancelled', 'completed'])
    .optional(),
  notes: z.string().optional(),
  submittedAt: z.string().datetime().optional().nullable(),
  resultAt: z.string().datetime().optional().nullable(),
});

/**
 * PATCH /api/customers/[id]/projects/[projectId]
 * 진행사업 상태/메모 업데이트
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  try {
    const { id: customerId, projectId } = await params;
    const supabase = await createClient();

    // 인증 체크
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '인증이 필요합니다', null, 401);
    }

    // 요청 본문 파싱
    const body = await request.json();
    const validationResult = updateProjectSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '유효하지 않은 요청입니다',
        validationResult.error.issues,
        400
      );
    }

    const updateData = validationResult.data;

    // 고객 소유권 확인
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .eq('userId', user.id)
      .single();

    if (customerError || !customer) {
      return errorResponse(ErrorCode.NOT_FOUND, '고객을 찾을 수 없습니다', null, 404);
    }

    // 진행사업 존재 확인
    const { data: existingProject, error: projectError } = await supabase
      .from('customer_projects')
      .select('id')
      .eq('id', projectId)
      .eq('customerId', customerId)
      .single();

    if (projectError || !existingProject) {
      return errorResponse(ErrorCode.NOT_FOUND, '진행사업을 찾을 수 없습니다', null, 404);
    }

    // 업데이트
    const { data: project, error: updateError } = await supabase
      .from('customer_projects')
      .update(updateData)
      .eq('id', projectId)
      .select(
        `
        id,
        status,
        notes,
        startedAt,
        submittedAt,
        resultAt,
        updatedAt,
        program:programs(
          id,
          title,
          dataSource,
          deadline
        )
      `
      )
      .single();

    if (updateError) {
      console.error('[PATCH /api/customers/[id]/projects/[projectId]] Update error:', updateError);
      return errorResponse(
        ErrorCode.INTERNAL_ERROR,
        '진행사업 업데이트에 실패했습니다',
        updateError.message,
        500
      );
    }

    return successResponse(project);
  } catch (error) {
    console.error('[PATCH /api/customers/[id]/projects/[projectId]] Error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '진행사업 업데이트 중 오류가 발생했습니다',
      error instanceof Error ? error.message : '알 수 없는 오류',
      500
    );
  }
}

/**
 * DELETE /api/customers/[id]/projects/[projectId]
 * 진행사업 삭제 (관심목록으로 되돌리기)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  try {
    const { id: customerId, projectId } = await params;
    const supabase = await createClient();

    // 인증 체크
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '인증이 필요합니다', null, 401);
    }

    // 고객 소유권 확인
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .eq('userId', user.id)
      .single();

    if (customerError || !customer) {
      return errorResponse(ErrorCode.NOT_FOUND, '고객을 찾을 수 없습니다', null, 404);
    }

    // 진행사업 삭제
    const { error: deleteError } = await supabase
      .from('customer_projects')
      .delete()
      .eq('id', projectId)
      .eq('customerId', customerId);

    if (deleteError) {
      console.error('[DELETE /api/customers/[id]/projects/[projectId]] Delete error:', deleteError);
      return errorResponse(
        ErrorCode.INTERNAL_ERROR,
        '진행사업 삭제에 실패했습니다',
        deleteError.message,
        500
      );
    }

    return successResponse({ deleted: true });
  } catch (error) {
    console.error('[DELETE /api/customers/[id]/projects/[projectId]] Error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '진행사업 삭제 중 오류가 발생했습니다',
      error instanceof Error ? error.message : '알 수 없는 오류',
      500
    );
  }
}
