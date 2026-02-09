import { SeoulTPAPIClient } from '../src/lib/apis/seoul-tp-api-client';
import { supabaseAdmin } from '../src/lib/supabase/admin';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function syncSeoulOnly() {
  console.log('🔄 서울테크노파크 데이터 동기화 시작...\n');

  const seoulClient = new SeoulTPAPIClient();

  // 서울테크노파크 동기화 (목록 + 상세 페이지)
  console.log('📍 서울테크노파크 크롤링...');
  const seoulPrograms = await seoulClient.fetchPrograms({ page: 1, pageSize: 100 });
  console.log(`   → 목록 ${seoulPrograms.length}개 수집`);
  console.log('   → 상세 페이지 크롤링 시작...');

  let savedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < seoulPrograms.length; i++) {
    const raw = seoulPrograms[i];
    const boardNo = raw.id as string;

    // 상세 페이지 크롤링
    let detail = {
      contentImages: [] as string[],
      attachments: [] as { fileName: string; downloadUrl: string }[],
      textContent: '',
    };
    try {
      detail = await seoulClient.fetchProgramDetail(boardNo);
      console.log(
        `   [${i + 1}/${seoulPrograms.length}] ${(raw.title as string).slice(0, 30)}... → 이미지 ${detail.contentImages.length}개, 첨부 ${detail.attachments.length}개`
      );
    } catch (err) {
      console.warn(
        `   [${i + 1}/${seoulPrograms.length}] 상세 페이지 실패: ${boardNo}`,
        (err as Error).message
      );
    }

    // description 구성: 텍스트 콘텐츠만 (첨부파일은 rawData.attachments로 별도 관리)
    const descParts: string[] = [];
    if (detail.textContent) {
      descParts.push(detail.textContent);
    }

    const keywords = seoulClient.extractKeywords(raw);

    const program = {
      dataSource: '서울테크노파크',
      sourceApiId: `서울테크노파크-${raw.id}`,
      title: raw.title as string,
      description: descParts.join('\n') || null,
      category: keywords[0] || null,
      targetAudience: seoulClient.parseTargetAudience(raw),
      targetLocation: seoulClient.parseLocation(raw),
      keywords,
      budgetRange: null,
      deadline: seoulClient.parseDeadline(raw),
      sourceUrl: seoulClient.parseSourceUrl(raw),
      registeredAt: seoulClient.parseRegisteredAt(raw),
      rawData: {
        ...raw,
        contentImages: detail.contentImages,
        attachments: detail.attachments,
        textContent: detail.textContent,
      },
    };

    const { error } = await supabaseAdmin.from('programs').insert(program);

    if (error) {
      console.error(`   ❌ 저장 실패: ${raw.title}`, error.message);
      errorCount++;
    } else {
      savedCount++;
    }

    // 서버 부하 방지 (500ms 딜레이)
    if (i < seoulPrograms.length - 1) {
      await sleep(500);
    }
  }

  console.log(`\n✅ 서울테크노파크 동기화 완료!`);
  console.log(`   - 저장 성공: ${savedCount}개`);
  console.log(`   - 저장 실패: ${errorCount}개`);
}

syncSeoulOnly().catch(console.error);
