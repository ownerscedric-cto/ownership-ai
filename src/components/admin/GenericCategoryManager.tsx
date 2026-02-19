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
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface GenericCategory {
  id: string;
  name: string;
  description: string | null;
  order: number;
  _count?: Record<string, number>;
}

interface GenericCategoryManagerProps {
  apiEndpoint: string;
  queryKey: string[];
  entityName: string;
  countFieldName?: string;
}

/**
 * 제네릭 카테고리 관리 컴포넌트
 * 다양한 카테고리 타입(비디오, 노하우 등)에 재사용 가능
 */
export function GenericCategoryManager({
  apiEndpoint,
  queryKey,
  entityName,
  countFieldName,
}: GenericCategoryManagerProps) {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<GenericCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: 0,
  });

  // 카테고리 목록 조회
  const { data: categories, isLoading } = useQuery<GenericCategory[]>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(apiEndpoint);
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json.data;
    },
  });

  // 카테고리 생성
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('카테고리가 추가되었습니다.');
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error('카테고리 추가 실패', {
        description: error.message,
      });
    },
  });

  // 카테고리 수정
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!selectedCategory) throw new Error('No category selected');
      const res = await fetch(`${apiEndpoint}/${selectedCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('카테고리가 수정되었습니다.');
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error('카테고리 수정 실패', {
        description: error.message,
      });
    },
  });

  // 카테고리 삭제
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${apiEndpoint}/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('카테고리가 삭제되었습니다.');
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
    },
    onError: (error: Error) => {
      toast.error('카테고리 삭제 실패', {
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', order: 0 });
    setSelectedCategory(null);
  };

  const handleCreate = () => {
    setIsCreateDialogOpen(true);
    resetForm();
  };

  const handleEdit = (category: GenericCategory) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      order: category.order,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (category: GenericCategory) => {
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

  // countFieldName이 있을 때 카운트 값 가져오기
  const getCount = (category: GenericCategory): number => {
    if (!countFieldName || !category._count) return 0;
    return category._count[countFieldName] || 0;
  };

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          카테고리 목록 ({categories?.length || 0}개)
        </h2>
        <Button onClick={handleCreate} className="bg-[#0052CC] hover:bg-[#003d99]">
          <Plus className="w-4 h-4 mr-2" />
          카테고리 추가
        </Button>
      </div>

      {/* Categories List */}
      <div className="grid gap-4">
        {categories?.map(category => (
          <Card key={category.id}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4 flex-1">
                <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>정렬 순서: {category.order}</span>
                    {countFieldName && (
                      <span>
                        {entityName} {getCount(category)}개
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(category)}
                  disabled={countFieldName ? getCount(category) > 0 : false}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {categories?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              등록된 카테고리가 없습니다. 카테고리를 추가해주세요.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>카테고리 추가</DialogTitle>
            <DialogDescription>새로운 {entityName} 카테고리를 추가합니다.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="create-name">카테고리 이름 *</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: 개요, 분야별, 신청서작성"
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
