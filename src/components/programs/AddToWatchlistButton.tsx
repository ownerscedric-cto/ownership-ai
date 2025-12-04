'use client';

/**
 * @file AddToWatchlistButton.tsx
 * @description Button component to add program to customer's watchlist
 */

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAddToWatchlist } from '@/lib/hooks/useWatchlist';
import { CustomerSelectDialog } from './CustomerSelectDialog';
import type { Customer } from '@prisma/client';

interface AddToWatchlistButtonProps {
  programId: string;
  programTitle: string;
}

export function AddToWatchlistButton({ programId, programTitle }: AddToWatchlistButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const addToWatchlist = useAddToWatchlist();

  const handleSelectCustomer = async (customer: Customer) => {
    try {
      await addToWatchlist.mutateAsync({
        customerId: customer.id,
        programId,
      });

      toast.success('관심 목록에 추가했습니다', {
        description: `"${programTitle}"를 ${customer.name}의 관심 목록에 추가했습니다.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '관심 목록 추가에 실패했습니다';

      toast.error('추가 실패', {
        description: errorMessage,
      });
    }
  };

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        variant="outline"
        className="gap-2"
        disabled={addToWatchlist.isPending}
      >
        <Star className="w-4 h-4" />
        관심 목록에 추가
      </Button>

      <CustomerSelectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelect={handleSelectCustomer}
      />
    </>
  );
}
