/**
 * @file RecentActivity.tsx
 * @description 최근 활동 내역 컴포넌트
 * Phase 6: 대시보드 UI
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Zap, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardStats } from '@/lib/validations/analytics';

type ActivityItem = DashboardStats['recentActivity'][number];

interface RecentActivityProps {
  activities: ActivityItem[] | undefined;
  isLoading?: boolean;
}

// 활동 타입별 아이콘 및 색상
const ACTIVITY_CONFIG: Record<
  ActivityItem['type'],
  { icon: typeof Users; color: string; bgColor: string }
> = {
  customer: {
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  matching: {
    icon: Zap,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  program: {
    icon: FileText,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
};

/**
 * 상대 시간 포맷팅
 */
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * 최근 활동 내역 컴포넌트
 */
export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return <RecentActivitySkeleton />;
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">최근 활동</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-gray-500">
            최근 활동이 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">최근 활동</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const config = ACTIVITY_CONFIG[activity.type];
            const Icon = config.icon;

            return (
              <div key={`${activity.type}-${index}`} className="flex items-start gap-3">
                <div className={cn('rounded-lg p-2', config.bgColor)}>
                  <Icon className={cn('h-4 w-4', config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatRelativeTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 스켈레톤 로딩 상태
 */
export function RecentActivitySkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
