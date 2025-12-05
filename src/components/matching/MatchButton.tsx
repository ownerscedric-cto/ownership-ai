/**
 * @file MatchButton.tsx
 * @description Button component to trigger matching algorithm
 * Phase 4: 업종/키워드/지역 기반 매칭 시스템 UI
 */

'use client';

import { Target, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRunMatching } from '@/lib/hooks/useMatching';
import { MATCHING_CONFIG } from '@/lib/types/matching';
import { cn } from '@/lib/utils';

interface MatchButtonProps {
  customerId: string;
  minScore?: number;
  maxResults?: number;
  forceRefresh?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  fullWidth?: boolean;
}

/**
 * MatchButton Component
 *
 * 매칭 개수 변경: src/lib/types/matching.ts의 MATCHING_CONFIG.MAX_RESULTS 수정
 *
 * @example
 * <MatchButton customerId="customer-id-123" />
 * <MatchButton customerId="customer-id-123" forceRefresh={true} />
 */
export function MatchButton({
  customerId,
  minScore = MATCHING_CONFIG.MIN_SCORE,
  maxResults = MATCHING_CONFIG.MAX_RESULTS,
  forceRefresh = true,
  className,
  variant = 'default',
  size = 'default',
  fullWidth = false,
}: MatchButtonProps) {
  const runMatching = useRunMatching();

  const handleMatch = () => {
    runMatching.mutate({
      customerId,
      minScore,
      maxResults,
      forceRefresh,
    });
  };

  const isLoading = runMatching.isPending;

  return (
    <div className={cn(fullWidth && 'w-full', className)}>
      <Button
        onClick={handleMatch}
        disabled={isLoading}
        variant={variant}
        size={size}
        className={cn('bg-[#0052CC] hover:bg-[#0052CC]/90 text-white', fullWidth && 'w-full')}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            매칭 중...
          </>
        ) : (
          <>
            <Target className="mr-2 h-4 w-4" />
            매칭 실행
          </>
        )}
      </Button>

      {/* Error Message */}
      {runMatching.isError && (
        <p className="mt-2 text-sm text-red-600">
          {runMatching.error?.message || '매칭 실행에 실패했습니다.'}
        </p>
      )}

      {/* Success Message */}
      {runMatching.isSuccess && !isLoading && (
        <p className="mt-2 text-sm text-green-600">✓ 매칭이 완료되었습니다.</p>
      )}
    </div>
  );
}
