/**
 * @file ProgramsBySourceChart.tsx
 * @description 데이터소스별 프로그램 분포 차트
 * Phase 6: 대시보드 UI
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ProgramsBySourceData {
  dataSource: string;
  count: number;
}

interface ProgramsBySourceChartProps {
  data: ProgramsBySourceData[] | undefined;
  isLoading?: boolean;
}

// 데이터소스별 색상
const SOURCE_COLORS: Record<string, string> = {
  'K-Startup': '#0052CC',
  기업마당: '#10B981',
  'KOCCA-Finance': '#F59E0B',
  'KOCCA-PIMS': '#8B5CF6',
};

const DEFAULT_COLOR = '#6B7280';

/**
 * 데이터소스별 프로그램 분포 차트
 */
export function ProgramsBySourceChart({ data, isLoading }: ProgramsBySourceChartProps) {
  if (isLoading) {
    return <ProgramsBySourceChartSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">데이터소스별 프로그램</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[250px] items-center justify-center text-gray-500">
            데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  // 데이터 정렬 (많은 순)
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">데이터소스별 프로그램</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis
                dataKey="dataSource"
                type="category"
                tick={{ fontSize: 12 }}
                stroke="#9CA3AF"
                width={70}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}
                formatter={value => [`${Number(value).toLocaleString()}개`, '프로그램 수']}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {sortedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={SOURCE_COLORS[entry.dataSource] || DEFAULT_COLOR}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 스켈레톤 로딩 상태
 */
export function ProgramsBySourceChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full animate-pulse rounded bg-gray-100" />
      </CardContent>
    </Card>
  );
}
