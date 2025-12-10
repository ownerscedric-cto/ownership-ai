import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { VideoCategoryManager } from '@/components/admin/VideoCategoryManager';

/**
 * 비디오 카테고리 관리 페이지
 */
export default function AdminVideoCategoriesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/education/videos"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          비디오 관리로 돌아가기
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">비디오 카테고리 관리</h1>
        <p className="text-gray-600 mt-2">교육 비디오 카테고리를 추가, 수정, 삭제할 수 있습니다.</p>
      </div>

      {/* Category Manager */}
      <VideoCategoryManager />
    </div>
  );
}
