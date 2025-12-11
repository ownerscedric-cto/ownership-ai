/**
 * @file ProgramDetail.tsx
 * @description 프로그램 상세 정보 컴포넌트
 * Phase 3: 정부지원사업 UI 컴포넌트
 */

'use client';

import { useRouter } from 'next/navigation';
import { formatDateKoreanShort, formatDateDot, formatDateTimeDot } from '@/lib/utils/date';
import {
  Calendar,
  MapPin,
  Tag,
  Building2,
  ExternalLink,
  ChevronLeft,
  DollarSign,
  Clock,
  Download,
  Database,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProgram } from '@/lib/hooks/usePrograms';
import { AlertCircle } from 'lucide-react';
import { DeadlineBadge } from './DeadlineBadge';
import { AddToWatchlistButton } from './AddToWatchlistButton';
import { decodeHtmlEntities, formatDescription } from '@/lib/utils/html';

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
  const router = useRouter();
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

  // 날짜 포맷팅 (KST 변환)
  const formattedDeadline = program.deadline ? formatDateKoreanShort(program.deadline) : null;

  const formattedRegisteredAt = formatDateKoreanShort(program.registeredAt);

  const formattedStartDate = program.startDate ? formatDateDot(program.startDate) : null;

  const formattedEndDate = program.endDate ? formatDateDot(program.endDate) : null;

  // 데이터 소스 이름 정규화 함수
  // KOCCA-PIMS, KOCCA-Finance → 한국콘텐츠진흥원
  const normalizeDataSource = (dataSource: string): string => {
    if (dataSource === 'KOCCA-PIMS' || dataSource === 'KOCCA-Finance') {
      return '한국콘텐츠진흥원';
    }
    return dataSource;
  };

  // 첨부파일 URL 배열 추출 함수
  const parseAttachmentUrls = (): string[] => {
    // rawData에서 flpthNm 추출 (기업마당만 해당)
    if (program.dataSource !== '기업마당') {
      return program.attachmentUrl ? [program.attachmentUrl] : [];
    }

    const rawData = program.rawData as Record<string, unknown>;
    const flpthNm = rawData.flpthNm;

    if (!flpthNm || typeof flpthNm !== 'string') {
      return [];
    }

    // @ 구분자로 여러 파일 분리
    return flpthNm
      .split('@')
      .map(url => url.trim())
      .filter(url => url.length > 0)
      .map(url => {
        // 프로토콜이 없으면 base URL 추가
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return url;
        }
        return `https://www.bizinfo.go.kr${url}`;
      });
  };

  const attachmentUrls = parseAttachmentUrls();

  // 전체 첨부파일 다운로드 핸들러
  const handleDownloadAll = () => {
    attachmentUrls.forEach((url, index) => {
      // 각 파일을 순차적으로 다운로드 (100ms 간격)
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();
      }, index * 100);
    });
  };

  return (
    <div className="space-y-6">
      {/* 뒤로 가기 버튼 */}
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.back()}>
        <ChevronLeft className="w-4 h-4 mr-1" />
        목록으로
      </Button>

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
              <DeadlineBadge deadline={program.deadline} rawData={program.rawData} />
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

          {/* 공고 바로가기 & 첨부파일 다운로드 & 관심 목록 추가 버튼 */}
          <div className="flex flex-wrap gap-3">
            {program.sourceUrl && (
              <a
                href={program.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button className="w-full sm:w-auto bg-[#0052CC] hover:bg-[#003d99] text-white font-semibold px-6 py-3 text-base">
                  <ExternalLink className="w-5 h-5 mr-2" />
                  공고 바로가기
                </Button>
              </a>
            )}

            {/* 관심 목록 추가 버튼 */}
            <AddToWatchlistButton programId={program.id} programTitle={program.title} />

            {/* 첨부파일 다운로드 버튼 (단일 파일) */}
            {attachmentUrls.length === 1 && (
              <a
                href={attachmentUrls[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC] hover:text-white font-semibold px-6 py-3 text-base"
                >
                  <Download className="w-5 h-5 mr-2" />
                  첨부파일 다운로드
                </Button>
              </a>
            )}

            {/* 첨부파일 다운로드 드롭다운 (다중 파일) */}
            {attachmentUrls.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC] hover:text-white font-semibold px-6 py-3 text-base"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    첨부파일 다운로드 ({attachmentUrls.length}개)
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuItem onClick={handleDownloadAll} className="cursor-pointer">
                    <Download className="w-4 h-4 mr-2" />
                    <span className="font-semibold">전체 다운로드 ({attachmentUrls.length}개)</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {attachmentUrls.map((url, index) => (
                    <DropdownMenuItem key={index} asChild>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer flex items-center"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        <span className="text-sm">첨부파일 {index + 1}</span>
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
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
              <span>마지막 동기화: {formatDateTimeDot(program.lastSyncedAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
