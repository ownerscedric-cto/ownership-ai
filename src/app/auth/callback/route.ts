import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/dashboard';

  // 디버깅: 전달받은 파라미터 로깅
  console.log('[Auth Callback] Params:', {
    code: code ? `${code.substring(0, 10)}...` : null,
    token_hash: token_hash ? `${token_hash.substring(0, 10)}...` : null,
    type,
    next,
    origin,
  });

  const supabase = await createClient();

  // PKCE flow: code 파라미터로 세션 교환
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[Auth Callback] PKCE exchange error:', error.message);
    } else {
      console.log('[Auth Callback] PKCE exchange successful, type:', type);

      // recovery 타입인 경우 비밀번호 재설정 페이지로 리다이렉트
      if (type === 'recovery') {
        return redirectToNext(request, origin, '/auth/reset-password');
      }

      return redirectToNext(request, origin, next);
    }
  }

  // Email OTP flow: token_hash와 type으로 인증 확인
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (error) {
      console.error('[Auth Callback] OTP verify error:', error.message);
    } else {
      console.log('[Auth Callback] OTP verify successful, type:', type);

      // recovery 타입인 경우 비밀번호 재설정 페이지로 리다이렉트
      if (type === 'recovery') {
        return redirectToNext(request, origin, '/auth/reset-password');
      }

      return redirectToNext(request, origin, next);
    }
  }

  // 파라미터가 없는 경우
  if (!code && !token_hash) {
    console.error('[Auth Callback] No code or token_hash provided');
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}

function redirectToNext(request: Request, origin: string, next: string) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';

  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${next}`);
  } else if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
  } else {
    return NextResponse.redirect(`${origin}${next}`);
  }
}
