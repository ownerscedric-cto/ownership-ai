'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  // useState를 사용하여 QueryClient를 생성 (리렌더링 시 재생성 방지)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 5분 동안 데이터를 fresh로 유지
            staleTime: 5 * 60 * 1000,
            // 네트워크 에러 시 3번 재시도
            retry: 3,
            // 윈도우 포커스 시 자동 refetch
            refetchOnWindowFocus: true,
          },
          mutations: {
            // 에러 발생 시 1번 재시도
            retry: 1,
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
