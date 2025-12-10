import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createKnowHowPostSchema,
  knowHowPostFilterSchema,
  type CreateKnowHowPostInput,
} from '@/lib/validations/education';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { ZodError } from 'zod';

// POST /api/education/knowhow/posts - 노하우 게시글 생성 (일반 회원용)
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

    // 6. 게시글 생성
    const { data: post, error: createError } = await supabase
      .from('knowhow_posts')
      .insert({
        title: validatedData.title,
        content: validatedData.content,
        category_id: validatedData.categoryId,
        user_id: user.id,
        author_name: authorName,
        is_announcement: false,
        is_event: false,
        is_pinned: false,
      })
      .select('*, category:knowhow_categories(*)')
      .single();

    if (createError) {
      console.error('게시글 생성 실패:', createError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '게시글 생성에 실패했습니다', null, 500);
    }

    // 7. camelCase 변환
    const formattedPost = {
      id: post.id,
      title: post.title,
      content: post.content,
      authorName: post.author_name,
      userId: post.user_id,
      categoryId: post.category_id,
      viewCount: post.view_count,
      isPinned: post.is_pinned,
      isAnnouncement: post.is_announcement,
      isEvent: post.is_event,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      category: post.category ? {
        id: post.category.id,
        name: post.category.name,
        description: post.category.description,
      } : null,
    };

    // 8. 성공 응답
    return successResponse(formattedPost, undefined, 201);
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
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '게시글 생성 중 오류가 발생했습니다',
      null,
      500
    );
  }
}

// GET /api/education/knowhow/posts - 노하우 게시글 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 1. 쿼리 파라미터 파싱 및 검증
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const filters = knowHowPostFilterSchema.parse(queryParams);
    const supabase = await createClient();

    // 2. Supabase 쿼리 시작
    let query = supabase
      .from('knowhow_posts')
      .select('*, category:knowhow_categories(*), comments:knowhow_comments(count)', { count: 'exact' });

    // 카테고리 필터링
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    // 공지사항 필터링
    if (filters.isAnnouncement !== undefined) {
      query = query.eq('is_announcement', filters.isAnnouncement);
    }

    // 이벤트 필터링
    if (filters.isEvent !== undefined) {
      query = query.eq('is_event', filters.isEvent);
    }

    // 검색어 필터링
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }

    // 3. 정렬 (고정글 우선)
    query = query.order('is_pinned', { ascending: false });
    query = query.order(
      filters.sortBy === 'createdAt' ? 'created_at' : filters.sortBy,
      { ascending: filters.sortOrder === 'asc' }
    );

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

    // 6. camelCase 변환
    const formattedPosts = (posts || []).map((post: any) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      authorName: post.author_name,
      userId: post.user_id,
      categoryId: post.category_id,
      viewCount: post.view_count,
      isPinned: post.is_pinned,
      isAnnouncement: post.is_announcement,
      isEvent: post.is_event,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      category: post.category ? {
        id: post.category.id,
        name: post.category.name,
        description: post.category.description,
      } : null,
      _count: {
        comments: post.comments?.[0]?.count || 0,
      },
    }));

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
