import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { WatchlistProgram } from '@/lib/hooks/useWatchlist';
import type { Program } from '@/lib/types/program';
import { decodeHtmlEntities } from './html';

interface FormatOptions {
  customerName?: string;
  includeHeader?: boolean;
  includeFooter?: boolean;
  headerText?: string;
}

/**
 * 프로그램 정보 타입 (WatchlistProgram 또는 일반 Program)
 */
type ProgramInfo = {
  title: string;
  dataSource: string;
  deadline: Date | string | null;
  category: string | null;
  sourceUrl: string | null;
};

/**
 * WatchlistProgram 또는 Program에서 공통 정보 추출
 */
function extractProgramInfo(item: WatchlistProgram | Program): ProgramInfo {
  // WatchlistProgram인 경우 (program 속성이 있음)
  if ('program' in item && item.program) {
    return {
      title: item.program.title,
      dataSource: item.program.dataSource,
      deadline: item.program.deadline,
      category: item.program.category,
      sourceUrl: item.program.sourceUrl,
    };
  }
  // 일반 Program인 경우
  const program = item as Program;
  return {
    title: program.title,
    dataSource: program.dataSource,
    deadline: program.deadline,
    category: program.category,
    sourceUrl: program.sourceUrl,
  };
}

/**
 * 관심 목록 프로그램들을 공유 가능한 텍스트로 변환
 *
 * @param programs - 관심 목록 프로그램 배열 또는 일반 프로그램 배열
 * @param options - 포맷 옵션
 * @returns 공유 가능한 텍스트
 */
export function formatProgramsToText(
  programs: (WatchlistProgram | Program)[],
  options: FormatOptions = {}
): string {
  const { customerName, includeHeader = true, includeFooter = true, headerText } = options;

  const lines: string[] = [];

  // 헤더
  if (includeHeader) {
    if (headerText) {
      lines.push(`📢 ${headerText}\n`);
    } else if (customerName) {
      lines.push(`📢 ${customerName}님께 추천하는 정부지원사업\n`);
    } else {
      lines.push(`📢 정부지원사업 목록\n`);
    }
  }

  // 프로그램 목록
  programs.forEach((item, index) => {
    const program = extractProgramInfo(item);

    // 번호. 제목
    lines.push(`${index + 1}. ${decodeHtmlEntities(program.title)}`);

    // 지원기관 (dataSource)
    const dataSource = normalizeDataSource(program.dataSource);
    lines.push(`   - 지원기관: ${dataSource}`);

    // 신청기한
    if (program.deadline) {
      const deadlineText = format(new Date(program.deadline), 'yyyy년 MM월 dd일', {
        locale: ko,
      });
      lines.push(`   - 신청기한: ${deadlineText}`);
    }

    // 카테고리
    if (program.category) {
      lines.push(`   - 분야: ${program.category}`);
    }

    // 상세보기 링크 (원본 공공데이터 URL)
    if (program.sourceUrl) {
      lines.push(`   - 상세보기: ${program.sourceUrl}`);
    }

    // 프로그램 간 구분선
    if (index < programs.length - 1) {
      lines.push('');
    }
  });

  // 푸터
  if (includeFooter) {
    lines.push('');
    lines.push('---');
    lines.push('문의사항이 있으시면 언제든 연락주세요! 😊');
  }

  return lines.join('\n');
}

/**
 * 데이터 소스 이름 정규화
 */
function normalizeDataSource(dataSource: string): string {
  if (dataSource === 'KOCCA-PIMS' || dataSource === 'KOCCA-Finance') {
    return '한국콘텐츠진흥원';
  }
  return dataSource;
}
