/**
 * @file requireAdmin.ts
 * @description Admin role verification middleware for API routes
 *
 * 사용법:
 * ```typescript
 * import { requireAdmin } from '@/lib/auth/requireAdmin';
 *
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireAdmin(request);
 *   if (!authResult.success) {
 *     return authResult.response; // 401 or 403 error response
 *   }
 *
 *   const user = authResult.user; // Authenticated admin user
 *   // ... your admin logic here
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

interface RequireAdminSuccess {
  success: true;
  user: User;
}

interface RequireAdminError {
  success: false;
  response: NextResponse;
}

type RequireAdminResult = RequireAdminSuccess | RequireAdminError;

/**
 * Require admin role for API route access
 *
 * @param request - Next.js request object
 * @returns Success with user object, or error response (401/403)
 */
export async function requireAdmin(_request: NextRequest): Promise<RequireAdminResult> {
  try {
    // 1. Get current authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // 2. Check authentication
    if (authError || !user) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          },
          { status: 401 }
        ),
      };
    }

    // 3. Check admin role in app_metadata
    const role = user.app_metadata?.role || 'consultant';

    if (role !== 'admin') {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Admin access required',
              details: `Current role: ${role}`,
            },
          },
          { status: 403 }
        ),
      };
    }

    // 4. Success - user is authenticated and has admin role
    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error('requireAdmin error:', error);

    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Authentication check failed',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
        },
        { status: 500 }
      ),
    };
  }
}

/**
 * Check if current user is admin (without throwing errors)
 *
 * @returns true if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return false;
    }

    const role = user.app_metadata?.role || 'consultant';
    return role === 'admin';
  } catch (error) {
    console.error('isAdmin check error:', error);
    return false;
  }
}
