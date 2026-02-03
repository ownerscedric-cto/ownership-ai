import { SeoulTPAPIClient } from '../src/lib/apis/seoul-tp-api-client';
import { GyeonggiTPAPIClient } from '../src/lib/apis/gyeonggi-tp-api-client';
import { supabaseAdmin } from '../src/lib/supabase/admin';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function syncTechnopark() {
  console.log('🔄 테크노파크 데이터 동기화 시작...\n');

  const seoulClient = new SeoulTPAPIClient();
  const gyeonggiClient = new GyeonggiTPAPIClient();

  // 서울테크노파크 동기화 (목록 + 상세 페이지)
  console.log('📍 서울테크노파크 크롤링...');
  const seoulPrograms = await seoulClient.fetchPrograms({ page: 1, pageSize: 100 });
  console.log(`   → 목록 ${seoulPrograms.length}개 수집`);
  console.log('   → 상세 페이지 크롤링 시작...');

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
    }

    // 서버 부하 방지 (500ms 딜레이)
    if (i < seoulPrograms.length - 1) {
      await sleep(500);
    }
  }
  console.log(`   ✅ 서울테크노파크 ${seoulPrograms.length}개 저장 완료 (상세 포함)\n`);

  // 경기테크노파크 동기화 (페이지네이션)
  console.log('📍 경기테크노파크 크롤링...');
  let page = 1;
  let totalGyeonggi = 0;
  const pageSize = 50;

  while (true) {
    const programs = await gyeonggiClient.fetchPrograms({ page, pageSize });
    if (programs.length === 0) break;

    for (const raw of programs) {
      const program = {
        dataSource: '경기테크노파크',
        sourceApiId: `경기테크노파크-${raw.id}`,
        title: raw.title as string,
        description:
          [
            raw.businessType ? `사업유형: ${raw.businessType}` : null,
            raw.hostOrganization ? `주관기관: ${raw.hostOrganization}` : null,
            raw.applicationPeriod ? `신청기간: ${raw.applicationPeriod}` : null,
          ]
            .filter(Boolean)
            .join('\n') || null,
        category: (raw.businessType as string) || null,
        targetAudience: gyeonggiClient.parseTargetAudience(raw),
        targetLocation: gyeonggiClient.parseLocation(raw),
        keywords: gyeonggiClient.extractKeywords(raw),
        budgetRange: null,
        deadline: gyeonggiClient.parseDeadline(raw),
        sourceUrl: gyeonggiClient.parseSourceUrl(raw),
        registeredAt: gyeonggiClient.parseRegisteredAt(raw),
        rawData: raw,
      };

      const { error } = await supabaseAdmin.from('programs').insert(program);

      if (error) {
        console.error(`   ❌ 저장 실패: ${raw.title}`, error.message);
      }
    }

    totalGyeonggi += programs.length;
    console.log(`   → 페이지 ${page}: ${programs.length}개 (총 ${totalGyeonggi}개)`);
    page++;

    // 마지막 페이지면 종료
    if (programs.length < pageSize) break;
  }
  console.log(`   ✅ 경기테크노파크 ${totalGyeonggi}개 저장 완료\n`);

  console.log('=== 동기화 결과 ===');
  console.log(`✅ 서울테크노파크: ${seoulPrograms.length}개`);
  console.log(`✅ 경기테크노파크: ${totalGyeonggi}개`);
  console.log(`📊 총합: ${seoulPrograms.length + totalGyeonggi}개`);
  console.log('\n✅ 동기화 완료!');
}

syncTechnopark().catch(console.error);
