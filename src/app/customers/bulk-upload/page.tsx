'use client';

import BulkUpload from '@/components/customers/BulkUpload';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BulkUploadPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/customers">
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              고객 목록으로 돌아가기
            </Button>
          </Link>

          <h1 className="mb-2 text-3xl font-bold text-gray-900">고객 일괄 등록</h1>
          <p className="text-gray-600">
            엑셀 파일을 업로드하여 여러 고객을 한 번에 등록할 수 있습니다.
          </p>
        </div>

        {/* 가이드 */}
        <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h2 className="mb-3 text-lg font-semibold text-blue-900">📌 업로드 가이드</h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex gap-2">
              <span className="font-semibold">1.</span>
              <span>먼저 엑셀 템플릿을 다운로드하여 고객 정보를 입력해주세요.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">2.</span>
              <span>
                필수 항목(*)은 반드시 입력해야 하며, 사업자등록번호는 10자리 숫자여야 합니다.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">3.</span>
              <span>법인사업자인 경우 법인등록번호(13자리)를 반드시 입력해주세요.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">4.</span>
              <span>
                배열 형태의 데이터(과제, 목표, 선호키워드)는 쉼표(,)로 구분하여 입력하세요.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">5.</span>
              <span>중복된 사업자등록번호가 있으면 해당 행은 등록되지 않으므로 주의하세요.</span>
            </li>
          </ul>
        </div>

        {/* 업로드 컴포넌트 */}
        <BulkUpload />
      </div>
    </AppLayout>
  );
}
