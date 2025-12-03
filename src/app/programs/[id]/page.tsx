/**
 * @file /app/programs/[id]/page.tsx
 * @description 정부지원사업 프로그램 상세 페이지
 * Phase 3: 정부지원사업 UI 컴포넌트
 */

'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { ProgramDetail } from '@/components/programs/ProgramDetail';
import { use } from 'react';

interface ProgramDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * 정부지원사업 프로그램 상세 페이지
 *
 * 기능:
 * - 프로그램 상세 정보 표시
 * - 로딩/에러 상태 처리
 */
export default function ProgramDetailPage({ params }: ProgramDetailPageProps) {
  const { id } = use(params);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <ProgramDetail id={id} />
      </div>
    </AppLayout>
  );
}
