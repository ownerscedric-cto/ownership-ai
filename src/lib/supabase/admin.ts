/**
 * @file admin.ts
 * @description Supabase Admin Client (Service Role)
 *
 * ⚠️ WARNING: Service Role Key는 서버 사이드에서만 사용해야 합니다!
 * 모든 RLS 정책을 우회하므로 클라이언트에 노출되면 안 됩니다.
 */

import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Supabase Admin Client (Service Role)
 *
 * ⚠️ 이 클라이언트는 모든 RLS 정책을 우회합니다.
 * 서버 사이드 API 라우트에서만 사용하세요!
 *
 * 사용 예시:
 * ```typescript
 * import { supabaseAdmin } from '@/lib/supabase/admin';
 *
 * // 사용자 목록 조회 (관리자 권한)
 * const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
 *
 * // 사용자 메타데이터 업데이트
 * await supabaseAdmin.auth.admin.updateUserById(userId, {
 *   app_metadata: { role: 'admin' }
 * });
 * ```
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
