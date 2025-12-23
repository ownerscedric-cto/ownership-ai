'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Users, FileText, Zap, Calendar } from 'lucide-react';
import { useDashboardData } from '@/lib/hooks/useAnalytics';
import {
  StatsCard,
  StatsCardSkeleton,
  TrendChart,
  ProgramsBySourceChart,
  RecentActivity,
  TopProgramsList,
  TopCustomersList,
  QuickActions,
  ReportGeneratorCard,
} from '@/components/dashboard';

export default function DashboardPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const supabase = createClient();

  // 대시보드 통계 및 트렌드 데이터 조회
  const { stats, trends, isLoading } = useDashboardData({
    period: 'weekly',
    days: 30,
  });

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
  }, [supabase]);

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || '사용자';

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">환영합니다, {userName}님!</h2>
          <p className="text-gray-600">
            대시보드에서 고객 정보를 관리하고 정부지원사업을 추천받으세요.
          </p>
        </div>

        {/* 통계 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {isLoading ? (
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </>
          ) : (
            <>
              <StatsCard
                title="총 고객 수"
                value={stats?.totalCustomers || 0}
                icon={Users}
                trend={
                  stats?.recentCustomers
                    ? { value: stats.recentCustomers, label: '최근 7일' }
                    : undefined
                }
                iconColor="text-blue-600"
                iconBgColor="bg-blue-50"
              />
              <StatsCard
                title="총 프로그램"
                value={stats?.totalPrograms || 0}
                description={`진행중 ${stats?.activePrograms || 0}개`}
                icon={FileText}
                trend={
                  stats?.recentPrograms
                    ? { value: stats.recentPrograms, label: '최근 7일' }
                    : undefined
                }
                iconColor="text-green-600"
                iconBgColor="bg-green-50"
              />
              <StatsCard
                title="총 매칭"
                value={stats?.totalMatchings || 0}
                icon={Zap}
                trend={
                  stats?.recentMatchings
                    ? { value: stats.recentMatchings, label: '최근 7일' }
                    : undefined
                }
                iconColor="text-amber-600"
                iconBgColor="bg-amber-50"
              />
              <StatsCard
                title="진행중 프로그램"
                value={stats?.activePrograms || 0}
                description="마감 전"
                icon={Calendar}
                iconColor="text-purple-600"
                iconBgColor="bg-purple-50"
              />
            </>
          )}
        </div>

        {/* 빠른 작업 & 리포트 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <QuickActions />
          </div>
          <ReportGeneratorCard />
        </div>

        {/* 차트 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TrendChart data={trends} isLoading={isLoading} />
          <ProgramsBySourceChart data={stats?.programsBySource} isLoading={isLoading} />
        </div>

        {/* 하단 그리드: 인기 프로그램, 활성 고객, 최근 활동 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TopProgramsList programs={stats?.topPrograms} isLoading={isLoading} />
          <TopCustomersList customers={stats?.topCustomers} isLoading={isLoading} />
          <RecentActivity activities={stats?.recentActivity} isLoading={isLoading} />
        </div>
      </div>
    </AppLayout>
  );
}
