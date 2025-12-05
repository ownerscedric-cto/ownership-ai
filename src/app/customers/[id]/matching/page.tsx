/**
 * @file /app/customers/[id]/matching/page.tsx
 * @description Customer matching results page
 * Phase 4: 업종/키워드/지역 기반 매칭 시스템 UI
 */

'use client';

import { use } from 'react';
import { useCustomer } from '@/hooks/useCustomers';
import { AppLayout } from '@/components/layout/AppLayout';
import { MatchButton } from '@/components/matching/MatchButton';
import { MatchingResults } from '@/components/matching/MatchingResults';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Target, Info } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MatchingPageProps {
  params: Promise<{ id: string }>;
}

/**
 * 고객별 매칭 결과 페이지
 */
export default function MatchingPage({ params }: MatchingPageProps) {
  const { id } = use(params);

  // 고객 정보 조회
  const { data: customer, isLoading, error } = useCustomer(id);

  // Loading State
  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-12 w-full mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Error State
  if (error || !customer) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="destructive">
            <AlertTitle>오류 발생</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : '고객 정보를 불러올 수 없습니다.'}
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <Link href="/customers">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                고객 목록으로 돌아가기
              </Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/customers/${id}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              고객 정보로 돌아가기
            </Button>
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Target className="h-8 w-8 text-[#0052CC]" />
                매칭 결과
              </h1>
              <p className="mt-2 text-gray-600">
                <span className="font-semibold">{customer.name}</span>님에게 적합한 정부지원사업
                프로그램
              </p>
            </div>
            {/* Match Button */}
            <MatchButton customerId={id} />
          </div>
        </div>

        {/* Customer Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">고객 정보</CardTitle>
            <CardDescription>매칭에 사용된 고객 정보입니다</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {customer.industry && (
                <div>
                  <span className="text-gray-500">업종:</span>
                  <span className="ml-2 font-medium">{customer.industry}</span>
                </div>
              )}
              {customer.location && (
                <div>
                  <span className="text-gray-500">지역:</span>
                  <span className="ml-2 font-medium">{customer.location}</span>
                </div>
              )}
              {customer.companySize && (
                <div>
                  <span className="text-gray-500">기업 규모:</span>
                  <span className="ml-2 font-medium">{customer.companySize}</span>
                </div>
              )}
              {customer.challenges && customer.challenges.length > 0 && (
                <div className="col-span-full">
                  <span className="text-gray-500">해결 과제:</span>
                  <span className="ml-2 font-medium">{customer.challenges.join(', ')}</span>
                </div>
              )}
              {customer.goals && customer.goals.length > 0 && (
                <div className="col-span-full">
                  <span className="text-gray-500">목표:</span>
                  <span className="ml-2 font-medium">{customer.goals.join(', ')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>매칭 점수 안내</AlertTitle>
          <AlertDescription>
            매칭 점수는 <strong>업종 (30점)</strong> + <strong>지역 (30점)</strong> +{' '}
            <strong>키워드 (최대 40점)</strong>로 계산됩니다.
            <br />
            최소 30점 이상의 프로그램만 표시됩니다.
          </AlertDescription>
        </Alert>

        {/* Matching Results */}
        <MatchingResults customerId={id} />
      </div>
    </AppLayout>
  );
}
