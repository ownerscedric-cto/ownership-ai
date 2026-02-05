/**
 * @file /api/copy-templates
 * @description 텍스트 복사 템플릿 조회 API (사용자용)
 *
 * 활성화된 템플릿 목록만 조회 가능
 * usageType 파라미터로 용도별 필터링 지원
 * - customer: 고객용 템플릿
 * - internal: 사내용 템플릿 (관리자만)
 * - all: 모든 용도
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 사용자가 관리자인지 확인하는 함수
async function isUserAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<boolean> {
  // 직접 roleId로 조회 후 roles 테이블에서 이름 확인
  const { data: userRoles, error } = await supabase
    .from('user_roles')
    .select('roleId')
    .eq('userId', userId);

  if (error || !userRoles || userRoles.length === 0) return false;

  // roleId 목록 추출
  const roleIds = userRoles.map(ur => ur.roleId);

  // roles 테이블에서 admin 또는 super_admin 역할인지 확인
  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('id, name')
    .in('id', roleIds)
    .in('name', ['admin', 'super_admin']);

  if (rolesError || !roles) return false;

  return roles.length > 0;
}

/**
 * GET /api/copy-templates
 * 활성화된 템플릿 목록 조회 (사용자용)
 *
 * Query Parameters:
 * - usageType: 'customer' | 'internal' | 'all' (optional)
 *   - 미지정 시: 사용자 권한에 따라 자동 필터링
 *   - 일반 사용자: customer, all 템플릿만
 *   - 관리자: 모든 템플릿
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 로그인 확인
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } },
        { status: 401 }
      );
    }

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const usageType = searchParams.get('usageType') as 'customer' | 'internal' | 'all' | null;

    // 관리자 여부 확인
    const isAdmin = await isUserAdmin(supabase, user.id);

    // 쿼리 빌드
    let query = supabase
      .from('copy_templates')
      .select(
        'id, name, description, headerTemplate, itemTemplate, footerTemplate, isDefault, usageType'
      )
      .eq('isActive', true);

    // usageType 필터링
    if (usageType) {
      // 특정 usageType 요청 시
      if (usageType === 'internal' && !isAdmin) {
        // 일반 사용자가 internal 요청 시 빈 배열 반환
        return NextResponse.json({ success: true, data: [] });
      }
      // all 타입은 항상 포함, 요청한 usageType도 포함
      query = query.in('usageType', [usageType, 'all']);
    } else {
      // usageType 미지정 시 권한에 따라 필터링
      if (isAdmin) {
        // 관리자는 모든 템플릿 조회 가능
        // 필터 없음
      } else {
        // 일반 사용자는 customer, all만 조회 가능
        query = query.in('usageType', ['customer', 'all']);
      }
    }

    const { data: templates, error } = await query.order('sortOrder', { ascending: true });

    if (error) {
      console.error('[Copy Templates] GET error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: '템플릿 조회에 실패했습니다' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('[Copy Templates] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    );
  }
}
