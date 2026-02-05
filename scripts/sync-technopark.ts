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

  // 경기테크노파크 동기화 (목록 + 상세 페이지)
  console.log('📍 경기테크노파크 크롤링...');
  let page = 1;
  let totalGyeonggi = 0;
  const pageSize = 50;
  const allGyeonggiPrograms: typeof seoulPrograms = [];

  // 1단계: 목록 수집 (페이지네이션)
  while (true) {
    const programs = await gyeonggiClient.fetchPrograms({ page, pageSize });
    if (programs.length === 0) break;

    allGyeonggiPrograms.push(...programs);
    totalGyeonggi += programs.length;
    console.log(`   → 목록 페이지 ${page}: ${programs.length}개 (총 ${totalGyeonggi}개)`);
    page++;

    if (programs.length < pageSize) break;
  }

  // 2단계: 상세 페이지 크롤링
  console.log(`   → 상세 페이지 크롤링 시작... (${allGyeonggiPrograms.length}개)`);

  for (let i = 0; i < allGyeonggiPrograms.length; i++) {
    const raw = allGyeonggiPrograms[i];
    const bIdx = raw.id as string;

    // 상세 페이지 크롤링
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
        `   [${i + 1}/${allGyeonggiPrograms.length}] ${(detail.fullTitle || (raw.title as string)).slice(0, 40)}... → 이미지 ${detail.contentImages.length}개, 첨부 ${detail.attachments.length}개`
      );
    } catch (err) {
      console.warn(
        `   [${i + 1}/${allGyeonggiPrograms.length}] 상세 페이지 실패: ${bIdx}`,
        (err as Error).message
      );
    }

    // 제목: 상세 페이지의 전체 제목 우선 사용 (목록에서는 overflow 처리로 잘림)
    const title = detail.fullTitle || (raw.title as string);

    // description 구성: 본문 텍스트 + 메타 정보
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

    // sourceUrl: 신청하기 링크 > 목록 페이지 URL
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

    // 서버 부하 방지 (500ms 딜레이)
    if (i < allGyeonggiPrograms.length - 1) {
      await sleep(500);
    }
  }
  console.log(`   ✅ 경기테크노파크 ${totalGyeonggi}개 저장 완료 (상세 포함)\n`);

  console.log('=== 동기화 결과 ===');
  console.log(`✅ 서울테크노파크: ${seoulPrograms.length}개`);
  console.log(`✅ 경기테크노파크: ${totalGyeonggi}개`);
  console.log(`📊 총합: ${seoulPrograms.length + totalGyeonggi}개`);
  console.log('\n✅ 동기화 완료!');
}

syncTechnopark().catch(console.error);
