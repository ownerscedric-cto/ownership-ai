import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { KnowHowCategoryManager } from '@/components/admin/KnowHowCategoryManager';

/**
 * 노하우 카테고리 관리 페이지
 */
export default function AdminKnowHowCategoriesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/education/knowhow"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          노하우 관리로 돌아가기
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">노하우 카테고리 관리</h1>
        <p className="text-gray-600 mt-2">노하우 카테고리를 추가, 수정, 삭제할 수 있습니다.</p>
      </div>

      {/* Category Manager */}
      <KnowHowCategoryManager />
    </div>
  );
}
