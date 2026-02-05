import { GyeonggiTPAPIClient } from '../src/lib/apis/gyeonggi-tp-api-client';
import { supabaseAdmin } from '../src/lib/supabase/admin';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function syncGyeonggiOnly() {
  console.log('🔄 경기테크노파크 데이터 동기화 시작...\n');

  const gyeonggiClient = new GyeonggiTPAPIClient();

  // 목록 수집 (1페이지만 테스트)
  console.log('📍 경기테크노파크 크롤링...');
  let page = 1;
  let totalGyeonggi = 0;
  const pageSize = 50;
  const allPrograms: Awaited<ReturnType<typeof gyeonggiClient.fetchPrograms>> = [];

  while (true) {
    const programs = await gyeonggiClient.fetchPrograms({ page, pageSize });
    if (programs.length === 0) break;

    allPrograms.push(...programs);
    totalGyeonggi += programs.length;
    console.log(`   → 목록 페이지 ${page}: ${programs.length}개 (총 ${totalGyeonggi}개)`);
    page++;

    if (programs.length < pageSize) break;
  }

  // 상세 페이지 크롤링
  console.log(`\n   → 상세 페이지 크롤링 시작... (${allPrograms.length}개)`);

  for (let i = 0; i < allPrograms.length; i++) {
    const raw = allPrograms[i];
    const bIdx = raw.id as string;

    let detail = {
      fullTitle: '',
      contentImages: [] as string[],
      attachments: [] as { fileName: string; downloadUrl: string }[],
      textContent: '',
      applyUrl: null as string | null,
      metaInfo: {} as Record<string, string>,
    };

    try {
      detail = await gyeonggiClient.fetchProgramDetail(bIdx);
      console.log(
        `   [${i + 1}/${allPrograms.length}] ${(detail.fullTitle || (raw.title as string)).slice(0, 50)}... → 이미지 ${detail.contentImages.length}개, 첨부 ${detail.attachments.length}개`
      );
    } catch (err) {
      console.warn(
        `   [${i + 1}/${allPrograms.length}] 상세 페이지 실패: ${bIdx}`,
        (err as Error).message
      );
    }

    const title = detail.fullTitle || (raw.title as string);

    const descParts: string[] = [];
    if (detail.textContent) {
      descParts.push(detail.textContent);
    }
    if (Object.keys(detail.metaInfo).length > 0) {
      const metaStr = Object.entries(detail.metaInfo)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      descParts.push(metaStr);
    }

    const sourceUrl = detail.applyUrl || gyeonggiClient.parseSourceUrl(raw);
    const keywords = gyeonggiClient.extractKeywords(raw);

    const program = {
      dataSource: '경기테크노파크',
      sourceApiId: `경기테크노파크-${raw.id}`,
      title,
      description: descParts.join('\n') || null,
      category: (raw.businessType as string) || null,
      targetAudience: gyeonggiClient.parseTargetAudience(raw),
      targetLocation: gyeonggiClient.parseLocation(raw),
      keywords,
      budgetRange: null,
      deadline: gyeonggiClient.parseDeadline(raw),
      sourceUrl,
      registeredAt: gyeonggiClient.parseRegisteredAt(raw),
      rawData: {
        ...raw,
        fullTitle: detail.fullTitle,
        contentImages: detail.contentImages,
        attachments: detail.attachments,
        textContent: detail.textContent,
        applyUrl: detail.applyUrl,
        metaInfo: detail.metaInfo,
      },
    };

    const { error } = await supabaseAdmin.from('programs').insert(program);

    if (error) {
      console.error(`   ❌ 저장 실패: ${title}`, error.message);
    }

    if (i < allPrograms.length - 1) {
      await sleep(500);
    }
  }

  console.log(`\n✅ 경기테크노파크 ${totalGyeonggi}개 저장 완료 (상세 포함)`);
}

syncGyeonggiOnly().catch(console.error);
