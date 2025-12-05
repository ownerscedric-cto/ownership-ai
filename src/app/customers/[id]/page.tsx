'use client';

import { use } from 'react';
import { CustomerDetail } from '@/components/customers/CustomerDetail';
import { useCustomer, useDeleteCustomer } from '@/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';

interface CustomerPageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerPage({ params }: CustomerPageProps) {
  const { id } = use(params);

  // 고객 정보 조회
  const { data: customer, isLoading, error } = useCustomer(id);
  const deleteCustomerMutation = useDeleteCustomer();

  const handleDelete = async () => {
    if (!confirm('정말 이 고객을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteCustomerMutation.mutateAsync(id);
      // useDeleteCustomer hook이 자동으로 목록 페이지로 리다이렉트함
    } catch (error) {
      alert(error instanceof Error ? error.message : '고객 삭제에 실패했습니다');
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !customer) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 text-lg font-semibold mb-2">
              ❌ 고객 정보를 불러올 수 없습니다
            </p>
            <p className="text-red-600 mb-4">
              {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'}
            </p>
            <Link href="/customers">
              <Button>목록으로 돌아가기</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/customers">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로 돌아가기
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">고객 상세 정보</h1>
              <p className="text-gray-600 mt-2">고객의 상세 정보를 확인하세요</p>
            </div>

            <div className="flex gap-3">
              <Link href={`/customers/${id}/edit`}>
                <Button variant="default">
                  <Edit className="h-4 w-4 mr-2" />
                  수정
                </Button>
              </Link>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteCustomerMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteCustomerMutation.isPending ? '삭제 중...' : '삭제'}
              </Button>
            </div>
          </div>
        </div>

        {/* 고객 상세 정보 */}
        <CustomerDetail customer={customer} />
      </div>
    </AppLayout>
  );
}
