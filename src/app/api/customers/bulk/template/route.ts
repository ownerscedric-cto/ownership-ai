import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

/**
 * GET /api/customers/bulk/template
 * 고객 일괄 등록용 엑셀 템플릿 다운로드 API
 */
export async function GET(_request: NextRequest) {
  try {
    // 엑셀 워크북 생성
    const workbook = XLSX.utils.book_new();

    // 컬럼 헤더 (한글명)
    const headers = [
      '사업자등록번호*',
      '사업자유형*',
      '법인등록번호',
      '사업자명/상호*',
      '업종',
      '기업규모',
      '지역',
      '예산',
      '과제',
      '목표',
      '선호키워드',
      '이메일',
      '전화번호',
      '메모',
    ];

    // 필수/선택 안내 행
    const instructions = [
      '필수 (10자리 숫자)',
      '필수 (INDIVIDUAL 또는 CORPORATE)',
      '법인사업자만 필수 (13자리 숫자)',
      '필수',
      '선택',
      '선택',
      '선택',
      '선택 (숫자만)',
      '선택 (쉼표로 구분)',
      '선택 (쉼표로 구분)',
      '선택 (쉼표로 구분)',
      '선택',
      '선택',
      '선택',
    ];

    // 샘플 데이터 1 - 개인사업자
    const sample1 = [
      '1234567890',
      'INDIVIDUAL',
      '',
      '(주)테크스타트업',
      'IT/소프트웨어',
      '10-50명',
      '서울',
      '50000000',
      'AI 기술 개발,인력 확보',
      '기술 혁신,시장 확대',
      'AI,스타트업,기술개발',
      'contact@techstartup.com',
      '02-1234-5678',
      'AI 기반 솔루션 개발 중',
    ];

    // 샘플 데이터 2 - 법인사업자
    const sample2 = [
      '9876543210',
      'CORPORATE',
      '1234567890123',
      '글로벌이노베이션(주)',
      '제조업',
      '50-100명',
      '경기',
      '100000000',
      '생산성 향상,품질 개선',
      '매출 증대,해외 진출',
      '스마트팩토리,IoT,수출',
      'info@global-innovation.co.kr',
      '031-9876-5432',
      '스마트팩토리 구축 희망',
    ];

    // 샘플 데이터 3 - 개인사업자 (최소 필수 항목만)
    const sample3 = [
      '5555666677',
      'INDIVIDUAL',
      '',
      '작은상점',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ];

    // 워크시트 데이터 생성
    const worksheetData = [headers, instructions, sample1, sample2, sample3];

    // 워크시트 생성
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // 컬럼 너비 설정
    worksheet['!cols'] = [
      { wch: 18 }, // 사업자등록번호
      { wch: 15 }, // 사업자유형
      { wch: 18 }, // 법인등록번호
      { wch: 20 }, // 사업자명/상호
      { wch: 15 }, // 업종
      { wch: 12 }, // 기업규모
      { wch: 10 }, // 지역
      { wch: 12 }, // 예산
      { wch: 30 }, // 과제
      { wch: 30 }, // 목표
      { wch: 30 }, // 선호키워드
      { wch: 25 }, // 이메일
      { wch: 15 }, // 전화번호
      { wch: 30 }, // 메모
    ];

    // 워크시트를 워크북에 추가
    XLSX.utils.book_append_sheet(workbook, worksheet, '고객 정보');

    // 엑셀 파일을 Buffer로 변환
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    // 파일 다운로드 응답 반환
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="customer_bulk_upload_template_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('템플릿 생성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TEMPLATE_GENERATION_ERROR',
          message: '템플릿 파일 생성 중 오류가 발생했습니다',
          details: error instanceof Error ? error.message : '알 수 없는 오류',
        },
      },
      { status: 500 }
    );
  }
}
