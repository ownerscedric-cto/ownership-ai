/**
 * @file TrendChart.tsx
 * @description 시계열 트렌드 차트 컴포넌트
 * Phase 6: 대시보드 UI
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { TrendData } from '@/lib/validations/analytics';

interface TrendChartProps {
  data: TrendData | undefined;
  isLoading?: boolean;
}

/**
 * 트렌드 차트 컴포넌트
 *
 * @example
 * <TrendChart data={trendData} />
 */
export function TrendChart({ data, isLoading }: TrendChartProps) {
  if (isLoading) {
    return <TrendChartSkeleton />;
  }

  if (!data || data.data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">활동 트렌드</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-gray-500">
            데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (data.period === 'daily') {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    } else if (data.period === 'weekly') {
      return `${date.getMonth() + 1}/${date.getDate()}주`;
    } else {
      return `${date.getMonth() + 1}월`;
    }
  };

  const chartData = data.data.map(item => ({
    ...item,
    dateLabel: formatDate(item.date),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">활동 트렌드</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}
                formatter={(value, name) => {
                  const labels: Record<string, string> = {
                    customers: '신규 고객',
                    matchings: '매칭',
                    programs: '신규 프로그램',
                  };
                  return [value, labels[name as string] || name];
                }}
              />
              <Legend
                formatter={(value: string) => {
                  const labels: Record<string, string> = {
                    customers: '신규 고객',
                    matchings: '매칭',
                    programs: '신규 프로그램',
                  };
                  return labels[value] || value;
                }}
              />
              <Line
                type="monotone"
                dataKey="customers"
                stroke="#0052CC"
                strokeWidth={2}
                dot={{ fill: '#0052CC', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="matchings"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="programs"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ fill: '#F59E0B', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 스켈레톤 로딩 상태
 */
export function TrendChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full animate-pulse rounded bg-gray-100" />
      </CardContent>
    </Card>
  );
}
