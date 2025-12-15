import { FileText, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminResourceTable } from '@/components/admin/AdminResourceTable';
import { supabaseAdmin } from '@/lib/supabase/admin';
import Link from 'next/link';

/**
 * Admin Education Resources Management Page
 * - List all education resources
 * - Create, Edit, Delete resources
 * - Link resources to videos
 */
export default async function AdminResourcesPage() {
  // Fetch all resources with video relation (sorted by createdAt desc)
  const { data: resources } = await supabaseAdmin
    .from('resources')
    .select(
      `
      *,
      video:education_videos!resources_videoId_fkey(id, title)
    `
    )
    .order('createdAt', { ascending: false });

  // Stats
  const stats = {
    total: resources?.length || 0,
    totalDownloads: (resources || []).reduce((sum, r) => sum + r.downloadCount, 0),
    byType: (resources || []).reduce(
      (acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    linkedToVideo: (resources || []).filter(r => r.videoId).length,
  };

  const typeLabels: Record<string, string> = {
    template: '템플릿',
    checklist: '체크리스트',
    document: '문서',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">자료실 관리</h1>
          <p className="text-gray-600 mt-2">교육 자료 및 템플릿 관리</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/education/resources/new">
            <Button className="bg-[#0052CC] hover:bg-[#003d99]">
              <Plus className="w-4 h-4 mr-2" />
              자료 추가
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* 전체 자료 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 자료</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <FileText className="w-10 h-10 text-[#0052CC]" />
          </div>
        </div>

        {/* 총 다운로드 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 다운로드</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalDownloads.toLocaleString()}
              </p>
            </div>
            <Download className="w-10 h-10 text-green-600" />
          </div>
        </div>

        {/* 비디오 연결 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">비디오 연결</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.linkedToVideo}</p>
              <p className="text-xs text-gray-500 mt-1">비디오에 연결된 자료</p>
            </div>
            <FileText className="w-10 h-10 text-purple-600" />
          </div>
        </div>

        {/* 타입별 현황 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">타입별 현황</p>
          <div className="space-y-1">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex justify-between text-sm">
                <span className="text-gray-700">{typeLabels[type] || type}</span>
                <span className="font-semibold text-gray-900">{count as number}</span>
              </div>
            ))}
            {Object.keys(stats.byType).length === 0 && (
              <p className="text-gray-400 text-sm">아직 자료가 없습니다</p>
            )}
          </div>
        </div>
      </div>

      {/* Resource Table */}
      <AdminResourceTable resources={resources || []} />
    </div>
  );
}
