/**
 * @file /api/cron/sync-programs/route.ts
 * @description Vercel Cron Job 엔드포인트 - 매일 자동 동기화
 * Phase 3: 다중 API 통합 연동
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProgramSyncOrchestrator } from '@/lib/sync/program-sync-orchestrator';

/**
 * GET /api/cron/sync-programs
 *
 * Vercel Cron Job에서 호출되는 엔드포인트
 * 매일 새벽 2시에 자동으로 정부지원사업 데이터를 동기화
 *
 * 보안:
 * - Vercel Cron Secret 검증 필수
 * - Authorization 헤더에 Bearer 토큰 포함
 *
 * 응답:
 * - success: true
 * - data: { total, succeeded, failed, programCount, results }
 * - metadata: null
 */
export async function GET(request: NextRequest) {
  try {
    // Vercel Cron Secret 검증
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[GET /api/cron/sync-programs] CRON_SECRET not configured');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CRON_SECRET_NOT_CONFIGURED',
            message: 'CRON_SECRET environment variable is not configured',
            details: null,
          },
        },
        { status: 500 }
      );
    }

    // Authorization 헤더 검증
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[GET /api/cron/sync-programs] Unauthorized cron request');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or missing authorization token',
            details: null,
          },
        },
        { status: 401 }
      );
    }

    console.log('[GET /api/cron/sync-programs] Starting scheduled sync...');

    // ProgramSyncOrchestrator 인스턴스 생성
    const orchestrator = new ProgramSyncOrchestrator();

    try {
      // 모든 API 동기화 실행
      const stats = await orchestrator.syncAll();

      console.log('[GET /api/cron/sync-programs] Sync completed:', stats);

      // 성공 응답
      return NextResponse.json(
        {
          success: true,
          data: stats,
          metadata: null,
        },
        { status: 200 }
      );
    } finally {
      // Prisma 연결 해제
      await orchestrator.dispose();
    }
  } catch (error) {
    console.error('[GET /api/cron/sync-programs] Error during sync:', error);

    // 에러 응답
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SYNC_ERROR',
          message: error instanceof Error ? error.message : 'Failed to sync programs',
          details: error instanceof Error ? error.stack : null,
        },
      },
      { status: 500 }
    );
  }
}
