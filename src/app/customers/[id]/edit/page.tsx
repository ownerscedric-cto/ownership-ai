'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { useCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { CreateCustomerInput } from '@/lib/validations/customer';
import { AppLayout } from '@/components/layout/AppLayout';

interface EditCustomerPageProps {
  params: Promise<{ id: string }>;
}

export default function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = use(params);
  const router = useRouter();

  // 고객 정보 조회
  const { data: customer, isLoading, error } = useCustomer(id);
  const updateCustomerMutation = useUpdateCustomer(id);

  const handleSubmit = async (data: CreateCustomerInput) => {
    try {
      await updateCustomerMutation.mutateAsync(data);
      // 수정 완료 후 상세 페이지로 이동
      router.push(`/customers/${id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : '고객 수정에 실패했습니다');
    }
  };

  const handleCancel = () => {
    router.push(`/customers/${id}`);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !customer) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href={`/customers/${id}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              상세 페이지로 돌아가기
            </Button>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900">고객 정보 수정</h1>
          <p className="text-gray-600 mt-2">{customer.name}의 정보를 수정하세요</p>
        </div>

        {/* 폼 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <CustomerForm
            customer={customer}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={updateCustomerMutation.isPending}
          />
        </div>
      </div>
    </AppLayout>
  );
}
