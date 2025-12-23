/**
 * @file StatsCard.tsx
 * @description 대시보드 통계 카드 컴포넌트
 * Phase 6: 대시보드 UI
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  iconColor?: string;
  iconBgColor?: string;
}

/**
 * 통계 카드 컴포넌트
 *
 * @example
 * <StatsCard
 *   title="총 고객 수"
 *   value={125}
 *   description="활성 고객"
 *   icon={Users}
 *   trend={{ value: 12, label: "최근 7일" }}
 * />
 */
export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  iconColor = 'text-[#0052CC]',
  iconBgColor = 'bg-blue-50',
}: StatsCardProps) {
  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{formattedValue}</p>
            {description && <p className="text-sm text-gray-500">{description}</p>}
            {trend && (
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    'text-sm font-medium',
                    trend.value >= 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {trend.value >= 0 ? '+' : ''}
                  {trend.value}
                </span>
                <span className="text-sm text-gray-500">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn('rounded-lg p-3', iconBgColor)}>
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 스켈레톤 로딩 상태
 */
export function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </CardContent>
    </Card>
  );
}
