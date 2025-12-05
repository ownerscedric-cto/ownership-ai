/**
 * @file MatchingFilters.tsx
 * @description Filter component for matching results (minimum score, active only)
 * Phase 4: 업종/키워드/지역 기반 매칭 시스템 UI
 */

'use client';

import { Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface MatchingFiltersProps {
  minScore: number;
  onMinScoreChange: (score: number) => void;
  showActiveOnly: boolean;
  onShowActiveOnlyChange: (checked: boolean) => void;
  className?: string;
}

const MIN_SCORE_OPTIONS = [
  { value: 0, label: '전체 (0점 이상)' },
  { value: 30, label: '기본 (30점 이상)' },
  { value: 40, label: '중간 (40점 이상)' },
  { value: 50, label: '중간+ (50점 이상)' },
  { value: 60, label: '높음 (60점 이상)' },
  { value: 70, label: '높음+ (70점 이상)' },
  { value: 80, label: '매우 높음 (80점 이상)' },
];

/**
 * MatchingFilters Component
 *
 * @example
 * const [minScore, setMinScore] = useState(30);
 * const [showActiveOnly, setShowActiveOnly] = useState(true);
 * <MatchingFilters
 *   minScore={minScore}
 *   onMinScoreChange={setMinScore}
 *   showActiveOnly={showActiveOnly}
 *   onShowActiveOnlyChange={setShowActiveOnly}
 * />
 */
export function MatchingFilters({
  minScore,
  onMinScoreChange,
  showActiveOnly,
  onShowActiveOnlyChange,
  className,
}: MatchingFiltersProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center', className)}>
      {/* Filter Icon */}
      <Filter className="h-4 w-4 text-gray-500 flex-shrink-0 hidden sm:block" />

      {/* Minimum Score Filter */}
      <div className="flex items-center gap-3">
        <Label htmlFor="min-score" className="text-sm font-medium text-gray-700 min-w-fit">
          최소 점수
        </Label>
        <Select
          value={minScore.toString()}
          onValueChange={value => onMinScoreChange(Number(value))}
        >
          <SelectTrigger id="min-score" className="w-full sm:w-[200px]">
            <SelectValue placeholder="최소 점수 선택" />
          </SelectTrigger>
          <SelectContent>
            {MIN_SCORE_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Programs Only Checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="show-active-only"
          checked={showActiveOnly}
          onCheckedChange={onShowActiveOnlyChange}
        />
        <Label
          htmlFor="show-active-only"
          className="text-sm font-medium text-gray-700 cursor-pointer"
        >
          진행중인 공고만 보기
        </Label>
      </div>
    </div>
  );
}
