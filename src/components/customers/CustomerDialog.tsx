'use client';

import { useEffect } from 'react';
import type { Customer } from "@/lib/types/program";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CustomerForm } from './CustomerForm';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import type { CreateCustomerInput } from '@/lib/validations/customer';

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null; // null/undefined: 등록 모드, Customer: 수정 모드
  onSuccess?: () => void; // 성공 시 콜백 (선택적)
}

export function CustomerDialog({ open, onOpenChange, customer, onSuccess }: CustomerDialogProps) {
  const isEditMode = !!customer;
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer(customer?.id || '');

  // Dialog가 열릴 때 mutation 상태 초기화
  useEffect(() => {
    if (open) {
      createCustomerMutation.reset();
      updateCustomerMutation.reset();
    }
  }, [open]);

  const handleSubmit = async (data: CreateCustomerInput) => {
    try {
      if (isEditMode) {
        // 수정 모드
        await updateCustomerMutation.mutateAsync(data);
      } else {
        // 등록 모드
        await createCustomerMutation.mutateAsync(data);
      }

      // 성공 시
      onOpenChange(false); // Dialog 닫기
      if (onSuccess) {
        onSuccess(); // 콜백 실행 (선택적)
      }
    } catch (error) {
      // 에러는 CustomerForm 내부에서 표시
      console.error('Customer save error:', error);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const mutation = isEditMode ? updateCustomerMutation : createCustomerMutation;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isEditMode ? '고객 정보 수정' : '새 고객 등록'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `${customer.name}의 정보를 수정하세요`
              : '새로운 고객의 정보를 입력하고 등록하세요'}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <CustomerForm
            customer={customer || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={mutation.isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
