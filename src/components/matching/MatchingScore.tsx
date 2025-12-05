/**
 * @file MatchingScore.tsx
 * @description Matching score visualization component with progress bar
 * Phase 4: 업종/키워드/지역 기반 매칭 시스템 UI
 */

'use client';

import { cn } from '@/lib/utils';

interface MatchingScoreProps {
  score: number; // 0-100점
  className?: string;
  showLabel?: boolean; // 점수 숫자 표시 여부 (기본: true)
  size?: 'sm' | 'md' | 'lg'; // 프로그레스 바 크기
}

/**
 * Get score color classes based on score value
 * - 0-30점: 회색 (낮은 매칭)
 * - 30-60점: 노란색 (중간 매칭)
 * - 60-100점: 초록색 (높은 매칭)
 */
function getScoreColorClasses(score: number): {
  bg: string;
  text: string;
} {
  if (score < 30) {
    return { bg: 'bg-gray-400', text: 'text-gray-600' };
  }
  if (score < 60) {
    return { bg: 'bg-yellow-500', text: 'text-yellow-600' };
  }
  return { bg: 'bg-green-500', text: 'text-green-600' };
}

/**
 * Get score label based on score value
 */
function getScoreLabel(score: number): string {
  if (score < 30) return '낮음';
  if (score < 60) return '중간';
  return '높음';
}

/**
 * MatchingScore Component
 *
 * @example
 * <MatchingScore score={75} />
 * <MatchingScore score={45} showLabel={false} size="sm" />
 */
export function MatchingScore({
  score,
  className,
  showLabel = true,
  size = 'md',
}: MatchingScoreProps) {
  const { bg, text } = getScoreColorClasses(score);
  const label = getScoreLabel(score);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Custom Progress Bar */}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'relative w-full overflow-hidden rounded-full bg-gray-200',
            sizeClasses[size]
          )}
        >
          <div
            className={cn('h-full transition-all duration-300 ease-in-out', bg)}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
      </div>

      {/* Score Label */}
      {showLabel && (
        <div className="flex items-center gap-1.5 min-w-fit">
          <span className={cn('text-sm font-semibold', text)}>{Math.round(score)}점</span>
          <span className="text-xs text-gray-500">({label})</span>
        </div>
      )}
    </div>
  );
}
