/**
 * @file DeadlineBadge.tsx
 * @description 프로그램 마감일 D-day 배지 컴포넌트
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { differenceInDays, isPast, isToday, format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface DeadlineBadgeProps {
  deadline: Date | string | null;
  className?: string;
}

export function DeadlineBadge({ deadline, className }: DeadlineBadgeProps) {
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
