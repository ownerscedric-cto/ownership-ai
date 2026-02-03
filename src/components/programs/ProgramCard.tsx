/**
 * @file ProgramCard.tsx
 * @description 프로그램 카드 컴포넌트
 * Phase 3: 정부지원사업 UI 컴포넌트
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Tag, Building2, Star, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeadlineBadge } from './DeadlineBadge';
import { CustomerSelectDialog } from './CustomerSelectDialog';
import { useAddToWatchlist } from '@/lib/hooks/useWatchlist';
import type { Program } from '@/lib/types/program';
import type { Customer } from '@/lib/types/customer';
import { decodeHtmlEntities, truncateText } from '@/lib/utils/html';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProgramCardProps {
  program: Program;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

/**
 * 데이터 소스 이름 정규화 함수
 * KOCCA-PIMS, KOCCA-Finance → 한국콘텐츠진흥원
 */
const normalizeDataSource = (dataSource: string): string => {
  if (dataSource === 'KOCCA-PIMS' || dataSource === 'KOCCA-Finance') {
    return '한국콘텐츠진흥원';
  }
  return dataSource;
};

/**
 * 데이터 소스별 Badge 색상 매핑
 */
const dataSourceColors: Record<string, string> = {
  기업마당: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  'K-Startup': 'bg-green-100 text-green-800 hover:bg-green-200',
  한국콘텐츠진흥원: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  서울테크노파크: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  경기테크노파크: 'bg-pink-100 text-pink-800 hover:bg-pink-200',
};

/**
 * 프로그램 카드 컴포넌트
 *
 * 프로그램 정보를 카드 형태로 표시
 * - 제목, 설명
 * - 데이터 소스 (Badge)
 * - 카테고리
 * - 마감일
 * - 대상 업종 (최대 3개)
 * - 대상 지역 (최대 3개)
 */
export function ProgramCard({ program, isSelected = false, onToggleSelect }: ProgramCardProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const addToWatchlist = useAddToWatchlist();

  // 체크박스 클릭 핸들러
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Card 클릭 이벤트 전파 방지
    onToggleSelect?.();
  };

  // 설명 최대 길이 제한 (모바일에서 너무 길지 않도록)
  const truncatedDescription = program.description ? truncateText(program.description, 150) : null;

  // 대상 업종/지역 최대 3개만 표시
  const displayedAudiences = program.targetAudience.slice(0, 3);
  const remainingAudiencesCount = Math.max(0, program.targetAudience.length - 3);

  const displayedLocations = program.targetLocation.slice(0, 3);
  const remainingLocationsCount = Math.max(0, program.targetLocation.length - 3);

  // Card 클릭 핸들러
  const handleCardClick = () => {
    router.push(`/programs/${program.id}`);
  };

  // 별표 버튼 클릭 핸들러
  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Card 클릭 이벤트 전파 방지
    setIsDialogOpen(true);
  };

  // 고객 선택 핸들러
  const handleCustomerSelect = async (customer: Customer) => {
    try {
      await addToWatchlist.mutateAsync({
        customerId: customer.id,
        programId: program.id,
      });
      toast.success(`${customer.name} 고객의 관심 목록에 추가되었습니다`);
    } catch (error) {
      toast.error('관심 목록 추가에 실패했습니다');
      console.error('Failed to add to watchlist:', error);
    }
  };

  return (
    <>
      <Card
        onClick={handleCardClick}
        className={cn(
          'h-full transition-all duration-200 hover:shadow-md cursor-pointer relative',
          isSelected
            ? 'border-[#0052CC] border-2 bg-blue-50/30 shadow-md'
            : 'hover:border-[#0052CC]/50'
        )}
      >
        <CardHeader className="space-y-2">
          {/* 체크박스 + 데이터 소스 Badge + 마감일 Badge */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {/* 선택 체크박스 */}
              <button
                type="button"
                onClick={handleCheckboxClick}
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0',
                  isSelected
                    ? 'bg-[#0052CC] border-[#0052CC] text-white'
                    : 'border-gray-300 hover:border-[#0052CC] bg-white'
                )}
                title={isSelected ? '선택 해제' : '선택'}
              >
                {isSelected && <Check className="w-3 h-3" />}
              </button>
              <Badge
                className={
                  dataSourceColors[normalizeDataSource(program.dataSource)] ||
                  'bg-gray-100 text-gray-800'
                }
              >
                {normalizeDataSource(program.dataSource)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <DeadlineBadge deadline={program.deadline} rawData={program.rawData} />
              {/* 별표 버튼 */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleStarClick}
                className="h-8 w-8 p-0 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                title="관심 목록에 추가"
              >
                <Star className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 제목 */}
          <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
            {decodeHtmlEntities(program.title)}
          </CardTitle>

          {/* 카테고리 */}
          {program.category && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Tag className="w-4 h-4" />
              <span>{program.category}</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {/* 설명 (최대 150자) */}
          {truncatedDescription && (
            <CardDescription className="text-sm text-gray-600 line-clamp-2">
              {truncatedDescription}
            </CardDescription>
          )}

          {/* 대상 업종 */}
          {displayedAudiences.length > 0 && (
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="flex flex-wrap gap-1">
                {displayedAudiences.map((audience, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {decodeHtmlEntities(audience)}
                  </Badge>
                ))}
                {remainingAudiencesCount > 0 && (
                  <Badge variant="outline" className="text-xs text-gray-500">
                    +{remainingAudiencesCount}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* 대상 지역 */}
          {displayedLocations.length > 0 && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="flex flex-wrap gap-1">
                {displayedLocations.map((location, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {decodeHtmlEntities(location)}
                  </Badge>
                ))}
                {remainingLocationsCount > 0 && (
                  <Badge variant="outline" className="text-xs text-gray-500">
                    +{remainingLocationsCount}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 고객 선택 다이얼로그 */}
      <CustomerSelectDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSelect={handleCustomerSelect}
        programId={program.id}
      />
    </>
  );
}
