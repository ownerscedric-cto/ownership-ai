'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

/**
 * React Query 캐싱 전략 최적화
 * Phase 8: 성능 최적화
 *
 * staleTime: 데이터가 fresh에서 stale로 전환되는 시간
 * gcTime: 캐시에서 데이터가 제거되기까지의 시간 (이전 cacheTime)
 *
 * 캐싱 전략:
 * - 정적 데이터 (프로그램 목록): staleTime 10분
 * - 동적 데이터 (고객, 매칭): staleTime 5분
 * - 대시보드 통계: staleTime 2분 (자주 업데이트)
 */
export function ReactQueryProvider({ children }: { children: ReactNode }) {
  // useState를 사용하여 QueryClient를 생성 (리렌더링 시 재생성 방지)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 기본 5분 동안 데이터를 fresh로 유지
            staleTime: 5 * 60 * 1000,
            // 10분 동안 캐시 유지 (gcTime은 staleTime보다 길어야 함)
            gcTime: 10 * 60 * 1000,
            // 네트워크 에러 시 3번 재시도 (지수 백오프)
            retry: 3,
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
            // 윈도우 포커스 시 자동 refetch (stale 상태일 때만)
            refetchOnWindowFocus: true,
            // 마운트 시 refetch 비활성화 (stale 상태일 때만)
            refetchOnMount: 'always',
            // 네트워크 재연결 시 refetch
            refetchOnReconnect: true,
            // 백그라운드에서 refetch 활성화
            refetchInterval: false,
            // 구조적 공유로 불필요한 리렌더링 방지
            structuralSharing: true,
          },
          mutations: {
            // 에러 발생 시 1번 재시도
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 개발 환경에서만 DevTools 표시 */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

/**
 * 쿼리 키 상수 정의
 * 일관된 캐시 키 관리 및 무효화를 위한 상수
 */
export const queryKeys = {
  // 고객 관련
  customers: {
    all: ['customers'] as const,
    lists: () => [...queryKeys.customers.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.customers.lists(), filters] as const,
    details: () => [...queryKeys.customers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
    watchlist: (id: string) => [...queryKeys.customers.all, id, 'watchlist'] as const,
    projects: (id: string) => [...queryKeys.customers.all, id, 'projects'] as const,
  },

  // 프로그램 관련
  programs: {
    all: ['programs'] as const,
    lists: () => [...queryKeys.programs.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.programs.lists(), filters] as const,
    details: () => [...queryKeys.programs.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.programs.details(), id] as const,
  },

  // 매칭 관련
  matchings: {
    all: ['matchings'] as const,
    byCustomer: (customerId: string) =>
      [...queryKeys.matchings.all, 'customer', customerId] as const,
  },

  // 대시보드/분석
  analytics: {
    all: ['analytics'] as const,
    dashboard: (params: Record<string, unknown>) =>
      [...queryKeys.analytics.all, 'dashboard', params] as const,
    trends: (params: Record<string, unknown>) =>
      [...queryKeys.analytics.all, 'trends', params] as const,
    report: (params: Record<string, unknown>) =>
      [...queryKeys.analytics.all, 'report', params] as const,
    customerReport: (customerId: string) =>
      [...queryKeys.analytics.all, 'customer-report', customerId] as const,
  },

  // 교육 콘텐츠
  education: {
    videos: {
      all: ['education', 'videos'] as const,
      list: (filters: Record<string, unknown>) =>
        [...queryKeys.education.videos.all, 'list', filters] as const,
      detail: (id: string) => [...queryKeys.education.videos.all, 'detail', id] as const,
      categories: () => [...queryKeys.education.videos.all, 'categories'] as const,
    },
    knowhow: {
      all: ['education', 'knowhow'] as const,
      posts: (filters: Record<string, unknown>) =>
        [...queryKeys.education.knowhow.all, 'posts', filters] as const,
      post: (id: string) => [...queryKeys.education.knowhow.all, 'post', id] as const,
      categories: () => [...queryKeys.education.knowhow.all, 'categories'] as const,
      comments: (postId: string) =>
        [...queryKeys.education.knowhow.all, 'comments', postId] as const,
    },
    resources: {
      all: ['education', 'resources'] as const,
      list: (filters: Record<string, unknown>) =>
        [...queryKeys.education.resources.all, 'list', filters] as const,
      categories: () => [...queryKeys.education.resources.all, 'categories'] as const,
    },
  },

  // 관리자
  admin: {
    users: () => ['admin', 'users'] as const,
    roles: () => ['admin', 'roles'] as const,
    keywords: () => ['admin', 'keywords'] as const,
    copyTemplates: {
      all: ['admin', 'copyTemplates'] as const,
      list: () => ['admin', 'copyTemplates', 'list'] as const,
      detail: (id: string) => ['admin', 'copyTemplates', 'detail', id] as const,
    },
  },

  // 복사 템플릿 (사용자용)
  copyTemplates: {
    all: ['copyTemplates'] as const,
    list: () => ['copyTemplates', 'list'] as const,
  },
} as const;
