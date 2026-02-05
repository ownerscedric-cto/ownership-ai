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
 * 템플릿 기반 포맷팅을 위한 인터페이스
 */
export interface CopyTemplateData {
  headerTemplate: string | null;
  itemTemplate: string;
  footerTemplate: string | null;
}

export interface TemplateFormatOptions {
  customerName?: string;
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
  registeredAt: Date | string | null;
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
      registeredAt: item.program.registeredAt,
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
    registeredAt: program.registeredAt,
  };
}

/**
 * 등록일 기준으로 프로그램 그룹핑
 */
function groupByRegisteredDate(
  programs: (WatchlistProgram | Program)[]
): Map<string, (WatchlistProgram | Program)[]> {
  const groups = new Map<string, (WatchlistProgram | Program)[]>();

  programs.forEach(item => {
    const info = extractProgramInfo(item);
    const dateKey = info.registeredAt
      ? format(new Date(info.registeredAt), 'yyyy년 MM월 dd일', { locale: ko })
      : '등록일 미정';

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(item);
  });

  // 날짜 내림차순 정렬 (최신순)
  const sortedGroups = new Map([...groups.entries()].sort((a, b) => b[0].localeCompare(a[0])));

  return sortedGroups;
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

  // 등록일별로 그룹화
  const groupedPrograms = groupByRegisteredDate(programs);
  const hasMultipleDates = groupedPrograms.size > 1;

  let globalIndex = 0;

  // 그룹별로 프로그램 출력
  groupedPrograms.forEach((groupItems, dateKey) => {
    // 여러 날짜가 있을 때만 날짜 헤더 표시
    if (hasMultipleDates) {
      if (globalIndex > 0) {
        lines.push(''); // 그룹 간 빈 줄
      }
      lines.push(`━━━ ${dateKey} 등록 ━━━`);
      lines.push('');
    }

    groupItems.forEach((item, indexInGroup) => {
      globalIndex++;
      const program = extractProgramInfo(item);

      // 번호. 제목
      lines.push(`${globalIndex}. ${decodeHtmlEntities(program.title)}`);

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

      // 카테고리 (HTML 엔티티 디코딩 적용)
      if (program.category) {
        lines.push(`   - 분야: ${decodeHtmlEntities(program.category)}`);
      }

      // 상세보기 링크 (원본 공공데이터 URL)
      if (program.sourceUrl) {
        lines.push(`   - 상세보기: ${program.sourceUrl}`);
      }

      // 프로그램 간 구분선 (같은 그룹 내)
      if (indexInGroup < groupItems.length - 1) {
        lines.push('');
      }
    });
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

/**
 * 템플릿 변수를 치환하는 함수 (헤더/푸터용)
 */
function applyHeaderFooterVariables(
  template: string,
  options: TemplateFormatOptions & { totalCount: number }
): string {
  let result = template;
  result = result.replace(/\{\{customerName\}\}/g, options.customerName || '고객');
  result = result.replace(/\{\{totalCount\}\}/g, String(options.totalCount));
  return result;
}

/**
 * 템플릿 변수를 치환하는 함수 (아이템용)
 */
function applyItemVariables(template: string, program: ProgramInfo, index: number): string {
  let result = template;

  // 기본 변수
  result = result.replace(/\{\{index\}\}/g, String(index));
  result = result.replace(/\{\{title\}\}/g, decodeHtmlEntities(program.title));
  result = result.replace(/\{\{dataSource\}\}/g, normalizeDataSource(program.dataSource));

  // 마감일
  if (program.deadline) {
    const deadlineText = format(new Date(program.deadline), 'yyyy년 MM월 dd일', { locale: ko });
    result = result.replace(/\{\{deadline\}\}/g, deadlineText);
  } else {
    result = result.replace(/\{\{deadline\}\}/g, '미정');
  }

  // 카테고리
  result = result.replace(
    /\{\{category\}\}/g,
    program.category ? decodeHtmlEntities(program.category) : '-'
  );

  // 상세보기 URL
  result = result.replace(/\{\{sourceUrl\}\}/g, program.sourceUrl || '');

  // 등록일
  if (program.registeredAt) {
    const registeredAtText = format(new Date(program.registeredAt), 'yyyy년 MM월 dd일', {
      locale: ko,
    });
    result = result.replace(/\{\{registeredAt\}\}/g, registeredAtText);
  } else {
    result = result.replace(/\{\{registeredAt\}\}/g, '-');
  }

  return result;
}

/**
 * 템플릿 기반으로 프로그램 목록을 텍스트로 변환
 *
 * @param programs - 프로그램 배열
 * @param template - 템플릿 데이터 (headerTemplate, itemTemplate, footerTemplate)
 * @param options - 포맷 옵션
 * @returns 포맷된 텍스트
 */
export function formatProgramsWithTemplate(
  programs: (WatchlistProgram | Program)[],
  template: CopyTemplateData,
  options: TemplateFormatOptions = {}
): string {
  const parts: string[] = [];
  const totalCount = programs.length;

  // 헤더
  if (template.headerTemplate) {
    parts.push(applyHeaderFooterVariables(template.headerTemplate, { ...options, totalCount }));
    parts.push('');
  }

  // 아이템
  programs.forEach((item, idx) => {
    const program = extractProgramInfo(item);
    const formattedItem = applyItemVariables(template.itemTemplate, program, idx + 1);
    parts.push(formattedItem);
    parts.push('');
  });

  // 푸터
  if (template.footerTemplate) {
    parts.push(applyHeaderFooterVariables(template.footerTemplate, { ...options, totalCount }));
  }

  return parts.join('\n').trim();
}
