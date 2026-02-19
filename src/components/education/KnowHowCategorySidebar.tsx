/**
 * @file KnowHowCategorySidebar.tsx
 * @description 노하우 커뮤니티 카테고리 사이드바 (네이버 카페 스타일)
 */

'use client';

import { FileText, Megaphone, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKnowHowCategories } from '@/hooks/useEducation';
import { Skeleton } from '@/components/ui/skeleton';

// 카테고리 타입 정의
interface CategoryWithCount {
  id: string;
  name: string;
  description: string | null;
  order: number;
  parentId: string | null;
  _count: {
    posts: number;
    archives: number;
  };
  children?: CategoryWithCount[];
}

interface KnowHowCategorySidebarProps {
  selectedCategoryId?: string;
  onCategoryChange: (categoryId: string | undefined) => void;
  selectedTab: 'all' | 'announcement' | 'event';
  onTabChange: (tab: 'all' | 'announcement' | 'event') => void;
}

/**
 * 카테고리 아이템 컴포넌트 (재귀적 렌더링)
 * - 클라이언트 페이지에서는 항상 펼쳐진 상태로 표시
 */
function CategoryItem({
  category,
  selectedCategoryId,
  onCategoryChange,
  depth = 0,
}: {
  category: CategoryWithCount;
  selectedCategoryId?: string;
  onCategoryChange: (categoryId: string | undefined) => void;
  depth?: number;
}) {
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedCategoryId === category.id;

  return (
    <div>
      <button
        onClick={() => onCategoryChange(category.id)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left',
          'hover:bg-gray-100',
          isSelected && 'bg-[#0052CC]/10 text-[#0052CC] font-medium',
          depth > 0 && 'pl-6'
        )}
      >
        {/* 카테고리 아이콘 */}
        <span className="w-4 h-4 flex items-center justify-center">
          <FileText className="w-3 h-3 text-gray-400" />
        </span>

        {/* 카테고리 이름 */}
        <span className="flex-1 truncate">{category.name}</span>
      </button>

      {/* 자식 카테고리 - 항상 펼쳐진 상태 */}
      {hasChildren && (
        <div className="ml-2 border-l border-gray-200">
          {category.children!.map(child => (
            <CategoryItem
              key={child.id}
              category={child}
              selectedCategoryId={selectedCategoryId}
              onCategoryChange={onCategoryChange}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 노하우 커뮤니티 카테고리 사이드바
 */
export function KnowHowCategorySidebar({
  selectedCategoryId,
  onCategoryChange,
  selectedTab,
  onTabChange,
}: KnowHowCategorySidebarProps) {
  const { data: categoriesData, isLoading } = useKnowHowCategories();
  const categories = (categoriesData?.data || []) as CategoryWithCount[];

  // 전체 게시글 수 계산
  const totalPosts = categories.reduce((sum, cat) => {
    const countChildren = (c: CategoryWithCount): number => {
      let total = c._count.posts + c._count.archives;
      if (c.children) {
        total += c.children.reduce((s, child) => s + countChildren(child), 0);
      }
      return total;
    };
    return sum + countChildren(cat);
  }, 0);

  if (isLoading) {
    return (
      <aside className="w-64 flex-shrink-0 bg-white rounded-lg shadow-sm p-4">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-white rounded-lg shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 bg-gray-50 border-b">
        <h2 className="font-semibold text-gray-900">카테고리</h2>
      </div>

      <div className="p-2">
        {/* 고정 메뉴 */}
        <div className="mb-4 pb-4 border-b">
          {/* 전체글보기 */}
          <button
            onClick={() => {
              onTabChange('all');
              onCategoryChange(undefined);
            }}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
              'hover:bg-gray-100',
              selectedTab === 'all' &&
                !selectedCategoryId &&
                'bg-[#0052CC]/10 text-[#0052CC] font-medium'
            )}
          >
            <FileText className="w-4 h-4" />
            <span className="flex-1">전체글보기</span>
            <span className="text-xs text-gray-400">{totalPosts}</span>
          </button>

          {/* 공지사항 */}
          <button
            onClick={() => {
              onTabChange('announcement');
              onCategoryChange(undefined);
            }}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
              'hover:bg-gray-100',
              selectedTab === 'announcement' && 'bg-[#0052CC]/10 text-[#0052CC] font-medium'
            )}
          >
            <Megaphone className="w-4 h-4" />
            <span className="flex-1">공지사항</span>
          </button>

          {/* 이벤트 */}
          <button
            onClick={() => {
              onTabChange('event');
              onCategoryChange(undefined);
            }}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
              'hover:bg-gray-100',
              selectedTab === 'event' && 'bg-[#0052CC]/10 text-[#0052CC] font-medium'
            )}
          >
            <Gift className="w-4 h-4" />
            <span className="flex-1">이벤트</span>
          </button>
        </div>

        {/* 카테고리 목록 (계층형) */}
        <div className="space-y-1">
          {categories.length > 0 ? (
            categories.map(category => (
              <CategoryItem
                key={category.id}
                category={category}
                selectedCategoryId={selectedCategoryId}
                onCategoryChange={id => {
                  onTabChange('all');
                  onCategoryChange(id);
                }}
              />
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">카테고리가 없습니다</p>
          )}
        </div>
      </div>
    </aside>
  );
}
