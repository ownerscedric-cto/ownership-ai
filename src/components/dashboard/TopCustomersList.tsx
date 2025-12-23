/**
 * @file TopCustomersList.tsx
 * @description 활성 고객 목록 컴포넌트
 * Phase 6: 대시보드 UI
 */

'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ExternalLink, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardStats } from '@/lib/validations/analytics';

type TopCustomer = DashboardStats['topCustomers'][number];

interface TopCustomersListProps {
  customers: TopCustomer[] | undefined;
  isLoading?: boolean;
}

/**
 * 활성 고객 목록 컴포넌트
 */
export function TopCustomersList({ customers, isLoading }: TopCustomersListProps) {
  if (isLoading) {
    return <TopCustomersListSkeleton />;
  }

  if (!customers || customers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Users className="h-5 w-5 text-blue-500" />
            활성 고객
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-gray-500">
            진행중인 공고가 있는 고객이 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Users className="h-5 w-5 text-blue-500" />
          활성 고객
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {customers.map((customer, index) => (
            <Link
              key={customer.id}
              href={`/customers?selected=${customer.id}&tab=matching`}
              className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
            >
              {/* 순위 */}
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold',
                  index === 0 && 'bg-blue-100 text-blue-700',
                  index === 1 && 'bg-gray-200 text-gray-700',
                  index === 2 && 'bg-blue-50 text-blue-600',
                  index > 2 && 'bg-gray-100 text-gray-600'
                )}
              >
                {index + 1}
              </div>

              {/* 고객 정보 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#0052CC]">
                  {customer.name}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {customer.companyName && (
                    <>
                      <Building2 className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500 truncate">{customer.companyName}</span>
                    </>
                  )}
                </div>
              </div>

              {/* 진행중 공고 수 */}
              <div className="text-right">
                <span className="text-sm font-semibold text-[#0052CC]">{customer.matchCount}</span>
                <span className="text-xs text-gray-500 ml-1">건</span>
              </div>

              {/* 링크 아이콘 */}
              <ExternalLink className="h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 스켈레톤 로딩 상태
 */
export function TopCustomersListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
          <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3 p-2">
              <div className="h-7 w-7 animate-pulse rounded-full bg-gray-200" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="h-4 w-8 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
