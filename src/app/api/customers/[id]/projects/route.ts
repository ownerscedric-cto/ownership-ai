/**
 * @file /api/customers/[id]/projects/route.ts
 * @description 고객별 진행사업 API
 * - POST: 관심목록에서 진행사업으로 추가
 * - GET: 진행사업 목록 조회
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';

/**
 * 진행사업 상태 타입
 */
export type ProjectStatus =
  | 'preparing' // 서류준비
  | 'submitted' // 신청완료
  | 'reviewing' // 심사중
  | 'selected' // 선정
  | 'rejected' // 탈락
  | 'cancelled' // 취소/보류
  | 'completed'; // 완료

/**
 * 상태 라벨 매핑
 */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  preparing: '서류준비',
  submitted: '신청완료',
  reviewing: '심사중',
  selected: '선정',
  rejected: '탈락',
  cancelled: '취소/보류',
  completed: '완료',
};

/**
 * 상태 색상 매핑
 */
export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  preparing: 'bg-blue-100 text-blue-800',
  submitted: 'bg-purple-100 text-purple-800',
  reviewing: 'bg-yellow-100 text-yellow-800',
  selected: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  completed: 'bg-teal-100 text-teal-800',
};

/**
 * POST 요청 스키마
 */
const addProjectSchema = z.object({
  programId: z.string().uuid('유효하지 않은 프로그램 ID입니다'),
  notes: z.string().optional(),
});

/**
 * POST /api/customers/[id]/projects
 * 관심목록에서 진행사업으로 추가
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: customerId } = await params;
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
    const validationResult = addProjectSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '유효하지 않은 요청입니다',
        validationResult.error.issues,
        400
      );
    }

    const { programId, notes } = validationResult.data;

    // 고객 소유권 확인
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name')
      .eq('id', customerId)
      .eq('userId', user.id)
      .single();

    if (customerError || !customer) {
      return errorResponse(ErrorCode.NOT_FOUND, '고객을 찾을 수 없습니다', null, 404);
    }

    // 프로그램 존재 확인
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, title, dataSource, deadline')
      .eq('id', programId)
      .single();

    if (programError || !program) {
      return errorResponse(ErrorCode.NOT_FOUND, '프로그램을 찾을 수 없습니다', null, 404);
    }

    // 이미 진행사업에 있는지 확인
    const { data: existing } = await supabase
      .from('customer_projects')
      .select('id')
      .eq('customerId', customerId)
      .eq('programId', programId)
      .single();

    if (existing) {
      return errorResponse(ErrorCode.DUPLICATE_ENTRY, '이미 진행 중인 사업입니다', null, 409);
    }

    // 진행사업 추가
    const { data: project, error: insertError } = await supabase
      .from('customer_projects')
      .insert({
        customerId,
        programId,
        status: 'preparing',
        notes: notes || null,
      })
      .select(
        `
        id,
        status,
        notes,
        startedAt,
        submittedAt,
        resultAt,
        program:programs(
          id,
          title,
          dataSource,
          deadline
        )
      `
      )
      .single();

    if (insertError) {
      console.error('[POST /api/customers/[id]/projects] Insert error:', insertError);
      return errorResponse(
        ErrorCode.INTERNAL_ERROR,
        '진행사업 추가에 실패했습니다',
        insertError.message,
        500
      );
    }

    return successResponse(project, undefined, 201);
  } catch (error) {
    console.error('[POST /api/customers/[id]/projects] Error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '진행사업 추가 중 오류가 발생했습니다',
      error instanceof Error ? error.message : '알 수 없는 오류',
      500
    );
  }
}

/**
 * GET /api/customers/[id]/projects
 * 진행사업 목록 조회
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: customerId } = await params;
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

    // 진행사업 목록 조회
    const { data: projects, error: projectsError } = await supabase
      .from('customer_projects')
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
      .eq('customerId', customerId)
      .order('startedAt', { ascending: false });

    if (projectsError) {
      console.error('[GET /api/customers/[id]/projects] Query error:', projectsError);
      return errorResponse(
        ErrorCode.INTERNAL_ERROR,
        '진행사업 조회에 실패했습니다',
        projectsError.message,
        500
      );
    }

    return successResponse({
      total: projects?.length || 0,
      items: projects || [],
    });
  } catch (error) {
    console.error('[GET /api/customers/[id]/projects] Error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '진행사업 조회 중 오류가 발생했습니다',
      error instanceof Error ? error.message : '알 수 없는 오류',
      500
    );
  }
}
