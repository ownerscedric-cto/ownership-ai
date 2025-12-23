/**
 * @file useWatchlist.ts
 * @description React Query hooks for customer watchlist management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Type definitions for watchlist
 */
export interface WatchlistProgram {
  id: string;
  customerId: string;
  programId: string;
  addedAt: string;
  notes: string | null;
  program: {
    id: string;
    dataSource: string;
    title: string;
    description: string | null;
    category: string | null;
    targetAudience: string[];
    targetLocation: string[];
    keywords: string[];
    budgetRange: string | null;
    deadline: Date | null;
    sourceUrl: string | null;
    registeredAt: Date;
    startDate: Date | null;
    endDate: Date | null;
    rawData: Record<string, unknown> | null;
  };
}

export interface WatchlistResponse {
  total: number;
  items: WatchlistProgram[];
}

export interface AddToWatchlistParams {
  customerId: string;
  programId: string;
  notes?: string;
}

export interface RemoveFromWatchlistParams {
  customerId: string;
  programId: string;
}

/**
 * Hook to fetch customer's watchlist
 */
export const useWatchlist = (customerId: string | undefined) => {
  return useQuery<WatchlistResponse>({
    queryKey: ['watchlist', customerId],
    queryFn: async () => {
      if (!customerId) {
        throw new Error('Customer ID is required');
      }

      const response = await fetch(`/api/customers/${customerId}/watchlist`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch watchlist');
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5분 캐싱
  });
};

/**
 * Hook to add program to watchlist
 */
export const useAddToWatchlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AddToWatchlistParams) => {
      const { customerId, programId, notes } = params;

      const response = await fetch(`/api/customers/${customerId}/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ programId, notes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to add to watchlist');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate watchlist query to refetch
      queryClient.invalidateQueries({
        queryKey: ['watchlist', variables.customerId],
      });
    },
  });
};

/**
 * Hook to remove program from watchlist
 */
export const useRemoveFromWatchlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RemoveFromWatchlistParams) => {
      const { customerId, programId } = params;

      const response = await fetch(`/api/customers/${customerId}/watchlist/${programId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to remove from watchlist');
      }

      return { customerId, programId };
    },
    onSuccess: (_, variables) => {
      // Invalidate watchlist query to refetch
      queryClient.invalidateQueries({
        queryKey: ['watchlist', variables.customerId],
      });
    },
  });
};

/**
 * Hook to check if program is in watchlist
 */
export const useIsInWatchlist = (customerId: string | undefined, programId: string) => {
  const { data: watchlist } = useWatchlist(customerId);

  return watchlist?.items.some(item => item.programId === programId) ?? false;
};
