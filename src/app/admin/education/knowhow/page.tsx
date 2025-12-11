import { BookOpen, Plus, FolderTree, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminKnowHowTable } from '@/components/admin/AdminKnowHowTable';
import { supabaseAdmin } from '@/lib/supabase/admin';
import Link from 'next/link';

/**
 * Admin Education KnowHow Management Page
 * - List all knowhow articles (archive)
 * - List all knowhow posts (community)
 * - Create, Edit, Delete knowhow
 */
export default async function AdminKnowHowPage() {
  // Fetch all knowhow (archive) with category relation (sorted by createdAt desc)
  const { data: knowhows } = await supabaseAdmin
    .from('knowhow')
    .select(
      `
      *,
      category:knowhow_categories!knowhow_categoryid_fkey(*)
    `
    )
    .order('createdAt', { ascending: false });

  // Fetch all knowhow posts (community) with category relation (sorted by createdAt desc)
  const { data: knowhowPosts } = await supabaseAdmin
    .from('knowhow_posts')
    .select(
      `
      *,
      category:knowhow_categories(*)
    `
    )
    .order('createdAt', { ascending: false });

  // Fetch all categories (sorted by order asc)
  const { data: categories } = await supabaseAdmin
    .from('knowhow_categories')
    .select('*')
    .order('order', { ascending: true });

  // For each category, count knowhows and sum viewCounts
  const categoriesWithStats = await Promise.all(
    (categories || []).map(async cat => {
      const { data: categoryKnowHows } = await supabaseAdmin
        .from('knowhow')
        .select('viewCount')
        .eq('categoryId', cat.id);

      return {
        ...cat,
        knowhows: categoryKnowHows || [],
      };
    })
  );

  const stats = {
    total: knowhows?.length || 0,
    totalViews: (knowhows || []).reduce((sum, k) => sum + k.viewCount, 0),
    byCategory: categoriesWithStats.reduce(
      (acc, cat) => {
        acc[cat.name] = {
          count: cat.knowhows.length,
          views: cat.knowhows.reduce(
            (sum: number, k: { viewCount: number }) => sum + k.viewCount,
            0
          ),
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
          <h1 className="text-3xl font-bold text-gray-900">노하우 관리</h1>
          <p className="text-gray-600 mt-2">노하우 아카이브 및 커뮤니티 관리</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/education/knowhow/categories">
            <Button variant="outline">
              <FolderTree className="w-4 h-4 mr-2" />
              카테고리 관리
            </Button>
          </Link>
          <Link href="/admin/education/knowhow/posts/new">
            <Button className="bg-[#0052CC] hover:bg-[#003d99]">
              <MessageSquare className="w-4 h-4 mr-2" />
              커뮤니티 글쓰기
            </Button>
          </Link>
          <Link href="/admin/education/knowhow/archive/new">
            <Button className="bg-[#0052CC] hover:bg-[#003d99]">
              <Plus className="w-4 h-4 mr-2" />
              아카이브 추가
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 전체 노하우 카드 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 노하우</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <BookOpen className="w-10 h-10 text-[#0052CC]" />
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
            <BookOpen className="w-10 h-10 text-green-600" />
          </div>
        </div>

        {/* 카테고리 개수 카드 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">카테고리</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{categoriesWithStats.length}</p>
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
                    노하우
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
                    노하우
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

      {/* Archive Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            아카이브 ({knowhows?.length || 0})
          </h2>
          <p className="text-sm text-gray-600 mt-1">전문 노하우 콘텐츠 (Markdown)</p>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          <AdminKnowHowTable knowhows={knowhows || []} type="archive" />
        </div>
      </div>

      {/* Community Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            커뮤니티 ({knowhowPosts?.length || 0})
          </h2>
          <p className="text-sm text-gray-600 mt-1">게시글, 공지사항, 이벤트</p>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          <AdminKnowHowTable knowhows={knowhowPosts || []} type="community" />
        </div>
      </div>
    </div>
  );
}
