/**
 * @file MatchingDetails.tsx
 * @description Matching details component showing industry/location/keyword matches
 * Phase 4: 업종/키워드/지역 기반 매칭 시스템 UI
 */

'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MatchingDetailsProps {
  matchedIndustry: boolean;
  matchedLocation: boolean;
  matchedKeywords: string[];
  className?: string;
  compact?: boolean; // 컴팩트 모드 (작은 화면용)
}

/**
 * MatchingDetails Component
 *
 * @example
 * <MatchingDetails
 *   matchedIndustry={true}
 *   matchedLocation={false}
 *   matchedKeywords={['R&D', '정부지원']}
 * />
 */
export function MatchingDetails({
  matchedIndustry,
  matchedLocation,
  matchedKeywords,
  className,
  compact = false,
}: MatchingDetailsProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Industry Match */}
      <div className="flex items-center gap-2">
        {matchedIndustry ? (
          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
        ) : (
          <XCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
        )}
        <span
          className={cn(
            'text-sm',
            matchedIndustry ? 'text-green-600 font-medium' : 'text-gray-500'
          )}
        >
          업종 {matchedIndustry ? '일치' : '불일치'}
        </span>
      </div>

      {/* Location Match */}
      <div className="flex items-center gap-2">
        {matchedLocation ? (
          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
        ) : (
          <XCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
        )}
        <span
          className={cn(
            'text-sm',
            matchedLocation ? 'text-green-600 font-medium' : 'text-gray-500'
          )}
        >
          지역 {matchedLocation ? '일치' : '불일치'}
        </span>
      </div>

      {/* Keyword Matches */}
      {matchedKeywords.length > 0 && (
        <div className={cn('flex items-start gap-2', compact && 'flex-col')}>
          <div className="flex items-center gap-2 min-w-fit">
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-sm text-green-600 font-medium">키워드</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {matchedKeywords.map((keyword, index) => (
              <Badge
                key={`${keyword}-${index}`}
                variant="secondary"
                className="text-xs bg-green-50 text-green-700 border-green-200"
              >
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* No Keyword Matches */}
      {matchedKeywords.length === 0 && (
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-500">키워드 불일치</span>
        </div>
      )}
    </div>
  );
}
