/**
 * @file ProgramDetail.tsx
 * @description 프로그램 상세 정보 컴포넌트
 * Phase 3: 정부지원사업 UI 컴포넌트
 */

'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Calendar,
  MapPin,
  Tag,
  Building2,
  ExternalLink,
  ChevronLeft,
  DollarSign,
  Clock,
  Database,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import { useProgram } from '@/lib/hooks/usePrograms';
import { AlertCircle } from 'lucide-react';
import { DeadlineBadge } from './DeadlineBadge';

interface ProgramDetailProps {
  id: string;
}

/**
 * 데이터 소스별 Badge 색상 매핑
 */
const dataSourceColors: Record<string, string> = {
  기업마당: 'bg-blue-100 text-blue-800',
  'K-Startup': 'bg-green-100 text-green-800',
  한국콘텐츠진흥원: 'bg-purple-100 text-purple-800',
};

/**
 * 프로그램 상세 정보 컴포넌트
 *
 * 기능:
 * - 프로그램 전체 정보 표시
 * - 데이터 소스 Badge
 * - 카테고리, 마감일, 대상 업종/지역
 * - 예산 범위
 * - 키워드
 * - 원본 URL 링크
 * - 로딩/에러 상태
 */
export function ProgramDetail({ id }: ProgramDetailProps) {
  const { data: program, isLoading, error } = useProgram(id);

  /**
   * 로딩 상태
   */
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  /**
   * 에러 상태
   */
  if (error) {
    return (
      <Alert variant="destructive" className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4" />
        <div className="ml-2">
          <h4 className="font-semibold">프로그램 로딩 실패</h4>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      </Alert>
    );
  }

  if (!program) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <div className="ml-2">
          <h4 className="font-semibold text-yellow-900">프로그램을 찾을 수 없습니다</h4>
          <p className="text-sm text-yellow-700 mt-1">
            프로그램 ID가 잘못되었거나 삭제된 프로그램입니다.
          </p>
        </div>
      </Alert>
    );
  }

  // 날짜 포맷팅
  const formattedDeadline = program.deadline
    ? format(new Date(program.deadline), 'yyyy년 M월 d일', { locale: ko })
    : null;

  const formattedRegisteredAt = format(new Date(program.registeredAt), 'yyyy년 M월 d일', {
    locale: ko,
  });

  const formattedStartDate = program.startDate
    ? format(new Date(program.startDate), 'yyyy.MM.dd', { locale: ko })
    : null;

  const formattedEndDate = program.endDate
    ? format(new Date(program.endDate), 'yyyy.MM.dd', { locale: ko })
    : null;

  // HTML 엔티티 디코딩 헬퍼 함수
  const decodeHtmlEntities = (text: string): string => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  // 데이터 소스 이름 정규화 함수
  // KOCCA-PIMS, KOCCA-Finance → 한국콘텐츠진흥원
  const normalizeDataSource = (dataSource: string): string => {
    if (dataSource === 'KOCCA-PIMS' || dataSource === 'KOCCA-Finance') {
      return '한국콘텐츠진흥원';
    }
    return dataSource;
  };

  // 프로그램 설명 포맷팅 함수 (간단한 단락 구분 및 제목 강조)
  const formatDescription = (description: string): string => {
    let formatted = description;

    // 0. \n 문자열을 실제 줄바꿈으로 변환 (DB에 문자열로 저장된 경우)
    formatted = formatted.replace(/\\n/g, '\n');

    // 1. 섹션 제목 강조 및 뒤에 줄바꿈 추가
    formatted = formatted.replace(
      /(^|\n)([가-힣\s]{2,30}):/gm,
      '$1<strong class="block text-lg font-bold text-gray-900 mt-6 mb-1 pb-2 border-b border-gray-300">$2</strong>\n'
    );

    // 2. [서브섹션] 강조
    formatted = formatted.replace(
      /(\[[\w가-힣\s]+\])/g,
      '<span class="font-semibold text-[#0052CC]">$1</span>'
    );

    // 3. KOCCA 깨진 링크 수정
    // 패턴: (http://example.com" target="_blank" rel="noopener noreferrer" title="새창 열기">http://example.com)
    // → (<a href="http://example.com" target="_blank" rel="noopener noreferrer">http://example.com</a>)
    formatted = formatted.replace(
      /\((https?:\/\/[^\s"]+)" target="_blank"[^>]*>([^)]+)\)/g,
      '(<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#0052CC] hover:underline break-all">$2</a>)'
    );

    // 괄호 없는 경우도 처리
    formatted = formatted.replace(
      /(https?:\/\/[^\s"]+)" target="_blank"[^>]*>([^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#0052CC] hover:underline break-all">$2</a>'
    );

    // 4. 일반 URL을 링크로 변환 (아직 링크가 아닌 URL만)
    formatted = formatted.replace(
      /(?<!href=")(https?:\/\/[^\s<"]+)(?!")/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#0052CC] hover:underline break-all">$1</a>'
    );

    // 5. 이메일 주소 강조
    formatted = formatted.replace(
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      '<span class="text-[#0052CC]">$1</span>'
    );

    return formatted;
  };

  return (
    <div className="space-y-6">
      {/* 뒤로 가기 버튼 */}
      <Link href="/programs">
        <Button variant="ghost" size="sm" className="mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" />
          목록으로
        </Button>
      </Link>

      {/* 메인 정보 카드 */}
      <Card>
        <CardHeader className="space-y-4">
          {/* 데이터 소스 Badge + 마감일 Badge + 등록일 */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge
                className={`${dataSourceColors[normalizeDataSource(program.dataSource)] || 'bg-gray-100 text-gray-800'} text-base px-3 py-1`}
              >
                {normalizeDataSource(program.dataSource)}
              </Badge>
              <DeadlineBadge deadline={program.deadline} />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>등록일: {formattedRegisteredAt}</span>
            </div>
          </div>

          {/* 제목 */}
          <CardTitle className="text-2xl font-bold text-gray-900">
            {decodeHtmlEntities(program.title)}
          </CardTitle>

          {/* 카테고리 */}
          {program.category && (
            <div className="flex items-center gap-2 text-base">
              <Tag className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700 font-medium">{program.category}</span>
            </div>
          )}

          {/* 공고 바로가기 버튼 */}
          {program.sourceUrl && (
            <a
              href={program.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <Button className="w-full sm:w-auto bg-[#0052CC] hover:bg-[#003d99] text-white font-semibold px-6 py-3 text-base">
                <ExternalLink className="w-5 h-5 mr-2" />
                원본 공고 바로가기
              </Button>
            </a>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 설명 */}
          {program.description && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">프로그램 설명</h3>
              <div
                className={`text-gray-900 text-base leading-relaxed ${
                  program.dataSource === 'KOCCA-Finance' ? 'kocca-content' : 'whitespace-pre-line'
                }`}
                dangerouslySetInnerHTML={{ __html: formatDescription(program.description) }}
              />
            </div>
          )}

          <Separator />

          {/* 주요 정보 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 마감일 */}
            {formattedDeadline && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-gray-900">
                  <Calendar className="w-5 h-5 text-red-600" />
                  <span>마감일</span>
                </div>
                <p className="text-red-600 font-medium text-lg">{formattedDeadline}</p>
              </div>
            )}

            {/* 기간 */}
            {(formattedStartDate || formattedEndDate) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-gray-900">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <span>사업 기간</span>
                </div>
                <p className="text-gray-700">
                  {formattedStartDate && formattedEndDate
                    ? `${formattedStartDate} ~ ${formattedEndDate}`
                    : formattedStartDate || formattedEndDate}
                </p>
              </div>
            )}

            {/* 예산 범위 */}
            {program.budgetRange && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-gray-900">
                  <DollarSign className="w-5 h-5 text-gray-600" />
                  <span>예산 범위</span>
                </div>
                <p className="text-gray-700">{program.budgetRange}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* 대상 업종 */}
          {program.targetAudience.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-semibold text-gray-900">
                <Building2 className="w-5 h-5 text-gray-600" />
                <span>대상 업종</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {program.targetAudience.map((audience, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {decodeHtmlEntities(audience)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 대상 지역 */}
          {program.targetLocation.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-semibold text-gray-900">
                <MapPin className="w-5 h-5 text-gray-600" />
                <span>대상 지역</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {program.targetLocation.map((location, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {decodeHtmlEntities(location)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 키워드 */}
          {program.keywords.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-semibold text-gray-900">
                <Tag className="w-5 h-5 text-gray-600" />
                <span>키워드</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {program.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    #{decodeHtmlEntities(keyword)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* 메타 정보 */}
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span>프로그램 ID: {program.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span>소스 API ID: {program.sourceApiId}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                마지막 동기화:{' '}
                {format(new Date(program.lastSyncedAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
