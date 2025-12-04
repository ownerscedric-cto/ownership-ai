/**
 * @file DeadlineBadge.tsx
 * @description 프로그램 마감일 D-day 배지 컴포넌트
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Infinity } from 'lucide-react';
import { differenceInDays, isPast, isToday, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Prisma } from '@prisma/client';

interface DeadlineBadgeProps {
  deadline: Date | string | null;
  rawData?: Prisma.JsonValue;
  className?: string;
}

export function DeadlineBadge({ deadline, rawData, className }: DeadlineBadgeProps) {
  // deadline이 null이고 rawData가 있으면 특수 케이스 확인
  if (!deadline && rawData) {
    const data = rawData as Record<string, unknown>;
    const reqstBeginEndDe = data.reqstBeginEndDe;

    if (reqstBeginEndDe && typeof reqstBeginEndDe === 'string') {
      const text = reqstBeginEndDe.toLowerCase();

      // 예산 소진시
      if (text.includes('예산') && text.includes('소진')) {
        return (
          <Badge
            variant="outline"
            className={`flex items-center gap-1 bg-orange-50 text-orange-700 border-orange-300 ${className || ''}`}
          >
            <Clock className="w-3 h-3" />
            <span>예산 소진시</span>
          </Badge>
        );
      }

      // 상시 접수
      if (text.includes('상시')) {
        return (
          <Badge
            variant="outline"
            className={`flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-300 ${className || ''}`}
          >
            <Infinity className="w-3 h-3" />
            <span>상시 모집</span>
          </Badge>
        );
      }

      // 수시 모집
      if (text.includes('수시')) {
        return (
          <Badge
            variant="outline"
            className={`flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-300 ${className || ''}`}
          >
            <Infinity className="w-3 h-3" />
            <span>수시 모집</span>
          </Badge>
        );
      }

      // 기타 (세부사업별 상이 등)
      return (
        <Badge
          variant="outline"
          className={`flex items-center gap-1 bg-gray-100 text-gray-700 border-gray-300 ${className || ''}`}
        >
          <Calendar className="w-3 h-3" />
          <span className="text-xs">{reqstBeginEndDe}</span>
        </Badge>
      );
    }
  }

  if (!deadline) {
    return null;
  }

  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);

  const daysLeft = differenceInDays(deadlineDate, today);
  const isExpired = isPast(deadlineDate) && !isToday(deadlineDate);

  // 상태별 색상 및 텍스트
  let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  let badgeColor = '';
  let badgeText = '';

  if (isExpired) {
    // 마감 (과거)
    badgeVariant = 'secondary';
    badgeText = '마감';
  } else if (isToday(deadlineDate)) {
    // D-day (오늘)
    badgeVariant = 'destructive';
    badgeText = 'D-day';
  } else if (daysLeft <= 7) {
    // 긴급 (D-7 이하)
    badgeVariant = 'destructive';
    badgeText = `D-${daysLeft}`;
  } else if (daysLeft <= 30) {
    // 주의 (D-30 이하)
    badgeColor = 'bg-yellow-100 text-yellow-800 border-yellow-300';
    badgeText = `D-${daysLeft}`;
  } else {
    // 여유 (D-30 초과)
    badgeColor = 'bg-green-100 text-green-800 border-green-300';
    badgeText = `D-${daysLeft}`;
  }

  return (
    <Badge
      variant={badgeColor ? 'outline' : badgeVariant}
      className={`flex items-center gap-1 ${badgeColor} ${className || ''}`}
    >
      <Calendar className="w-3 h-3" />
      <span>{badgeText}</span>
      <span className="text-xs opacity-75">
        ({format(deadlineDate, 'yy.MM.dd', { locale: ko })})
      </span>
    </Badge>
  );
}
