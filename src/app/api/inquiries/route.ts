import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { createInquirySchema, inquiryFilterSchema } from '@/lib/validations/inquiry';
import { getUserRole } from '@/lib/auth/roles';
import { ZodError } from 'zod';

/**
 * POST /api/inquiries - 프리미엄 업그레이드 문의 생성
 */
export async function POST(request: NextRequest) {
  try {
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

    // 3. 이미 프리미엄/관리자인 경우 거부
    if (userRole.role.name === 'premium' || userRole.role.name === 'admin') {
      return errorResponse(ErrorCode.BAD_REQUEST, '이미 프리미엄 이상의 등급입니다', null, 400);
    }

    // 4. 대기 중인 문의가 있는지 확인 (supabaseAdmin 사용하여 RLS 무한재귀 방지)
    const { data: existingInquiry } = await supabaseAdmin
      .from('premium_inquiries')
      .select('id')
      .eq('userId', user.id)
      .eq('status', 'pending')
      .single();

    if (existingInquiry) {
      return errorResponse(ErrorCode.BAD_REQUEST, '이미 대기 중인 문의가 있습니다', null, 400);
    }

    // 5. 요청 바디 파싱 및 검증
    const body = await request.json();
    const validated = createInquirySchema.parse(body);

    // 6. 문의 생성 (supabaseAdmin 사용하여 RLS 무한재귀 방지)
    const { data: inquiry, error: createError } = await supabaseAdmin
      .from('premium_inquiries')
      .insert({
        userId: user.id,
        userName: user.user_metadata?.name || user.email?.split('@')[0] || '사용자',
        userEmail: user.email || '',
        currentRole: userRole.role.displayName,
        message: validated.message || null,
        status: 'pending',
      })
      .select()
      .single();

    if (createError) {
      console.error('Inquiry creation error:', createError);
      return errorResponse(
        ErrorCode.INTERNAL_ERROR,
        '문의 생성에 실패했습니다',
        createError.message,
        500
      );
    }

    return successResponse(inquiry, undefined, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '입력값이 올바르지 않습니다',
        error.issues,
        400
      );
    }
    console.error('Inquiry creation error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '문의 생성 중 오류가 발생했습니다', null, 500);
  }
}

/**
 * GET /api/inquiries - 문의 목록 조회
 * - 일반 사용자: 본인 문의만
 * - 관리자: 전체 문의
 */
export async function GET(request: NextRequest) {
  try {
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

    // 3. 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const filters = inquiryFilterSchema.parse(queryParams);

    // 4. 쿼리 시작 (supabaseAdmin 사용하여 RLS 무한재귀 방지)
    let query = supabaseAdmin.from('premium_inquiries').select('*', { count: 'exact' });

    // 5. 관리자가 아니면 본인 문의만 조회
    if (!isAdmin) {
      query = query.eq('userId', user.id);
    }

    // 6. 상태 필터
    if (filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    // 7. 정렬 및 페이지네이션
    const offset = (filters.page - 1) * filters.limit;
    query = query
      .order('createdAt', { ascending: false })
      .range(offset, offset + filters.limit - 1);

    const { data: inquiries, error, count } = await query;

    if (error) {
      console.error('Inquiry list error:', error);
      return errorResponse(
        ErrorCode.INTERNAL_ERROR,
        '문의 목록 조회에 실패했습니다',
        error.message,
        500
      );
    }

    return successResponse(inquiries || [], {
      total: count || 0,
      page: filters.page,
      limit: filters.limit,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '입력값이 올바르지 않습니다',
        error.issues,
        400
      );
    }
    console.error('Inquiry list error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '문의 목록 조회 중 오류가 발생했습니다',
      null,
      500
    );
  }
}
