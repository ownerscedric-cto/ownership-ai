'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Customer } from '@prisma/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Star, Sparkles } from 'lucide-react';
import { CustomerWatchlist } from './CustomerWatchlist';
import { MatchButton } from '@/components/matching/MatchButton';
import { MatchingResults } from '@/components/matching/MatchingResults';

interface CustomerMatchingPanelProps {
  customer: Customer | null;
  isLoading?: boolean;
  defaultSubtab?: 'ai-matching' | 'watchlist';
}

export function CustomerMatchingPanel({
  customer,
  isLoading = false,
  defaultSubtab = 'ai-matching',
}: CustomerMatchingPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeSubtab, setActiveSubtab] = useState<'ai-matching' | 'watchlist'>(defaultSubtab);

  // URL 파라미터와 동기화
  useEffect(() => {
    setActiveSubtab(defaultSubtab);
  }, [defaultSubtab]);

  // 서브탭 변경 시 URL 업데이트
  const handleSubtabChange = (value: string) => {
    const newSubtab = value as 'ai-matching' | 'watchlist';
    setActiveSubtab(newSubtab);

    // URL 업데이트
    const selected = searchParams.get('selected');
    const tab = searchParams.get('tab');
    if (selected && tab) {
      router.push(`/customers?selected=${selected}&tab=${tab}&subtab=${newSubtab}`, {
        scroll: false,
      });
    }
  };
  // 빈 상태
  if (!customer && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">고객을 선택하세요</p>
          <p className="text-gray-400 text-sm mt-1">
            왼쪽 목록에서 고객을 클릭하면 매칭 결과가 표시됩니다
          </p>
        </div>
      </div>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  // customer가 없는 경우 (에러)
  if (!customer) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <p className="text-red-500">고객 정보를 불러올 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white overflow-y-auto">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">매칭 결과</h1>
            <p className="text-sm text-gray-600 mt-1">{customer.name}</p>
          </div>

          <div className="flex gap-2">
            <MatchButton customerId={customer.id} />
          </div>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="px-8 py-6">
        <Tabs value={activeSubtab} onValueChange={handleSubtabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai-matching" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI 매칭
            </TabsTrigger>
            <TabsTrigger value="watchlist" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              관심목록
            </TabsTrigger>
          </TabsList>

          {/* AI 매칭 탭 */}
          <TabsContent value="ai-matching" className="mt-6">
            <MatchingResults customerId={customer.id} />
          </TabsContent>

          {/* 관심목록 탭 */}
          <TabsContent value="watchlist" className="mt-6">
            <CustomerWatchlist customerId={customer.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
