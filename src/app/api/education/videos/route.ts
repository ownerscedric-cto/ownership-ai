import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import {
  createEducationVideoSchema,
  educationVideoFilterSchema,
  type CreateEducationVideoInput,
} from '@/lib/validations/education';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { ZodError } from 'zod';
import type { Prisma } from '@prisma/client';

// POST /api/education/videos - 교육 비디오 생성
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
    const validatedData: CreateEducationVideoInput = createEducationVideoSchema.parse(body);

    // 4. 교육 비디오 생성
    const video = await prisma.educationVideo.create({
      data: validatedData,
    });

    // 5. 성공 응답
    return successResponse(video, undefined, 201);
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
    console.error('Education video creation error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '교육 비디오 생성 중 오류가 발생했습니다',
      null,
      500
    );
  }
}

// GET /api/education/videos - 교육 비디오 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 1. 쿼리 파라미터 파싱 및 검증
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const filters = educationVideoFilterSchema.parse(queryParams);

    // 2. Prisma where 조건 구성
    const where: Prisma.EducationVideoWhereInput = {
      ...(filters.category && { category: filters.category }),
      ...(filters.videoType && { videoType: filters.videoType }),
      ...(filters.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { tags: { has: filters.search } }, // 태그 배열 검색
        ],
      }),
    };

    // 3. 정렬 조건
    const orderBy: Prisma.EducationVideoOrderByWithRelationInput = {
      [filters.sortBy]: filters.sortOrder,
    };

    // 4. 페이지네이션 계산
    const skip = (filters.page - 1) * filters.limit;
    const take = filters.limit;

    // 5. 데이터 조회 (병렬 처리)
    const [videos, total] = await Promise.all([
      prisma.educationVideo.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      prisma.educationVideo.count({ where }),
    ]);

    // 6. 성공 응답
    return successResponse(videos, {
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
    console.error('Education video list error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '교육 비디오 목록 조회 중 오류가 발생했습니다',
      null,
      500
    );
  }
}
