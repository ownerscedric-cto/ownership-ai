import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createKnowHowPostSchema,
  knowHowPostFilterSchema,
  type CreateKnowHowPostInput,
} from '@/lib/validations/education';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { requireEducationAccess } from '@/lib/auth/roles';
import { ZodError } from 'zod';

// POST /api/education/knowhow/posts - 노하우 게시글 생성 (일반 회원용)
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 및 교육 센터 접근 권한 체크
    const authResult = await requireEducationAccess(request);
    if (!authResult.success) {
      return authResult.response;
    }
    const user = authResult.user;
    const supabase = await createClient();

    // 2. 요청 바디 파싱
    const body = await request.json();

    // 3. 유효성 검증 (Zod)
    const validatedData: CreateKnowHowPostInput = createKnowHowPostSchema.parse(body);

    // 4. 카테고리 존재 여부 확인
    const { data: category, error: categoryError } = await supabase
      .from('knowhow_categories')
      .select('*')
      .eq('id', validatedData.categoryId)
      .single();

    if (categoryError || !category) {
      return errorResponse(ErrorCode.NOT_FOUND, '카테고리를 찾을 수 없습니다', null, 404);
    }

    // 5. 사용자 이름 가져오기 (user metadata 또는 email 사용)
    const authorName = user.user_metadata?.name || user.email?.split('@')[0] || '익명';

    // 6. UUID 및 타임스탬프 생성
    const { data: uuidData } = await supabase.rpc('gen_random_uuid');
    const newId = uuidData || crypto.randomUUID();
    const now = new Date().toISOString();

    // 7. 게시글 생성 (Supabase 테이블은 camelCase)
    const { data: post, error: createError } = await supabase
      .from('knowhow_posts')
      .insert({
        id: newId,
        title: validatedData.title,
        content: validatedData.content,
        categoryId: validatedData.categoryId,
        userId: user.id,
        authorName: authorName,
        isAnnouncement: false,
        isEvent: false,
        isPinned: false,
        createdAt: now,
        updatedAt: now,
      })
      .select('*, category:knowhow_categories(*)')
      .single();

    if (createError) {
      console.error('게시글 생성 실패:', createError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '게시글 생성에 실패했습니다', null, 500);
    }

    // 8. Supabase 테이블이 이미 camelCase이므로 변환 불필요
    return successResponse(post, undefined, 201);
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
    console.error('KnowHow post creation error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '게시글 생성 중 오류가 발생했습니다', null, 500);
  }
}

// GET /api/education/knowhow/posts - 노하우 게시글 목록 조회
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

    const filters = knowHowPostFilterSchema.parse(queryParams);
    const supabase = await createClient();

    // 2. Supabase 쿼리 시작
    let query = supabase
      .from('knowhow_posts')
      .select('*, category:knowhow_categories(*), comments:knowhow_comments(count)', {
        count: 'exact',
      });

    // 카테고리 필터링 (상위 카테고리 선택 시 하위 카테고리 글도 포함)
    if (filters.categoryId) {
      // 해당 카테고리의 하위 카테고리 ID들 조회
      const { data: childCategories } = await supabase
        .from('knowhow_categories')
        .select('id')
        .eq('parentId', filters.categoryId);

      const childCategoryIds = childCategories?.map(c => c.id) || [];

      if (childCategoryIds.length > 0) {
        // 상위 카테고리 + 하위 카테고리 모두 포함
        const allCategoryIds = [filters.categoryId, ...childCategoryIds];
        query = query.in('categoryId', allCategoryIds);
      } else {
        // 하위 카테고리가 없으면 해당 카테고리만
        query = query.eq('categoryId', filters.categoryId);
      }
    }

    // 공지사항 필터링
    if (filters.isAnnouncement !== undefined) {
      query = query.eq('isAnnouncement', filters.isAnnouncement);
    }

    // 이벤트 필터링
    if (filters.isEvent !== undefined) {
      query = query.eq('isEvent', filters.isEvent);
    }

    // 검색어 필터링
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }

    // 3. 정렬 (고정글 우선, Supabase 테이블은 camelCase)
    query = query.order('isPinned', { ascending: false });
    query = query.order(filters.sortBy, {
      ascending: filters.sortOrder === 'asc',
    });

    // 4. 페이지네이션
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;
    query = query.range(from, to);

    // 5. 데이터 조회
    const { data: posts, error: postsError, count } = await query;

    if (postsError) {
      console.error('게시글 조회 실패:', postsError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '게시글 목록 조회에 실패했습니다', null, 500);
    }

    // 6. 댓글 수 추가 및 게시일 만료된 공지/이벤트 상단 고정 해제
    const now = new Date();
    const formattedPosts = (posts || []).map((post: Record<string, unknown>) => {
      const comments = post.comments as Array<Record<string, unknown>> | undefined;
      const isAnnouncement = post.isAnnouncement as boolean;
      const isEvent = post.isEvent as boolean;
      const endDate = post.endDate as string | null;

      // 공지/이벤트의 종료일이 지났으면 상단 고정 해제 (프론트에서만 표시 변경)
      let effectiveIsPinned = post.isPinned as boolean;
      if ((isAnnouncement || isEvent) && endDate) {
        const endDateTime = new Date(endDate);
        if (endDateTime < now) {
          effectiveIsPinned = false;
        }
      }

      return {
        ...post,
        isPinned: effectiveIsPinned,
        _count: {
          comments: (comments?.[0]?.count as number) || 0,
        },
      };
    });

    // 7. 성공 응답
    return successResponse(formattedPosts, {
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
    console.error('KnowHow post list error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '게시글 목록 조회 중 오류가 발생했습니다',
      null,
      500
    );
  }
}
