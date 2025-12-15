/**
 * @file /api/admin/roles/route.ts
 * @description 역할 목록 조회 및 생성 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdminRole } from '@/lib/auth/roles';
import { successResponse, errorResponse } from '@/lib/api/response';
import { DEFAULT_PERMISSIONS, type Permission } from '@/lib/types/role';

// =====================================================
// Zod 스키마
// =====================================================

const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, '역할 이름은 최소 2자 이상이어야 합니다')
    .max(50, '역할 이름은 최대 50자까지 가능합니다')
    .regex(/^[a-z_]+$/, '역할 이름은 영문 소문자와 언더스코어만 사용 가능합니다'),
  displayName: z
    .string()
    .min(1, '표시 이름은 필수입니다')
    .max(100, '표시 이름은 최대 100자까지 가능합니다'),
  description: z.string().max(500, '설명은 최대 500자까지 가능합니다').optional(),
  permissions: z.record(z.string(), z.boolean()).optional(),
  order: z.number().int().min(0).max(100).optional(),
});

// =====================================================
// GET: 역할 목록 조회
// =====================================================

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 체크
    const authResult = await requireAdminRole(request);
    if (!authResult.success) {
      return authResult.response;
    }

    // 역할 목록 조회
    const { data, error } = await supabaseAdmin
      .from('roles')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      console.error('Failed to fetch roles:', error);
      return errorResponse('FETCH_FAILED', '역할 목록을 불러오는데 실패했습니다', undefined, 500);
    }

    return successResponse(data);
  } catch (error) {
    console.error('GET /api/admin/roles error:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      '서버 오류가 발생했습니다',
      error instanceof Error ? error.message : undefined,
      500
    );
  }
}

// =====================================================
// POST: 역할 생성
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 체크
    const authResult = await requireAdminRole(request);
    if (!authResult.success) {
      return authResult.response;
    }

    // 요청 데이터 파싱 및 검증
    const body = await request.json();
    const parseResult = createRoleSchema.safeParse(body);

    if (!parseResult.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        '입력값이 올바르지 않습니다',
        { errors: parseResult.error.flatten().fieldErrors },
        400
      );
    }

    const { name, displayName, description, permissions, order } = parseResult.data;

    // 역할 이름 중복 체크
    const { data: existingRole } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', name)
      .single();

    if (existingRole) {
      return errorResponse('DUPLICATE_ROLE', '이미 존재하는 역할 이름입니다', undefined, 409);
    }

    // 권한 기본값 병합
    const mergedPermissions: Record<Permission, boolean> = {
      ...DEFAULT_PERMISSIONS,
      ...(permissions as Record<Permission, boolean>),
    };

    // 역할 생성
    const { data, error } = await supabaseAdmin
      .from('roles')
      .insert({
        name,
        displayName,
        description: description || null,
        permissions: mergedPermissions,
        isSystem: false, // 사용자 생성 역할은 isSystem = false
        order: order ?? 50, // 기본 order는 중간값
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create role:', error);
      return errorResponse('CREATE_FAILED', '역할 생성에 실패했습니다', undefined, 500);
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/roles error:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      '서버 오류가 발생했습니다',
      error instanceof Error ? error.message : undefined,
      500
    );
  }
}
