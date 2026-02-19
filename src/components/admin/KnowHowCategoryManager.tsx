'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, FolderOpen, Folder } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface KnowHowCategory {
  id: string;
  name: string;
  description: string | null;
  order: number;
  parentId: string | null;
  _count?: {
    posts: number;
    archives: number;
  };
  children?: KnowHowCategory[];
}

interface FormData {
  name: string;
  description: string;
  order: number;
  parentId: string | null;
}

const MAX_COUNT = 30; // 대분류 + 중분류 포함 최대 개수

/**
 * 노하우 카테고리 관리 컴포넌트
 * 계층형 카테고리(대분류/중분류) 지원
 */
export function KnowHowCategoryManager() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<KnowHowCategory | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    order: 0,
    parentId: null,
  });

  // 카테고리 목록 조회 (계층형)
  const { data: hierarchicalCategories, isLoading } = useQuery<KnowHowCategory[]>({
    queryKey: ['admin', 'knowhow-categories'],
    queryFn: async () => {
      const res = await fetch('/api/admin/education/knowhow/categories');
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json.data;
    },
  });

  // 플랫 카테고리 목록 (부모 선택용) - 대분류만
  const rootCategories = hierarchicalCategories?.filter(c => !c.parentId) || [];

  // 전체 카테고리 개수 계산
  const getTotalCount = (categories: KnowHowCategory[]): number => {
    let count = 0;
    categories.forEach(cat => {
      count++;
      if (cat.children) {
        count += cat.children.length;
      }
    });
    return count;
  };

  const totalCount = hierarchicalCategories ? getTotalCount(hierarchicalCategories) : 0;

  // 카테고리 생성
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch('/api/admin/education/knowhow/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'knowhow-categories'] });
      queryClient.invalidateQueries({ queryKey: ['knowhow-categories'] });
      toast.success('카테고리가 추가되었습니다.');
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error('카테고리 추가 실패', { description: error.message });
    },
  });

  // 카테고리 수정
  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!selectedCategory) throw new Error('No category selected');
      const res = await fetch(`/api/admin/education/knowhow/categories/${selectedCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'knowhow-categories'] });
      queryClient.invalidateQueries({ queryKey: ['knowhow-categories'] });
      toast.success('카테고리가 수정되었습니다.');
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error('카테고리 수정 실패', { description: error.message });
    },
  });

  // 카테고리 삭제
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/education/knowhow/categories/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'knowhow-categories'] });
      queryClient.invalidateQueries({ queryKey: ['knowhow-categories'] });
      toast.success('카테고리가 삭제되었습니다.');
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
    },
    onError: (error: Error) => {
      toast.error('카테고리 삭제 실패', { description: error.message });
    },
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', order: 0, parentId: null });
    setSelectedCategory(null);
  };

  const handleCreate = (parentId: string | null = null) => {
    if (totalCount >= MAX_COUNT) {
      toast.error(`카테고리는 최대 ${MAX_COUNT}개까지 생성할 수 있습니다.`);
      return;
    }
    setFormData({ name: '', description: '', order: 0, parentId });
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (category: KnowHowCategory) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      order: category.order,
      parentId: category.parentId,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (category: KnowHowCategory) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleConfirmDelete = () => {
    if (selectedCategory) {
      deleteMutation.mutate(selectedCategory.id);
    }
  };

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // 카테고리에 연결된 컨텐츠 개수
  const getContentCount = (category: KnowHowCategory): number => {
    const posts = category._count?.posts || 0;
    const archives = category._count?.archives || 0;
    return posts + archives;
  };

  // 하위 카테고리 포함 전체 컨텐츠 개수
  const getTotalContentCount = (category: KnowHowCategory): number => {
    let count = getContentCount(category);
    if (category.children) {
      category.children.forEach(child => {
        count += getContentCount(child);
      });
    }
    return count;
  };

  // 카테고리 아이템 렌더링
  const renderCategory = (category: KnowHowCategory, level: number = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;
    const contentCount = getContentCount(category);
    const canDelete = contentCount === 0 && (!hasChildren || category.children?.length === 0);

    return (
      <div key={category.id}>
        <Card className={cn('transition-all', level > 0 && 'ml-8 border-l-4 border-l-blue-200')}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3 flex-1">
              {/* 확장/축소 버튼 (대분류만) */}
              {level === 0 ? (
                <button
                  onClick={() => toggleExpand(category.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {hasChildren ? (
                    isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <div className="w-6" />
              )}

              {/* 폴더 아이콘 */}
              {level === 0 ? (
                isExpanded ? (
                  <FolderOpen className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Folder className="w-5 h-5 text-yellow-500" />
                )
              ) : (
                <div className="w-2 h-2 rounded-full bg-blue-400" />
              )}

              {/* 카테고리 정보 */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {level === 0 ? '대분류' : '중분류'}
                  </span>
                </div>
                {category.description && (
                  <p className="text-sm text-gray-600 mt-0.5">{category.description}</p>
                )}
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span>정렬: {category.order}</span>
                  <span>게시글: {category._count?.posts || 0}개</span>
                  <span>아카이브: {category._count?.archives || 0}개</span>
                  {hasChildren && (
                    <span className="text-blue-600">
                      하위 카테고리: {category.children?.length}개
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-2">
              {level === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreate(category.id)}
                  title="중분류 추가"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(category)}
                disabled={!canDelete}
                title={
                  !canDelete ? '연결된 컨텐츠나 하위 카테고리가 있어 삭제할 수 없습니다' : '삭제'
                }
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 하위 카테고리 */}
        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2">
            {category.children?.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            카테고리 목록 ({totalCount}개 / 최대 {MAX_COUNT}개)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            대분류를 먼저 만들고, 대분류 안에 중분류를 추가할 수 있습니다.
          </p>
        </div>
        <Button onClick={() => handleCreate(null)} className="bg-[#0052CC] hover:bg-[#003d99]">
          <Plus className="w-4 h-4 mr-2" />
          대분류 추가
        </Button>
      </div>

      {/* Categories List */}
      <div className="space-y-3">
        {hierarchicalCategories?.map(category => renderCategory(category))}

        {hierarchicalCategories?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              등록된 카테고리가 없습니다. 대분류 카테고리를 추가해주세요.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formData.parentId ? '중분류 추가' : '대분류 추가'}</DialogTitle>
            <DialogDescription>
              {formData.parentId
                ? '선택한 대분류 아래에 중분류를 추가합니다.'
                : '새로운 대분류 카테고리를 추가합니다.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate}>
            <div className="space-y-4 py-4">
              {/* 상위 카테고리 선택 */}
              <div>
                <Label htmlFor="create-parent">상위 카테고리</Label>
                <Select
                  value={formData.parentId || 'none'}
                  onValueChange={value =>
                    setFormData({ ...formData, parentId: value === 'none' ? null : value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="상위 카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">없음 (대분류)</SelectItem>
                    {rootCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  상위 카테고리를 선택하면 중분류가 됩니다.
                </p>
              </div>

              <div>
                <Label htmlFor="create-name">카테고리 이름 *</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: 정책자금, 인증지원"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="create-description">설명</Label>
                <Textarea
                  id="create-description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="카테고리 설명 (선택사항)"
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="create-order">정렬 순서</Label>
                <Input
                  id="create-order"
                  type="number"
                  value={formData.order}
                  onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">숫자가 작을수록 먼저 표시됩니다.</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                취소
              </Button>
              <Button
                type="submit"
                className="bg-[#0052CC] hover:bg-[#003d99]"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? '추가 중...' : '추가'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>카테고리 수정</DialogTitle>
            <DialogDescription>카테고리 정보를 수정합니다.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit}>
            <div className="space-y-4 py-4">
              {/* 상위 카테고리 선택 (대분류만 변경 가능) */}
              <div>
                <Label htmlFor="edit-parent">상위 카테고리</Label>
                <Select
                  value={formData.parentId || 'none'}
                  onValueChange={value =>
                    setFormData({ ...formData, parentId: value === 'none' ? null : value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="상위 카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">없음 (대분류)</SelectItem>
                    {rootCategories
                      .filter(cat => cat.id !== selectedCategory?.id) // 자기 자신 제외
                      .map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-name">카테고리 이름 *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">설명</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-order">정렬 순서</Label>
                <Input
                  id="edit-order"
                  type="number"
                  value={formData.order}
                  onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                취소
              </Button>
              <Button
                type="submit"
                className="bg-[#0052CC] hover:bg-[#003d99]"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? '수정 중...' : '수정'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>카테고리 삭제</DialogTitle>
            <DialogDescription>
              정말로 &quot;{selectedCategory?.name}&quot; 카테고리를 삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
              {selectedCategory?.children && selectedCategory.children.length > 0 && (
                <span className="block mt-2 text-red-500">
                  하위 카테고리가 있어 삭제할 수 없습니다.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
