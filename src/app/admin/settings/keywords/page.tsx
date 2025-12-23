'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, GripVertical, Tags, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

// 타입 정의
interface Keyword {
  id: string;
  keyword: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface KeywordCategory {
  id: string;
  name: string;
  displayName: string;
  color: string;
  order: number;
  keywords: Keyword[];
  createdAt: string;
  updatedAt: string;
}

interface KeywordsResponse {
  success: boolean;
  data: {
    categories: KeywordCategory[];
    totalKeywords: number;
  };
}

// 색상 매핑 (클라이언트 페이지에서 사용할 원본 색상)
const colorMap: Record<string, string> = {
  red: 'bg-red-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  gray: 'bg-gray-500',
};

const colorOptions = [
  { value: 'red', label: '빨강', className: 'bg-red-500' },
  { value: 'green', label: '초록', className: 'bg-green-500' },
  { value: 'blue', label: '파랑', className: 'bg-blue-500' },
  { value: 'yellow', label: '노랑', className: 'bg-yellow-500' },
  { value: 'purple', label: '보라', className: 'bg-purple-500' },
  { value: 'orange', label: '주황', className: 'bg-orange-500' },
  { value: 'gray', label: '회색', className: 'bg-gray-500' },
];

export default function KeywordsManagementPage() {
  const queryClient = useQueryClient();

  // 다이얼로그 상태
  const [isKeywordDialogOpen, setIsKeywordDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [editingCategory, setEditingCategory] = useState<KeywordCategory | null>(null);
  const [deletingItem, setDeletingItem] = useState<{
    type: 'keyword' | 'category';
    id: string;
    name: string;
  } | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // 폼 상태
  const [keywordForm, setKeywordForm] = useState({ keyword: '', isActive: true });
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    displayName: '',
    color: 'blue',
  });

  // 키워드 조회
  const { data, isLoading, error } = useQuery<KeywordsResponse>({
    queryKey: ['admin-keywords'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings/keywords');
      if (!res.ok) throw new Error('키워드 조회 실패');
      return res.json();
    },
  });

  // 키워드 생성
  const createKeywordMutation = useMutation({
    mutationFn: async (data: { categoryId: string; keyword: string; isActive: boolean }) => {
      const res = await fetch('/api/admin/settings/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || '키워드 생성 실패');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-keywords'] });
      toast.success('키워드가 생성되었습니다');
      setIsKeywordDialogOpen(false);
      resetKeywordForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // 키워드 수정
  const updateKeywordMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Keyword> }) => {
      const res = await fetch(`/api/admin/settings/keywords/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || '키워드 수정 실패');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-keywords'] });
      toast.success('키워드가 수정되었습니다');
      setIsKeywordDialogOpen(false);
      resetKeywordForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // 키워드 삭제
  const deleteKeywordMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/settings/keywords/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || '키워드 삭제 실패');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-keywords'] });
      toast.success('키워드가 삭제되었습니다');
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // 카테고리 생성
  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; displayName: string; color: string }) => {
      const res = await fetch('/api/admin/settings/keyword-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || '카테고리 생성 실패');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-keywords'] });
      toast.success('카테고리가 생성되었습니다');
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // 카테고리 수정
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<KeywordCategory> }) => {
      const res = await fetch(`/api/admin/settings/keyword-categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || '카테고리 수정 실패');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-keywords'] });
      toast.success('카테고리가 수정되었습니다');
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // 카테고리 삭제
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/settings/keyword-categories/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || '카테고리 삭제 실패');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-keywords'] });
      toast.success('카테고리가 삭제되었습니다');
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // 폼 리셋
  const resetKeywordForm = () => {
    setKeywordForm({ keyword: '', isActive: true });
    setEditingKeyword(null);
    setSelectedCategoryId('');
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', displayName: '', color: 'blue' });
    setEditingCategory(null);
  };

  // 키워드 추가 다이얼로그 열기
  const openAddKeywordDialog = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setEditingKeyword(null);
    setKeywordForm({ keyword: '', isActive: true });
    setIsKeywordDialogOpen(true);
  };

  // 키워드 수정 다이얼로그 열기
  const openEditKeywordDialog = (keyword: Keyword, categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setEditingKeyword(keyword);
    setKeywordForm({ keyword: keyword.keyword, isActive: keyword.isActive });
    setIsKeywordDialogOpen(true);
  };

  // 카테고리 수정 다이얼로그 열기
  const openEditCategoryDialog = (category: KeywordCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      displayName: category.displayName,
      color: category.color,
    });
    setIsCategoryDialogOpen(true);
  };

  // 삭제 확인 다이얼로그 열기
  const openDeleteDialog = (type: 'keyword' | 'category', id: string, name: string) => {
    setDeletingItem({ type, id, name });
    setIsDeleteDialogOpen(true);
  };

  // 키워드 저장
  const handleSaveKeyword = () => {
    if (!keywordForm.keyword.trim()) {
      toast.error('키워드를 입력해주세요');
      return;
    }

    if (editingKeyword) {
      updateKeywordMutation.mutate({
        id: editingKeyword.id,
        data: { keyword: keywordForm.keyword, isActive: keywordForm.isActive },
      });
    } else {
      createKeywordMutation.mutate({
        categoryId: selectedCategoryId,
        keyword: keywordForm.keyword,
        isActive: keywordForm.isActive,
      });
    }
  };

  // 카테고리 저장
  const handleSaveCategory = () => {
    if (!categoryForm.displayName.trim()) {
      toast.error('표시 이름을 입력해주세요');
      return;
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        data: { displayName: categoryForm.displayName, color: categoryForm.color },
      });
    } else {
      if (!categoryForm.name.trim()) {
        toast.error('카테고리 이름을 입력해주세요');
        return;
      }
      createCategoryMutation.mutate(categoryForm);
    }
  };

  // 삭제 실행
  const handleDelete = () => {
    if (!deletingItem) return;

    if (deletingItem.type === 'keyword') {
      deleteKeywordMutation.mutate(deletingItem.id);
    } else {
      deleteCategoryMutation.mutate(deletingItem.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#0052CC]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-500">키워드를 불러오는데 실패했습니다.</p>
      </div>
    );
  }

  const categories = data?.data?.categories || [];
  const totalKeywords = data?.data?.totalKeywords || 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">키워드 관리</h1>
          <p className="text-gray-600 mt-1">
            고객 등록 시 선택 가능한 키워드를 관리합니다. 총 {totalKeywords}개 키워드
          </p>
        </div>
        <Button onClick={() => setIsCategoryDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          카테고리 추가
        </Button>
      </div>

      {/* 카테고리 목록 */}
      <div className="grid gap-6">
        {categories.map(category => (
          <Card key={category.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${colorMap[category.color]}`} />
                  <div>
                    <CardTitle className="text-lg">{category.displayName}</CardTitle>
                    <CardDescription>
                      {category.name} · {category.keywords?.length || 0}개 키워드
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAddKeywordDialog(category.id)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    키워드 추가
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditCategoryDialog(category)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => openDeleteDialog('category', category.id, category.displayName)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {category.keywords?.map(keyword => (
                  <Badge
                    key={keyword.id}
                    variant="outline"
                    className={`cursor-pointer group ${
                      keyword.isActive
                        ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                        : 'border-gray-200 text-gray-400 bg-gray-50'
                    }`}
                  >
                    <GripVertical className="w-3 h-3 mr-1 opacity-50" />
                    {keyword.keyword}
                    <button
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-700"
                      onClick={() => openEditKeywordDialog(keyword, category.id)}
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-500"
                      onClick={() => openDeleteDialog('keyword', keyword.id, keyword.keyword)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {(!category.keywords || category.keywords.length === 0) && (
                  <p className="text-gray-400 text-sm">키워드가 없습니다</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {categories.length === 0 && (
          <Card className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Tags className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">카테고리가 없습니다</h3>
              <p className="text-gray-500 mb-4">새 카테고리를 추가해주세요</p>
              <Button onClick={() => setIsCategoryDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                카테고리 추가
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* 키워드 추가/수정 다이얼로그 */}
      <Dialog open={isKeywordDialogOpen} onOpenChange={setIsKeywordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingKeyword ? '키워드 수정' : '키워드 추가'}</DialogTitle>
            <DialogDescription>
              {editingKeyword ? '키워드 정보를 수정합니다.' : '새로운 키워드를 추가합니다.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="keyword">키워드</Label>
              <Input
                id="keyword"
                value={keywordForm.keyword}
                onChange={e => setKeywordForm(prev => ({ ...prev, keyword: e.target.value }))}
                placeholder="키워드를 입력하세요"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">활성화</Label>
              <Switch
                id="isActive"
                checked={keywordForm.isActive}
                onCheckedChange={checked =>
                  setKeywordForm(prev => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsKeywordDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleSaveKeyword}
              disabled={createKeywordMutation.isPending || updateKeywordMutation.isPending}
            >
              {(createKeywordMutation.isPending || updateKeywordMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 카테고리 추가/수정 다이얼로그 */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? '카테고리 수정' : '카테고리 추가'}</DialogTitle>
            <DialogDescription>
              {editingCategory
                ? '카테고리 정보를 수정합니다.'
                : '새로운 키워드 카테고리를 추가합니다.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingCategory && (
              <div className="space-y-2">
                <Label htmlFor="name">카테고리 이름 (영문)</Label>
                <Input
                  id="name"
                  value={categoryForm.name}
                  onChange={e =>
                    setCategoryForm(prev => ({ ...prev, name: e.target.value.toLowerCase() }))
                  }
                  placeholder="예: challenges, goals"
                  pattern="[a-z_]+"
                />
                <p className="text-xs text-gray-500">영문 소문자와 언더스코어만 사용 가능</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="displayName">표시 이름</Label>
              <Input
                id="displayName"
                value={categoryForm.displayName}
                onChange={e => setCategoryForm(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="예: 도전과제, 목표"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">색상</Label>
              <Select
                value={categoryForm.color}
                onValueChange={value => setCategoryForm(prev => ({ ...prev, color: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="색상 선택" />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${option.className}`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleSaveCategory}
              disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
            >
              {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deletingItem?.type === 'category' ? '카테고리 삭제' : '키워드 삭제'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletingItem?.type === 'category'
                ? `"${deletingItem?.name}" 카테고리와 해당 카테고리의 모든 키워드가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`
                : `"${deletingItem?.name}" 키워드를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={deleteKeywordMutation.isPending || deleteCategoryMutation.isPending}
            >
              {(deleteKeywordMutation.isPending || deleteCategoryMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
