/**
 * @file QuickActions.tsx
 * @description 빠른 작업 버튼 컴포넌트
 * Phase 6: 대시보드 UI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Search, FileText, GraduationCap, Zap, Lock } from 'lucide-react';
import { useCanAccessEducation } from '@/hooks/useRoles';
import { UpgradeInquiryModal } from '@/components/common/UpgradeInquiryModal';

interface QuickAction {
  label: string;
  href: string;
  icon: typeof UserPlus;
  description: string;
  color: string;
  requiresEducation?: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: '고객 등록',
    href: '/customers?action=new',
    icon: UserPlus,
    description: '새 고객 등록하기',
    color: 'text-blue-600',
  },
  {
    label: '프로그램 검색',
    href: '/programs',
    icon: Search,
    description: '정부지원사업 찾기',
    color: 'text-green-600',
  },
  {
    label: '교육 콘텐츠',
    href: '/education',
    icon: GraduationCap,
    description: 'VOD 및 노하우',
    color: 'text-purple-600',
    requiresEducation: true,
  },
  {
    label: '커뮤니티',
    href: '/education/knowhow/posts',
    icon: Zap,
    description: '노하우 공유',
    color: 'text-amber-600',
    requiresEducation: true,
  },
];

/**
 * 빠른 작업 버튼 컴포넌트
 */
export function QuickActions() {
  const { hasPermission: canAccessEducation, isLoading } = useCanAccessEducation();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-gray-500" />
            빠른 작업
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {QUICK_ACTIONS.map(action => {
              const Icon = action.icon;
              const isLocked = action.requiresEducation && !isLoading && !canAccessEducation;

              // 교육 콘텐츠/커뮤니티가 잠긴 경우
              if (isLocked) {
                return (
                  <div key={action.href} className="relative group">
                    <Button
                      variant="outline"
                      className="h-auto w-full flex-col gap-2 py-4 opacity-60 cursor-pointer border-gray-200 bg-gray-50 hover:border-[#0052CC] hover:bg-blue-50 transition-all"
                      onClick={() => setUpgradeModalOpen(true)}
                    >
                      {/* 기본 상태 */}
                      <div className="flex flex-col items-center gap-2 group-hover:hidden">
                        <div className="relative">
                          <Icon className="h-6 w-6 text-gray-400" />
                          <Lock className="h-3 w-3 text-gray-500 absolute -bottom-1 -right-1" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">{action.label}</span>
                        <span className="text-xs text-gray-400 hidden sm:block text-center leading-tight">
                          프리미엄 등급 전환 후<br />
                          이용 가능
                        </span>
                      </div>
                      {/* 호버 상태 */}
                      <div className="hidden group-hover:flex flex-col items-center gap-2">
                        <Icon className={`h-6 w-6 ${action.color}`} />
                        <span className="text-sm font-medium text-[#0052CC]">프리미엄 등급</span>
                        <span className="text-xs text-[#0052CC] hidden sm:block">문의하기</span>
                      </div>
                    </Button>
                  </div>
                );
              }

              // 일반 활성화 상태
              return (
                <Link key={action.href} href={action.href}>
                  <Button
                    variant="outline"
                    className="h-auto w-full flex-col gap-2 py-4 hover:border-[#0052CC] hover:bg-blue-50"
                  >
                    <Icon className={`h-6 w-6 ${action.color}`} />
                    <span className="text-sm font-medium">{action.label}</span>
                    <span className="text-xs text-gray-500 hidden sm:block">
                      {action.description}
                    </span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 프리미엄 등급 문의 모달 */}
      <UpgradeInquiryModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
    </>
  );
}
