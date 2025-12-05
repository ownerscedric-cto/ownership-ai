'use client';

import type { Customer } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Target, Calendar, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface CustomerProgressPanelProps {
  customer: Customer | null;
  isLoading?: boolean;
}

export function CustomerProgressPanel({ customer, isLoading = false }: CustomerProgressPanelProps) {
  // 빈 상태
  if (!customer && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">고객을 선택하세요</p>
          <p className="text-gray-400 text-sm mt-1">
            왼쪽 목록에서 고객을 클릭하면 사업진행현황이 표시됩니다
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
    <div className="flex-1 bg-white flex flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="flex-shrink-0 bg-white border-b px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">사업진행현황</h1>
            <p className="text-sm text-gray-600 mt-1">{customer.name}</p>
          </div>

          {/* 진행 상태 요약 */}
          <div className="flex flex-col gap-2 lg:flex-row">
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              <TrendingUp className="h-3 w-3 mr-1" />
              진행중 0건
            </Badge>
            <Badge variant="outline" className="text-green-600 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              완료 0건
            </Badge>
          </div>
        </div>
      </div>

      {/* 상세 정보 */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* Phase 4 준비 안내 */}
        <section>
          <div className="border rounded-lg p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Phase 4에서 매칭 기능이 추가됩니다
                </h3>
                <p className="text-sm text-blue-700">
                  AI 기반 정부지원사업 매칭 기능이 구현되면 이곳에서 진행 중인 사업을 확인할 수
                  있습니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* 진행 중인 사업 (Phase 4 이후) */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5" />
            진행 중인 정부지원사업
          </h2>
          <div className="border rounded-lg p-8 text-center text-gray-400">
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm">아직 매칭된 사업이 없습니다</p>
            <p className="text-xs mt-1">Phase 4에서 AI 매칭 기능이 추가되면 자동으로 표시됩니다</p>
          </div>
        </section>

        <Separator />

        {/* 다가오는 마감일 (Phase 4 이후) */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            다가오는 마감일
          </h2>
          <div className="border rounded-lg p-8 text-center text-gray-400">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm">예정된 마감일이 없습니다</p>
          </div>
        </section>

        <Separator />

        {/* 최근 활동 (Phase 4 이후) */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            최근 활동
          </h2>
          <div className="border rounded-lg p-8 text-center text-gray-400">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm">최근 활동 기록이 없습니다</p>
          </div>
        </section>
      </div>
    </div>
  );
}
