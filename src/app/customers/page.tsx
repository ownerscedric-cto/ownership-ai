'use client';

import { useState } from 'react';
import { CustomerList } from '@/components/customers/CustomerList';
import { CustomerCard } from '@/components/customers/CustomerCard';
import { CustomerFilters } from '@/components/customers/CustomerFilters';
import { Button } from '@/components/ui/button';
import { useCustomers, useDeleteCustomer } from '@/hooks/useCustomers';
import { Plus, Grid, List } from 'lucide-react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';

export default function CustomersPage() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filters, setFilters] = useState<{
    search?: string;
    industry?: string;
    location?: string;
  }>({});

  // 고객 목록 조회
  const { data, isLoading, error } = useCustomers(filters);
  const deleteCustomerMutation = useDeleteCustomer();

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 고객을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteCustomerMutation.mutateAsync(id);
    } catch {
      alert('고객 삭제에 실패했습니다');
    }
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">고객 관리</h1>
              <p className="text-gray-600 mt-2">
                총 {data?.metadata.total || 0}명의 고객이 등록되어 있습니다
              </p>
            </div>

            <div className="flex gap-3">
              {/* 보기 모드 전환 */}
              <div className="flex gap-1 bg-white rounded-lg border p-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>

              {/* 고객 추가 버튼 */}
              <Link href="/customers/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  고객 추가
                </Button>
              </Link>
            </div>
          </div>

          {/* 필터 */}
          <CustomerFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </div>

        {/* 에러 표시 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">
              ❌ {error instanceof Error ? error.message : '고객 목록을 불러오는데 실패했습니다'}
            </p>
          </div>
        )}

        {/* 고객 목록 */}
        {viewMode === 'list' ? (
          <CustomerList
            customers={data?.customers || []}
            isLoading={isLoading}
            onDelete={handleDelete}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
                ))}
              </>
            ) : data?.customers && data.customers.length > 0 ? (
              data.customers.map(customer => (
                <CustomerCard key={customer.id} customer={customer} onDelete={handleDelete} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">등록된 고객이 없습니다.</p>
                <Link href="/customers/new" className="mt-4 inline-block">
                  <Button>첫 고객 등록하기</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
