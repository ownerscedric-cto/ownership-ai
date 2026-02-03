/**
 * @file programImageGenerator.tsx
 * @description 프로그램 목록을 이미지로 생성하는 유틸리티
 */

import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Program } from '@/lib/types/program';
import { decodeHtmlEntities } from './html';

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
 * 데이터 소스에 따른 뱃지 색상 반환
 */
function getTextColors(dataSource: string): { bg: string; text: string } {
  switch (dataSource) {
    case 'K-Startup':
      return { bg: '#dcfce7', text: '#166534' };
    case '기업마당':
      return { bg: '#dbeafe', text: '#1e40af' };
    case '한국콘텐츠진흥원':
      return { bg: '#f3e8ff', text: '#6b21a8' };
    case '서울테크노파크':
      return { bg: '#fef3c7', text: '#b45309' }; // amber
    case '경기테크노파크':
      return { bg: '#fce7f3', text: '#be185d' }; // pink
    default:
      return { bg: '#f3f4f6', text: '#374151' };
  }
}

/**
 * 등록일 기준으로 프로그램 그룹핑
 */
function groupByRegisteredDate(programs: Program[]): Map<string, Program[]> {
  const groups = new Map<string, Program[]>();

  programs.forEach(program => {
    const dateKey = program.registeredAt
      ? format(new Date(program.registeredAt), 'yyyy년 MM월 dd일', { locale: ko })
      : '등록일 미정';

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(program);
  });

  // 날짜 내림차순 정렬 (최신순)
  return new Map([...groups.entries()].sort((a, b) => b[0].localeCompare(a[0])));
}

/**
 * 프로그램 목록을 이미지로 생성하여 다운로드
 */
export async function generateProgramImage(programs: Program[]): Promise<void> {
  // 임시 컨테이너 생성
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '900px';
  container.style.backgroundColor = '#ffffff';
  container.style.fontFamily =
    'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

  // 등록일별로 그룹화
  const groupedPrograms = groupByRegisteredDate(programs);
  const hasMultipleDates = groupedPrograms.size > 1;
  const today = format(new Date(), 'yyyy년 MM월 dd일', { locale: ko });

  // HTML 생성 (Flexbox 기반 - html2canvas 호환성 향상)
  let globalIndex = 0;
  let rowsHtml = '';

  groupedPrograms.forEach((groupItems, dateKey) => {
    // 여러 날짜가 있을 때만 날짜 헤더 표시
    if (hasMultipleDates) {
      rowsHtml += `
        <div style="height: 36px; background-color: #f3f4f6; border-bottom: 2px solid #d1d5db; box-sizing: border-box; padding-left: 16px;">
          <span style="font-weight: 600; color: #374151; font-size: 14px;">${dateKey} 등록</span>
        </div>
      `;
    }

    groupItems.forEach(program => {
      globalIndex++;
      const title = decodeHtmlEntities(program.title);
      const truncatedTitle = title.length > 45 ? title.substring(0, 45) + '...' : title;
      const dataSource = normalizeDataSource(program.dataSource);
      const textColor = getTextColors(dataSource).text;
      const deadline = program.deadline
        ? format(new Date(program.deadline), 'MM.dd', { locale: ko })
        : '-';

      rowsHtml += `
        <div style="display: flex; height: 40px; border-bottom: 1px solid #e5e7eb; box-sizing: border-box;">
          <div style="width: 40px; text-align: center; color: #6b7280; font-size: 14px; flex-shrink: 0; box-sizing: border-box;">
            ${globalIndex}
          </div>
          <div style="flex: 1; color: #111827; font-size: 14px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; box-sizing: border-box;">
            ${truncatedTitle}
          </div>
          <div style="width: 130px; height: 40px; text-align: center; flex-shrink: 0; font-size: 13px; font-weight: 600; color: ${textColor}; white-space: nowrap; box-sizing: border-box;">
            ${dataSource}
          </div>
          <div style="width: 60px; text-align: center; color: #6b7280; font-size: 14px; flex-shrink: 0; box-sizing: border-box;">
            ${deadline}
          </div>
        </div>
      `;
    });
  });

  container.innerHTML = `
    <div style="padding: 24px; background: linear-gradient(135deg, #0052CC 0%, #003d99 100%); color: white;">
      <div style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">
        정부지원사업 목록
      </div>
      <div style="font-size: 14px; opacity: 0.9;">
        ${programs.length}건 | ${today} 기준
      </div>
    </div>

    <!-- 헤더 -->
    <div style="display: flex; height: 36px; background-color: #f9fafb; border-bottom: 2px solid #e5e7eb; box-sizing: border-box;">
      <div style="width: 40px; text-align: center; font-weight: 600; color: #374151; font-size: 13px; flex-shrink: 0; box-sizing: border-box;">No</div>
      <div style="flex: 1; text-align: center; font-weight: 600; color: #374151; font-size: 13px; box-sizing: border-box;">프로그램명</div>
      <div style="width: 130px; text-align: center; font-weight: 600; color: #374151; font-size: 13px; flex-shrink: 0; box-sizing: border-box;">지원기관</div>
      <div style="width: 60px; text-align: center; font-weight: 600; color: #374151; font-size: 13px; flex-shrink: 0; box-sizing: border-box;">마감</div>
    </div>

    <!-- 데이터 행 -->
    ${rowsHtml}

    <div style="padding: 16px 24px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
      <span style="color: #0052CC; font-weight: 600; font-size: 14px;">Ownership AI</span>
      <span style="color: #9ca3af; font-size: 12px; margin-left: 8px;">| 정부지원사업 AI 매칭 플랫폼</span>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // html2canvas로 이미지 생성
    const canvas = await html2canvas(container, {
      scale: 2, // 고해상도
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    });

    // 이미지 다운로드
    const link = document.createElement('a');
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    link.download = `정부지원사업_${dateStr}_${programs.length}건.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } finally {
    // 임시 컨테이너 제거
    document.body.removeChild(container);
  }
}
