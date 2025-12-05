import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * 일반 서버 클라이언트 (RLS 적용됨)
 * - 사용자 인증 기반 접근 제어
 * - Server Components, API Routes에서 사용
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * 서비스 역할 클라이언트 (RLS 우회)
 * - 관리자 권한으로 모든 데이터 접근 가능
 * - API Routes에서만 사용 (절대 프론트엔드 노출 금지!)
 * - 사용 예: 프로그램 동기화, 매칭 알고리즘 실행
 *
 * @security NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY는 서버 환경에서만 사용
 */
export function createServiceClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY is not defined');
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
