import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import {
  createCustomerSchema,
  customerFilterSchema,
  type CreateCustomerInput,
} from '@/lib/validations/customer';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { ZodError } from 'zod';
import type { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

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
    const customer = await prisma.customer.create({
      data: {
        userId: user.id,
        ...validatedData,
      },
    });

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

    // Prisma 중복 에러
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return errorResponse(
          ErrorCode.DUPLICATE_ENTRY,
          '이미 등록된 사업자등록번호입니다',
          { field: 'businessNumber' },
          400
        );
      }
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

    // 3. Prisma where 조건 구성
    const where: Prisma.CustomerWhereInput = {
      userId: user.id, // 본인의 고객만 조회
      ...(filters.businessType && { businessType: filters.businessType }),
      ...(filters.industry && {
        industry: { contains: filters.industry, mode: 'insensitive' },
      }),
      ...(filters.location && {
        location: { contains: filters.location, mode: 'insensitive' },
      }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { businessNumber: { contains: filters.search } },
        ],
      }),
    };

    // 4. 정렬 조건
    const orderBy: Prisma.CustomerOrderByWithRelationInput = {
      [filters.sortBy]: filters.sortOrder,
    };

    // 5. 페이지네이션 계산
    const skip = (filters.page - 1) * filters.limit;
    const take = filters.limit;

    // 6. 데이터 조회 (병렬 처리)
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      prisma.customer.count({ where }),
    ]);

    // 7. 성공 응답
    return successResponse(customers, {
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
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
