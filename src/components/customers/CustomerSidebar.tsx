'use client';

import { useState } from 'react';
import type { Customer } from "@/lib/types/program";
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Search, Building2, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerSidebarProps {
  customers: Customer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onViewChange?: (customerId: string, view: 'detail' | 'progress' | 'matching') => void;
  isLoading?: boolean;
}

export function CustomerSidebar({
  customers,
  selectedId,
  onSelect,
  onViewChange,
  isLoading = false,
}: CustomerSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // 검색 필터링
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="w-full lg:w-80 border-r bg-gray-50 flex items-center justify-center h-full">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-80 border-r bg-gray-50 flex flex-col h-full">
      {/* 검색 바 */}
      <div className="p-4 border-b bg-white sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="고객 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">총 {filteredCustomers.length}명의 고객</p>
      </div>

      {/* 고객 목록 */}
      <div className="flex-1 overflow-y-auto">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-sm">검색 결과가 없습니다</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full" value={selectedId || undefined}>
            {filteredCustomers.map(customer => (
              <AccordionItem key={customer.id} value={customer.id} className="border-b-0">
                <div
                  className={cn('transition-colors', selectedId === customer.id && 'bg-blue-50')}
                >
                  <AccordionTrigger
                    className="px-4 py-3 hover:bg-gray-100 hover:no-underline"
                    onClick={() => onSelect(customer.id)}
                  >
                    <div className="flex items-center gap-2 text-left">
                      <Building2 className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{customer.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {customer.industry || '업종 미지정'}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-2">
                    <div className="space-y-1 pl-6">
                      {/* 기본 정보 버튼 */}
                      <button
                        className="w-full text-left text-sm hover:bg-gray-100 p-2 rounded flex items-center gap-2"
                        onClick={() => {
                          onSelect(customer.id);
                          onViewChange?.(customer.id, 'detail');
                        }}
                      >
                        <Building2 className="h-3 w-3" />
                        기본 정보
                      </button>

                      {/* 매칭 결과 버튼 */}
                      <button
                        className="w-full text-left text-sm hover:bg-gray-100 p-2 rounded flex items-center gap-2"
                        onClick={() => {
                          onSelect(customer.id);
                          onViewChange?.(customer.id, 'matching');
                        }}
                      >
                        <Target className="h-3 w-3" />
                        매칭 결과
                      </button>

                      {/* 사업진행현황 버튼 */}
                      <button
                        className="w-full text-left text-sm hover:bg-gray-100 p-2 rounded flex items-center gap-2"
                        onClick={() => {
                          onSelect(customer.id);
                          onViewChange?.(customer.id, 'progress');
                        }}
                      >
                        <TrendingUp className="h-3 w-3" />
                        사업진행현황
                      </button>
                    </div>
                  </AccordionContent>
                </div>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
