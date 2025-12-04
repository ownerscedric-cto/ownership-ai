/**
 * @file program-sync-orchestrator.ts
 * @description 다중 API 통합 동기화 오케스트레이터
 * Phase 3: 다중 API 통합 연동 (기업마당, K-Startup, KOCCA)
 */

import { PrismaClient } from '@prisma/client';
import type { IProgramAPIClient, RawProgramData } from '../apis/base-api-client';
import { BizinfoAPIClient } from '../apis/bizinfo-api-client';
import { KStartupAPIClient } from '../apis/kstartup-api-client';
import { KoccaPIMSAPIClient } from '../apis/kocca-pims-api-client';
import { KoccaFinanceAPIClient } from '../apis/kocca-finance-api-client';

const prisma = new PrismaClient();

/**
 * 동기화 결과 타입
 */
interface SyncResult {
  dataSource: string;
  success: boolean;
  count?: number;
  error?: string;
}

/**
 * 동기화 통계 타입
 */
interface SyncStats {
  total: number;
  succeeded: number;
  failed: number;
  programCount: number;
  results: SyncResult[];
}

/**
 * 정부지원사업 데이터 동기화 오케스트레이터
 *
 * 다중 API (기업마당, K-Startup, KOCCA-PIMS, KOCCA-Finance)를 병렬로 호출하고
 * 각 API에서 가져온 데이터를 데이터베이스에 동기화
 *
 * 핵심 기능:
 * - Promise.allSettled를 사용한 병렬 동기화
 * - 부분 실패 허용 (하나의 API 실패해도 나머지는 계속 진행)
 * - 교차 정렬을 위한 registeredAt 필드 매핑
 * - 중복 방지 (dataSource + sourceApiId unique constraint)
 */
export class ProgramSyncOrchestrator {
  private readonly clients: IProgramAPIClient[];

  constructor() {
    this.clients = [
      new BizinfoAPIClient(),
      new KStartupAPIClient(),
      new KoccaPIMSAPIClient(),
      new KoccaFinanceAPIClient(),
    ];
  }

  /**
   * 모든 API를 병렬로 동기화
   *
   * @returns 동기화 통계
   */
  async syncAll(): Promise<SyncStats> {
    console.log('[ProgramSyncOrchestrator] Starting sync for all APIs...');

    // Promise.allSettled로 병렬 동기화 (부분 실패 허용)
    const results = await Promise.allSettled(
      this.clients.map(client => this.syncFromClient(client))
    );

    // 결과 집계
    const syncResults: SyncResult[] = results.map((result, index) => {
      const dataSource = this.clients[index].getDataSource();

      if (result.status === 'fulfilled') {
        return {
          dataSource,
          success: true,
          count: result.value,
        };
      } else {
        return {
          dataSource,
          success: false,
          error: result.reason?.message || 'Unknown error',
        };
      }
    });

    const succeeded = syncResults.filter(r => r.success).length;
    const failed = syncResults.filter(r => !r.success).length;
    const programCount = syncResults.reduce((sum, r) => sum + (r.count || 0), 0);

    const stats: SyncStats = {
      total: results.length,
      succeeded,
      failed,
      programCount,
      results: syncResults,
    };

    console.log('[ProgramSyncOrchestrator] Sync completed:', stats);

    return stats;
  }

  /**
   * 단일 API 클라이언트에서 데이터를 동기화
   *
   * @param client - API 클라이언트
   * @returns 동기화된 프로그램 개수
   */
  private async syncFromClient(client: IProgramAPIClient): Promise<number> {
    const dataSource = client.getDataSource();
    console.log(`[ProgramSyncOrchestrator] Syncing from ${dataSource}...`);

    try {
      let totalCount = 0;
      let currentPage = 1;
      const pageSize = 50;
      const MAX_PAGES = 5; // ⭐ API별 최대 5페이지 제한 (페이지당 50개 = 최대 250개)
      let hasMore = true;

      // 최대 페이지 제한 내에서 조회
      while (hasMore && currentPage <= MAX_PAGES) {
        // API에서 프로그램 목록 조회
        const rawPrograms = await client.fetchPrograms({
          page: currentPage,
          pageSize,
        });

        console.log(
          `[ProgramSyncOrchestrator] Fetched ${rawPrograms.length} programs from ${dataSource} (page ${currentPage})`
        );

        // 프로그램이 없으면 종료
        if (rawPrograms.length === 0) {
          hasMore = false;
          break;
        }

        // 각 프로그램을 데이터베이스에 upsert
        for (const raw of rawPrograms) {
          try {
            await this.upsertProgram(client, raw);
            totalCount++;
          } catch (error) {
            console.error(
              `[ProgramSyncOrchestrator] Error upserting program from ${dataSource}:`,
              error
            );
            // 개별 프로그램 upsert 실패는 무시하고 계속 진행
          }
        }

        // 반환된 프로그램 수가 pageSize보다 적으면 마지막 페이지
        if (rawPrograms.length < pageSize) {
          hasMore = false;
        } else {
          currentPage++;
        }
      }

      console.log(
        `[ProgramSyncOrchestrator] Successfully synced ${totalCount} programs from ${dataSource} (${currentPage} pages)`
      );

      return totalCount;
    } catch (error) {
      console.error(`[ProgramSyncOrchestrator] Error syncing from ${dataSource}:`, error);
      throw error;
    }
  }

  /**
   * HTML 엔티티만 디코딩 (HTML 태그는 유지)
   * KOCCA-Finance에서 사용 - 테이블, 리스트 등 구조 보존
   *
   * @param html - HTML 엔티티가 포함된 HTML 문자열
   * @returns HTML 엔티티가 디코딩된 HTML
   */
  private decodeHtmlEntities(html: string): string {
    return html
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rsquo;/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&hellip;/g, '...')
      .replace(/&bull;/g, '•')
      .replace(/&nbsp;/g, ' ')
      .replace(/&middot;/g, '·')
      .replace(/&ndash;/g, '–')
      .replace(/&mdash;/g, '—')
      .replace(/&#(\d+);?/g, (match, code) => String.fromCharCode(parseInt(code))) // 숫자 엔티티 디코딩 (①, ②, •, ■ 등)
      .replace(/&[a-z]+;?/gi, '') // 남은 엔티티 제거
      .replace(/&amp;/g, '&'); // &amp;는 마지막에 처리
  }

  /**
   * KOCCA-Finance HTML 정리 (HTML 엔티티 디코딩 + HTML 태그 제거)
   * ⚠️ 현재 사용하지 않음 - decodeHtmlEntities로 대체
   *
   * @param html - HTML 엔티티가 포함된 문자열
   * @returns 깔끔한 텍스트
   */
  private cleanKoccaFinanceHtml(html: string): string {
    // 1. HTML 엔티티 디코딩 (&lt; → <, &quot; → ", etc.)
    let decoded = html
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');

    // 2. HTML 주석 제거 (<!-- ... -->)
    decoded = decoded.replace(/<!--[\s\S]*?-->/g, '');

    // 3. HTML 태그 제거
    decoded = decoded.replace(/<[^>]*>/g, '');

    // 4. 숫자 형식 HTML 엔티티 제거 (&#9312;, &#9313; 등)
    decoded = decoded.replace(/&#\d+;?/g, '');

    // 5. 이름 있는 HTML 엔티티 정리 (따옴표, 줄임표, 불릿 등)
    decoded = decoded
      .replace(/&nbsp;/g, ' ')
      .replace(/&middot;/g, '·')
      .replace(/&ndash;/g, '–')
      .replace(/&mdash;/g, '—')
      .replace(/&lsquo;/g, "'")
      .replace(/&rsquo;/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&hellip;/g, '...')
      .replace(/&bull;/g, '•');

    // 6. 남은 모든 HTML 엔티티 제거 (&로 시작하는 패턴)
    decoded = decoded.replace(/&[a-z]+;?/gi, '');

    // 7. 연속된 공백 정리
    decoded = decoded.replace(/\s+/g, ' ').trim();

    return decoded;
  }

  /**
   * 프로그램 데이터를 데이터베이스에 추가 (신규만)
   * ⭐ 기존 데이터는 절대 수정하지 않음 - 신규 데이터만 추가
   *
   * @param client - API 클라이언트
   * @param raw - 원본 프로그램 데이터
   */
  private async upsertProgram(client: IProgramAPIClient, raw: RawProgramData): Promise<void> {
    const dataSource = client.getDataSource();

    // 원본 ID 추출 (API별 필드명이 다름, 문자열로 변환)
    const sourceApiIdRaw =
      raw.pblancId || // 기업마당
      raw.pbanc_sn || // K-Startup (숫자)
      raw.intcNoSeq || // KOCCA-PIMS
      raw.seq || // KOCCA-Finance (link에서 추출)
      raw.id ||
      raw.announcementId ||
      raw.bizId ||
      raw.noticeId;

    const sourceApiId = sourceApiIdRaw ? String(sourceApiIdRaw) : null;

    if (!sourceApiId) {
      console.warn(`[ProgramSyncOrchestrator] Skipping program without ID from ${dataSource}`, raw);
      return;
    }

    // ⭐ 기존 데이터 존재 여부 확인
    const existing = await prisma.program.findUnique({
      where: {
        dataSource_sourceApiId: {
          dataSource,
          sourceApiId,
        },
      },
    });

    // 이미 존재하면 아무것도 하지 않음 (기존 데이터 보존)
    if (existing) {
      console.log(
        `[ProgramSyncOrchestrator] Program already exists, skipping: ${dataSource}-${sourceApiId}`
      );
      return;
    }

    // 필드 추출 (API별 필드명이 다름)
    const title =
      (raw.pblancNm as string) || // 기업마당
      (raw.biz_pbanc_nm as string) || // K-Startup
      (raw.title as string) ||
      (raw.announcementTitle as string) ||
      '제목 없음';

    // K-Startup의 경우 섹션별로 구조화된 description 생성
    let description: string | null = null;
    if (dataSource === 'K-Startup') {
      const sections: string[] = [];

      // 공고 상세
      if (raw.pbanc_ctnt && typeof raw.pbanc_ctnt === 'string') {
        sections.push(`공고 상세: ${raw.pbanc_ctnt}`);
      }

      // 지원 대상
      if (raw.aply_trgt_ctnt && typeof raw.aply_trgt_ctnt === 'string') {
        sections.push(`지원 대상: ${raw.aply_trgt_ctnt}`);
      }

      // 연령 제한
      if (raw.biz_trgt_age && typeof raw.biz_trgt_age === 'string') {
        sections.push(`연령 제한: ${raw.biz_trgt_age}`);
      }

      // 지원 제한 대상
      if (raw.aply_excl_trgt_ctnt && typeof raw.aply_excl_trgt_ctnt === 'string') {
        sections.push(`지원 제한 대상: ${raw.aply_excl_trgt_ctnt}`);
      }

      // 주관 기관
      if (raw.pbanc_ntrp_nm && typeof raw.pbanc_ntrp_nm === 'string') {
        sections.push(`주관 기관: ${raw.pbanc_ntrp_nm}`);
      }

      // 지원 분야
      if (raw.supt_biz_clsfc && typeof raw.supt_biz_clsfc === 'string') {
        sections.push(`지원 분야: ${raw.supt_biz_clsfc}`);
      }

      description = sections.length > 0 ? sections.join('\n\n') : null;
    } else if (dataSource === 'KOCCA-Finance') {
      // KOCCA-Finance의 경우 HTML 엔티티만 디코딩, HTML 태그는 유지 (구조 보존)
      const rawContent = (raw.content as string) || null;
      if (rawContent) {
        description = this.decodeHtmlEntities(rawContent);
      }
    } else {
      // 기업마당, KOCCA-PIMS 등 다른 API
      description =
        (raw.bsnsSumryCn as string) || // 기업마당
        (raw.description as string) ||
        (raw.content as string) ||
        null;
    }

    const category =
      (raw.pldirSportRealmLclasCodeNm as string) || // 기업마당
      (raw.supt_biz_clsfc as string) || // K-Startup
      (raw.cate as string) || // KOCCA-PIMS
      (raw.category as string) ||
      null;
    const targetAudience = client.parseTargetAudience(raw);
    const targetLocation = client.parseLocation(raw);
    const keywords = client.extractKeywords(raw);
    const budgetRange = (raw.budgetRange as string) || null;
    const deadline = client.parseDeadline(raw); // ⭐ API 클라이언트가 마감일 추출
    const sourceUrl = client.parseSourceUrl(raw); // ⭐ API 클라이언트가 URL 추출
    const attachmentUrl = client.parseAttachmentUrl(raw); // ⭐ API 클라이언트가 첨부파일 URL 추출
    const registeredAt = client.parseRegisteredAt(raw); // ⭐ 교차 정렬용
    const startDate = client.parseStartDate(raw); // ⭐ API 클라이언트가 시작일 추출
    const endDate = deadline; // ⭐ endDate는 deadline과 동일

    // ⭐ 신규 프로그램만 생성 (기존 데이터는 위에서 이미 체크하여 리턴됨)
    await prisma.program.create({
      data: {
        dataSource,
        sourceApiId,
        title,
        description,
        category,
        targetAudience,
        targetLocation,
        keywords,
        budgetRange,
        deadline,
        sourceUrl,
        attachmentUrl, // ⭐ 첨부파일 URL (기업마당 API만 제공)
        registeredAt, // ⭐ 교차 정렬용
        startDate,
        endDate,
        rawData: raw as object,
        syncStatus: 'active',
      },
    });

    console.log(
      `[ProgramSyncOrchestrator] ✅ New program added: ${dataSource}-${sourceApiId} - ${title}`
    );
  }

  /**
   * 리소스 정리 (Prisma 연결 해제)
   */
  async dispose(): Promise<void> {
    await prisma.$disconnect();
  }
}
