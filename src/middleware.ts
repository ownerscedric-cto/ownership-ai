import { updateSession } from '@/lib/supabase/middleware';
import { type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/programs/* (all program endpoints - public for testing)
     * - api/cron/* (Vercel Cron Job endpoints - protected by CRON_SECRET)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/programs|api/cron/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
