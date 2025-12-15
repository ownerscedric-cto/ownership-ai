import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ResourceForm } from '@/components/admin/ResourceForm';

/**
 * Admin New Resource Page
 */
export default function AdminNewResourcePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/education/resources"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          자료 목록으로 돌아가기
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">새 자료 추가</h1>
        <p className="text-gray-600 mt-2">교육 자료를 추가합니다.</p>
      </div>

      {/* Form */}
      <ResourceForm mode="create" />
    </div>
  );
}
