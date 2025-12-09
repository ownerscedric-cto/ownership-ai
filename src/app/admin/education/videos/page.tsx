import { Video, Plus, FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminVideoTable } from '@/components/admin/AdminVideoTable';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

/**
 * Admin Education Videos Management Page
 * - List all education videos
 * - Create, Edit, Delete videos
 */
export default async function AdminVideosPage() {
  // Fetch all videos with category relation
  const videos = await prisma.educationVideo.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
    },
  });

  // Fetch all categories with video counts and view counts
  const categories = await prisma.videoCategory.findMany({
    orderBy: { order: 'asc' },
    include: {
      videos: {
        select: {
          viewCount: true,
        },
      },
    },
  });

  const stats = {
    total: videos.length,
    totalViews: videos.reduce((sum, v) => sum + v.viewCount, 0),
    byCategory: categories.reduce(
      (acc, cat) => {
        acc[cat.name] = {
          count: cat.videos.length,
          views: cat.videos.reduce((sum, v) => sum + v.viewCount, 0),
        };
        return acc;
      },
      {} as Record<string, { count: number; views: number }>
    ),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">교육 비디오 관리</h1>
          <p className="text-gray-600 mt-2">교육 비디오 콘텐츠 관리</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/education/categories">
            <Button variant="outline">
              <FolderTree className="w-4 h-4 mr-2" />
              카테고리 관리
            </Button>
          </Link>
          <Link href="/admin/education/videos/new">
            <Button className="bg-[#0052CC] hover:bg-[#003d99]">
              <Plus className="w-4 h-4 mr-2" />
              비디오 추가
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 전체 비디오 카드 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 비디오</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Video className="w-10 h-10 text-[#0052CC]" />
          </div>
        </div>

        {/* 총 조회수 카드 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 조회수</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalViews.toLocaleString()}
              </p>
            </div>
            <Video className="w-10 h-10 text-green-600" />
          </div>
        </div>

        {/* 카테고리 개수 카드 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">카테고리</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{categories.length}</p>
              <p className="text-xs text-gray-500 mt-1">최대 10개</p>
            </div>
            <FolderTree className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* 카테고리별 상세 통계 - 2열 테이블 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">카테고리별 통계</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽 테이블 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    카테고리
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                    비디오
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                    조회수
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">평균</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(stats.byCategory)
                  .slice(0, Math.ceil(Object.keys(stats.byCategory).length / 2))
                  .map(([name, data]) => {
                    const avgViews =
                      (data as { count: number; views: number }).count > 0
                        ? Math.round(
                            (data as { count: number; views: number }).views /
                              (data as { count: number; views: number }).count
                          )
                        : 0;
                    return (
                      <tr key={name} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{name}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {(data as { count: number; views: number }).count}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-[#0052CC] font-semibold">
                          {(data as { count: number; views: number }).views.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-green-600 font-semibold">
                          {avgViews.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* 오른쪽 테이블 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    카테고리
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                    비디오
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                    조회수
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">평균</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(stats.byCategory)
                  .slice(Math.ceil(Object.keys(stats.byCategory).length / 2))
                  .map(([name, data]) => {
                    const avgViews =
                      (data as { count: number; views: number }).count > 0
                        ? Math.round(
                            (data as { count: number; views: number }).views /
                              (data as { count: number; views: number }).count
                          )
                        : 0;
                    return (
                      <tr key={name} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{name}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {(data as { count: number; views: number }).count}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-[#0052CC] font-semibold">
                          {(data as { count: number; views: number }).views.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-green-600 font-semibold">
                          {avgViews.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Video Table */}
      <AdminVideoTable videos={videos} />
    </div>
  );
}
