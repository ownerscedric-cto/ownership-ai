import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PremiumInquiry, InquiryStatus } from '@/lib/validations/inquiry';

interface InquiriesResponse {
  success: boolean;
  data: PremiumInquiry[];
  metadata: {
    total: number;
    page: number;
    limit: number;
  };
}

interface InquiryResponse {
  success: boolean;
  data: PremiumInquiry;
}

interface InquiryFilters {
  status?: 'pending' | 'approved' | 'rejected' | 'all';
  page?: number;
  limit?: number;
}

/**
 * 문의 목록 조회 hook
 */
export function useInquiries(filters: InquiryFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  return useQuery<InquiriesResponse>({
    queryKey: ['inquiries', filters],
    queryFn: async () => {
      const res = await fetch(`/api/inquiries?${params.toString()}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || '문의 목록을 불러오는데 실패했습니다');
      }
      return res.json();
    },
  });
}

/**
 * 본인의 대기 중인 문의 확인 hook
 */
export function useMyPendingInquiry() {
  return useQuery<InquiriesResponse>({
    queryKey: ['inquiries', 'my-pending'],
    queryFn: async () => {
      const res = await fetch('/api/inquiries?status=pending&limit=1');
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || '문의를 확인하는데 실패했습니다');
      }
      return res.json();
    },
  });
}

/**
 * 문의 생성 mutation
 */
export function useCreateInquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { message?: string }) => {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || '문의 생성에 실패했습니다');
      }
      return res.json() as Promise<InquiryResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });
}

/**
 * 문의 상태 업데이트 mutation (관리자용)
 */
export function useUpdateInquiryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      adminNote,
    }: {
      id: string;
      status: InquiryStatus;
      adminNote?: string;
    }) => {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNote }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || '문의 상태 업데이트에 실패했습니다');
      }
      return res.json() as Promise<InquiryResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });
}
