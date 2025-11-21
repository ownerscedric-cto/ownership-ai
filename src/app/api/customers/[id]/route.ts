import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { updateCustomerSchema, type UpdateCustomerInput } from '@/lib/validations/customer';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// GET /api/customers/[id] - 고객 상세 조회
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // 1. 인증 체크
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '인증이 필요합니다', null, 401);
    }

    // 2. 고객 조회
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    // 3. 존재 여부 확인
    if (!customer) {
      return errorResponse(ErrorCode.NOT_FOUND, '고객을 찾을 수 없습니다', null, 404);
    }

    // 4. 권한 체크 (본인의 고객만 조회 가능)
    if (customer.userId !== user.id) {
      return errorResponse(ErrorCode.FORBIDDEN, '해당 고객에 대한 접근 권한이 없습니다', null, 403);
    }

    // 5. 성공 응답
    return successResponse(customer);
  } catch (error) {
    console.error('Customer detail error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '고객 조회 중 오류가 발생했습니다', null, 500);
  }
}

// PUT /api/customers/[id] - 고객 정보 수정
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // 1. 인증 체크
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '인증이 필요합니다', null, 401);
    }

    // 2. 고객 존재 여부 및 권한 체크
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return errorResponse(ErrorCode.NOT_FOUND, '고객을 찾을 수 없습니다', null, 404);
    }

    if (existingCustomer.userId !== user.id) {
      return errorResponse(ErrorCode.FORBIDDEN, '해당 고객에 대한 접근 권한이 없습니다', null, 403);
    }

    // 3. 요청 바디 파싱 및 검증
    const body = await request.json();
    const validatedData: UpdateCustomerInput = updateCustomerSchema.parse(body);

    // 4. 고객 정보 수정
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: validatedData,
    });

    // 5. 성공 응답
    return successResponse(updatedCustomer);
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
    console.error('Customer update error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '고객 수정 중 오류가 발생했습니다', null, 500);
  }
}

// DELETE /api/customers/[id] - 고객 삭제
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // 1. 인증 체크
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '인증이 필요합니다', null, 401);
    }

    // 2. 고객 존재 여부 및 권한 체크
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return errorResponse(ErrorCode.NOT_FOUND, '고객을 찾을 수 없습니다', null, 404);
    }

    if (existingCustomer.userId !== user.id) {
      return errorResponse(ErrorCode.FORBIDDEN, '해당 고객에 대한 접근 권한이 없습니다', null, 403);
    }

    // 3. 고객 삭제
    await prisma.customer.delete({
      where: { id },
    });

    // 4. 성공 응답
    return successResponse({ message: '고객이 성공적으로 삭제되었습니다' });
  } catch (error) {
    console.error('Customer deletion error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '고객 삭제 중 오류가 발생했습니다', null, 500);
  }
}
