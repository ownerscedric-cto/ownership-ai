/**
 * @file /api/admin/roles/[id]/route.ts
 * @description 역할 상세 조회, 수정, 삭제 API
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdminRole } from '@/lib/auth/roles';
import { successResponse, errorResponse } from '@/lib/api/response';
import type { Permission } from '@/lib/types/role';

// =====================================================
// Zod 스키마
// =====================================================

const updateRoleSchema = z.object({
  displayName: z
    .string()
    .min(1, '표시 이름은 필수입니다')
    .max(100, '표시 이름은 최대 100자까지 가능합니다')
    .optional(),
  description: z.string().max(500, '설명은 최대 500자까지 가능합니다').nullable().optional(),
  permissions: z.record(z.string(), z.boolean()).optional(),
  order: z.number().int().min(0).max(100).optional(),
});

// =====================================================
// GET: 역할 상세 조회
// =====================================================

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 관리자 권한 체크
    const authResult = await requireAdminRole(request);
    if (!authResult.success) {
      return authResult.response;
    }

    // 역할 조회
    const { data, error } = await supabaseAdmin.from('roles').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('NOT_FOUND', '역할을 찾을 수 없습니다', undefined, 404);
      }
      console.error('Failed to fetch role:', error);
      return errorResponse('FETCH_FAILED', '역할을 불러오는데 실패했습니다', undefined, 500);
    }

    return successResponse(data);
  } catch (error) {
    console.error('GET /api/admin/roles/[id] error:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      '서버 오류가 발생했습니다',
      error instanceof Error ? error.message : undefined,
      500
    );
  }
}

// =====================================================
// PATCH: 역할 수정
// =====================================================

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 관리자 권한 체크
    const authResult = await requireAdminRole(request);
    if (!authResult.success) {
      return authResult.response;
    }

    // 역할 존재 여부 확인
    const { data: existingRole, error: fetchError } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingRole) {
      return errorResponse('NOT_FOUND', '역할을 찾을 수 없습니다', undefined, 404);
    }

    // 요청 데이터 파싱 및 검증
    const body = await request.json();
    const parseResult = updateRoleSchema.safeParse(body);

    if (!parseResult.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        '입력값이 올바르지 않습니다',
        { errors: parseResult.error.flatten().fieldErrors },
        400
      );
    }

    const { displayName, description, permissions, order } = parseResult.data;

    // 업데이트할 데이터 구성
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (displayName !== undefined) updateData.displayName = displayName;
    if (description !== undefined) updateData.description = description;
    if (order !== undefined) updateData.order = order;

    // 권한 업데이트 (기존 권한과 병합)
    if (permissions) {
      const mergedPermissions: Record<Permission, boolean> = {
        ...(existingRole.permissions as Record<Permission, boolean>),
        ...(permissions as Record<Permission, boolean>),
      };
      updateData.permissions = mergedPermissions;
    }

    // 역할 수정
    const { data, error } = await supabaseAdmin
      .from('roles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update role:', error);
      return errorResponse('UPDATE_FAILED', '역할 수정에 실패했습니다', undefined, 500);
    }

    return successResponse(data);
  } catch (error) {
    console.error('PATCH /api/admin/roles/[id] error:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      '서버 오류가 발생했습니다',
      error instanceof Error ? error.message : undefined,
      500
    );
  }
}

// =====================================================
// DELETE: 역할 삭제
// =====================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 관리자 권한 체크
    const authResult = await requireAdminRole(request);
    if (!authResult.success) {
      return authResult.response;
    }

    // 역할 존재 여부 및 시스템 역할 여부 확인
    const { data: existingRole, error: fetchError } = await supabaseAdmin
      .from('roles')
      .select('id, name, isSystem')
      .eq('id', id)
      .single();

    if (fetchError || !existingRole) {
      return errorResponse('NOT_FOUND', '역할을 찾을 수 없습니다', undefined, 404);
    }

    // 시스템 역할은 삭제 불가
    if (existingRole.isSystem) {
      return errorResponse(
        'SYSTEM_ROLE',
        '시스템 역할은 삭제할 수 없습니다',
        { roleName: existingRole.name },
        403
      );
    }

    // 해당 역할을 가진 사용자 수 확인
    const { count } = await supabaseAdmin
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('roleId', id);

    if (count && count > 0) {
      return errorResponse(
        'ROLE_IN_USE',
        '이 역할을 가진 사용자가 있어 삭제할 수 없습니다',
        { userCount: count },
        409
      );
    }

    // 역할 삭제
    const { error } = await supabaseAdmin.from('roles').delete().eq('id', id);

    if (error) {
      console.error('Failed to delete role:', error);
      return errorResponse('DELETE_FAILED', '역할 삭제에 실패했습니다', undefined, 500);
    }

    return successResponse({ deleted: true });
  } catch (error) {
    console.error('DELETE /api/admin/roles/[id] error:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      '서버 오류가 발생했습니다',
      error instanceof Error ? error.message : undefined,
      500
    );
  }
}
