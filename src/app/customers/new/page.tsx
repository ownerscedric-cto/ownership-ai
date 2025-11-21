'use client';

import { useRouter } from 'next/navigation';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { useCreateCustomer } from '@/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { CreateCustomerInput } from '@/lib/validations/customer';
import { AppLayout } from '@/components/layout/AppLayout';

export default function NewCustomerPage() {
  const router = useRouter();
  const createCustomerMutation = useCreateCustomer();

  const handleSubmit = async (data: CreateCustomerInput) => {
    try {
      await createCustomerMutation.mutateAsync(data);
      // useCreateCustomer hook이 자동으로 상세 페이지로 리다이렉트함
    } catch (error) {
      alert(error instanceof Error ? error.message : '고객 등록에 실패했습니다');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/customers">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로 돌아가기
            </Button>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900">새 고객 등록</h1>
          <p className="text-gray-600 mt-2">새로운 고객의 정보를 입력하고 등록하세요</p>
        </div>

        {/* 폼 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <CustomerForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createCustomerMutation.isPending}
          />
        </div>
      </div>
    </AppLayout>
  );
}
