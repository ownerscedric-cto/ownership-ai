'use client';

/**
 * @file CustomerSelectDialog.tsx
 * @description Dialog component to select a customer for adding program to watchlist
 */

import { useState } from 'react';
import { Search, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useCustomers } from '@/hooks/useCustomers';
import { useIsInWatchlist } from '@/lib/hooks/useWatchlist';
import type { Customer } from '@/lib/types/customer';

interface CustomerSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (customer: Customer) => void;
  programId: string;
}

/**
 * Individual customer list item with watchlist status badge
 */
interface CustomerListItemProps {
  customer: Customer;
  programId: string;
  onSelect: (customer: Customer) => void;
}

function CustomerListItem({ customer, programId, onSelect }: CustomerListItemProps) {
  const isInWatchlist = useIsInWatchlist(customer.id, programId);

  return (
    <button
      onClick={() => onSelect(customer)}
      className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-[#0052CC] hover:bg-gray-50 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900">{customer.name}</div>
          <div className="text-sm text-gray-600 mt-1">{customer.businessNumber}</div>
          {customer.industry && (
            <div className="text-xs text-gray-500 mt-1">{customer.industry}</div>
          )}
        </div>

        {isInWatchlist && (
          <Badge variant="secondary" className="text-green-600 border-green-200 flex-shrink-0">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            등록됨
          </Badge>
        )}
      </div>
    </button>
  );
}

export function CustomerSelectDialog({
  open,
  onOpenChange,
  onSelect,
  programId,
}: CustomerSelectDialogProps) {
  const [search, setSearch] = useState('');

  // Fetch all customers with pagination
  const { data, isLoading, error } = useCustomers({
    page: 1,
    limit: 100, // Get more customers to support search
    name: search || undefined,
  });

  const customers = data?.customers || [];

  const handleSelect = (customer: Customer) => {
    onSelect(customer);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>관심 목록에 추가할 고객 선택</DialogTitle>
          <DialogDescription>
            이 프로그램을 어떤 고객의 관심 목록에 추가하시겠습니까?
          </DialogDescription>
        </DialogHeader>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="고객명 또는 사업자명 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Customer list */}
        <ScrollArea className="h-[400px] pr-4">
          {isLoading && (
            <div className="flex items-center justify-center h-full text-gray-500">로딩 중...</div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full text-red-600">
              고객 목록을 불러오는데 실패했습니다
            </div>
          )}

          {!isLoading && !error && customers.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-500">
              {search ? '검색 결과가 없습니다' : '등록된 고객이 없습니다'}
            </div>
          )}

          {!isLoading && !error && customers.length > 0 && (
            <div className="space-y-2">
              {customers.map(customer => (
                <CustomerListItem
                  key={customer.id}
                  customer={customer}
                  programId={programId}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
