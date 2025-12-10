import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createCustomerSchema,
  customerFilterSchema,
  type CreateCustomerInput,
} from '@/lib/validations/customer';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { ZodError } from 'zod';

// POST /api/customers - 고객 생성
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 체크
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '인증이 필요합니다', null, 401);
    }

    // 2. 요청 바디 파싱
    const body = await request.json();

    // 3. 유효성 검증 (Zod)
    const validatedData: CreateCustomerInput = createCustomerSchema.parse(body);

    // 4. 고객 생성
    const { data: customer, error: createError } = await supabase
      .from('customers')
      .insert({
        userId: user.id,
        ...validatedData,
      })
      .select()
      .single();

    if (createError) {
      // 중복 에러 (unique constraint violation)
      if (createError.code === '23505') {
        return errorResponse(
          ErrorCode.DUPLICATE_ENTRY,
          '이미 등록된 사업자등록번호입니다',
          { field: 'businessNumber' },
          400
        );
      }

      console.error('Customer creation error:', createError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '고객 생성 중 오류가 발생했습니다', null, 500);
    }

    // 5. 성공 응답
    return successResponse(customer, undefined, 201);
  } catch (error) {
    // Zod 유효성 검증 에러
    if (error instanceof ZodError) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '입력 데이터가 유효하지 않습니다',
        error.issues,
        400
      );
    }

    // 서버 에러
    console.error('Customer creation error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '고객 생성 중 오류가 발생했습니다', null, 500);
  }
}

// GET /api/customers - 고객 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 1. 인증 체크
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '인증이 필요합니다', null, 401);
    }

    // 2. 쿼리 파라미터 파싱 및 검증
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const filters = customerFilterSchema.parse(queryParams);

    // 3. Supabase 쿼리 구성 (본인의 고객만 조회)
    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('userId', user.id);

    // 4. 필터 적용
    if (filters.businessType) {
      query = query.eq('businessType', filters.businessType);
    }

    if (filters.industry) {
      query = query.ilike('industry', `%${filters.industry}%`);
    }

    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,businessNumber.ilike.%${filters.search}%`);
    }

    // 5. 정렬 적용
    query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });

    // 6. 페이지네이션 적용
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;
    query = query.range(from, to);

    // 7. 데이터 조회
    const { data: customers, error: fetchError, count } = await query;

    if (fetchError) {
      console.error('Customer list error:', fetchError);
      return errorResponse(
        ErrorCode.INTERNAL_ERROR,
        '고객 목록 조회 중 오류가 발생했습니다',
        null,
        500
      );
    }

    // 8. 성공 응답
    return successResponse(customers, {
      total: count || 0,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil((count || 0) / filters.limit),
    });
  } catch (error) {
    // Zod 유효성 검증 에러
    if (error instanceof ZodError) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '쿼리 파라미터가 유효하지 않습니다',
        error.issues,
        400
      );
    }

    // 서버 에러
    console.error('Customer list error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '고객 목록 조회 중 오류가 발생했습니다',
      null,
      500
    );
  }
}
