'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Users, FileText, Target } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function DashboardPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const supabase = createClient();

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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            환영합니다, {userName}님!
          </h2>
          <p className="text-[var(--text-secondary)]">
            대시보드에서 고객 정보를 관리하고 정부지원사업을 추천받으세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 고객 관리 카드 */}
          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-[var(--primary-blue)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">고객 관리</h3>
            </div>
            <p className="text-[var(--text-secondary)] mb-4">고객 정보를 등록하고 관리하세요</p>
            <Link href="/customers">
              <Button variant="primary" className="w-full">
                고객 관리 바로가기
              </Button>
            </Link>
          </Card>

          {/* 정부지원사업 카드 */}
          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">정부지원사업</h3>
            </div>
            <p className="text-[var(--text-secondary)] mb-4">
              고객에게 맞는 정부지원사업을 추천받으세요
            </p>
            <Button variant="outline" disabled className="w-full">
              준비 중
            </Button>
          </Card>

          {/* 매칭 현황 카드 */}
          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">매칭 현황</h3>
            </div>
            <p className="text-[var(--text-secondary)] mb-4">
              추천된 사업과 매칭 현황을 확인하세요
            </p>
            <Button variant="outline" disabled className="w-full">
              준비 중
            </Button>
          </Card>
        </div>

        {user && (
          <div className="mt-8">
            <Card>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">계정 정보</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">이메일:</span>
                  <span className="text-[var(--text-primary)] font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">이름:</span>
                  <span className="text-[var(--text-primary)] font-medium">{userName}</span>
                </div>
                {user.user_metadata?.company_name && (
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">회사명:</span>
                    <span className="text-[var(--text-primary)] font-medium">
                      {user.user_metadata.company_name}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
