import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createEducationVideoSchema,
  educationVideoFilterSchema,
  type CreateEducationVideoInput,
} from '@/lib/validations/education';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { requireEducationAccess } from '@/lib/auth/roles';
import { ZodError } from 'zod';

// POST /api/education/videos - 교육 비디오 생성
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 및 교육 센터 접근 권한 체크
    const authResult = await requireEducationAccess(request);
    if (!authResult.success) {
      return authResult.response;
    }

    // 2. 요청 바디 파싱
    const body = await request.json();

    // 3. 유효성 검증 (Zod)
    const validatedData: CreateEducationVideoInput = createEducationVideoSchema.parse(body);

    // 4. 교육 비디오 생성
    const supabase = await createClient();
    const { data: video, error: createError } = await supabase
      .from('education_videos')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        categoryId: validatedData.categoryId,
        videoUrl: validatedData.videoUrl,
        videoType: validatedData.videoType || 'youtube',
        thumbnailUrl: validatedData.thumbnailUrl,
        duration: validatedData.duration,
        tags: validatedData.tags || [],
      })
      .select('*')
      .single();

    if (createError) {
      console.error('비디오 생성 실패:', createError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '교육 비디오 생성에 실패했습니다', null, 500);
    }

    // 5. 성공 응답 (Supabase 테이블이 이미 camelCase이므로 변환 불필요)
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
    // 1. 인증 및 교육 센터 접근 권한 체크
    const authResult = await requireEducationAccess(request);
    if (!authResult.success) {
      return authResult.response;
    }

    // 2. 쿼리 파라미터 파싱 및 검증
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const filters = educationVideoFilterSchema.parse(queryParams);
    const supabase = await createClient();

    let query = supabase.from('education_videos').select(
      `
      *,
      category:video_categories!education_videos_categoryId_fkey(*)
    `,
      { count: 'exact' }
    );

    // 2. 필터링 조건
    if (filters.category) {
      // category name으로 필터링하기 위해 categoryId를 먼저 조회
      const { data: categoryData } = await supabase
        .from('video_categories')
        .select('id')
        .eq('name', filters.category)
        .single();

      if (categoryData) {
        query = query.eq('categoryId', categoryData.id);
      }
    }

    if (filters.videoType) {
      query = query.eq('videoType', filters.videoType);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // 3. 정렬 (Supabase 테이블이 camelCase이므로 그대로 사용)
    query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });

    // 4. 페이지네이션
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;
    query = query.range(from, to);

    const { data: videos, error: videosError, count } = await query;

    if (videosError) {
      console.error('비디오 목록 조회 실패:', videosError);
      return errorResponse(
        ErrorCode.INTERNAL_ERROR,
        '교육 비디오 목록 조회에 실패했습니다',
        null,
        500
      );
    }

    // 5. 성공 응답 (Supabase 테이블이 이미 camelCase이므로 변환 불필요)
    return successResponse(videos || [], {
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
    console.error('Education video list error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '교육 비디오 목록 조회 중 오류가 발생했습니다',
      null,
      500
    );
  }
}
