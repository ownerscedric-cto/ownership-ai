/**
 * @file TopProgramsList.tsx
 * @description 인기 프로그램 목록 컴포넌트
 * Phase 6: 대시보드 UI
 */

'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardStats } from '@/lib/validations/analytics';

type TopProgram = DashboardStats['topPrograms'][number];

interface TopProgramsListProps {
  programs: TopProgram[] | undefined;
  isLoading?: boolean;
}

// 데이터소스별 색상
const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  'K-Startup': { bg: 'bg-blue-50', text: 'text-blue-700' },
  기업마당: { bg: 'bg-green-50', text: 'text-green-700' },
  'KOCCA-Finance': { bg: 'bg-amber-50', text: 'text-amber-700' },
  'KOCCA-PIMS': { bg: 'bg-purple-50', text: 'text-purple-700' },
};

const DEFAULT_SOURCE_COLOR = { bg: 'bg-gray-50', text: 'text-gray-700' };

/**
 * 인기 프로그램 목록 컴포넌트
 */
export function TopProgramsList({ programs, isLoading }: TopProgramsListProps) {
  if (isLoading) {
    return <TopProgramsListSkeleton />;
  }

  if (!programs || programs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Trophy className="h-5 w-5 text-amber-500" />
            인기 프로그램
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-gray-500">
            매칭된 프로그램이 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Trophy className="h-5 w-5 text-amber-500" />
          인기 프로그램
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {programs.map((program, index) => {
            const sourceColor = program.dataSource
              ? SOURCE_COLORS[program.dataSource] || DEFAULT_SOURCE_COLOR
              : DEFAULT_SOURCE_COLOR;

            return (
              <Link
                key={program.id}
                href={`/programs/${program.id}`}
                className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
              >
                {/* 순위 */}
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold',
                    index === 0 && 'bg-amber-100 text-amber-700',
                    index === 1 && 'bg-gray-200 text-gray-700',
                    index === 2 && 'bg-orange-100 text-orange-700',
                    index > 2 && 'bg-gray-100 text-gray-600'
                  )}
                >
                  {index + 1}
                </div>

                {/* 프로그램 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#0052CC]">
                    {program.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {program.dataSource && (
                      <Badge
                        variant="secondary"
                        className={cn('text-xs font-normal', sourceColor.bg, sourceColor.text)}
                      >
                        {program.dataSource}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500">매칭 {program.matchCount}회</span>
                  </div>
                </div>

                {/* 링크 아이콘 */}
                <ExternalLink className="h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
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
export function TopProgramsListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
          <div className="h-6 w-28 animate-pulse rounded bg-gray-200" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3 p-2">
              <div className="h-7 w-7 animate-pulse rounded-full bg-gray-200" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
