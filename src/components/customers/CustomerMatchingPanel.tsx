'use client';

import type { Customer } from '@prisma/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Target, Star, Sparkles, AlertCircle } from 'lucide-react';
import { CustomerWatchlist } from './CustomerWatchlist';

interface CustomerMatchingPanelProps {
  customer: Customer | null;
  isLoading?: boolean;
}

export function CustomerMatchingPanel({ customer, isLoading = false }: CustomerMatchingPanelProps) {
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
            <Badge variant="outline" className="text-purple-600 border-purple-200">
              <Sparkles className="h-3 w-3 mr-1" />
              AI 매칭 준비중
            </Badge>
          </div>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="px-8 py-6">
        <Tabs defaultValue="watchlist" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai-matching" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI 매칭 (준비중)
            </TabsTrigger>
            <TabsTrigger value="watchlist" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              관심목록
            </TabsTrigger>
          </TabsList>

          {/* AI 매칭 탭 (Phase 4 이후) */}
          <TabsContent value="ai-matching" className="mt-6">
            <div className="border rounded-lg p-6 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">
                    Phase 4에서 AI 매칭 기능이 추가됩니다
                  </h3>
                  <p className="text-sm text-blue-700">
                    고객 정보를 기반으로 AI가 자동으로 적합한 정부지원사업을 추천해드립니다.
                  </p>
                </div>
              </div>
            </div>

            {/* AI 매칭 결과 placeholder */}
            <div className="mt-6 border rounded-lg p-8 text-center text-gray-400">
              <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm">아직 AI 매칭 결과가 없습니다</p>
              <p className="text-xs mt-1">
                Phase 4에서 AI 매칭 기능이 추가되면 자동으로 표시됩니다
              </p>
            </div>
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
