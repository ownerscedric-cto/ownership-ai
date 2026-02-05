'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Pencil,
  Trash2,
  MessageSquare,
  Loader2,
  EyeOff,
  ArrowLeft,
  Variable,
} from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  useAdminCopySnippets,
  useCreateSnippet,
  useUpdateSnippet,
  useDeleteSnippet,
  type CopySnippet,
} from '@/hooks/useCopySnippets';
import { useTemplateVariables } from '@/hooks/useTemplateVariables';
import { VariableAutocompleteTextarea } from '@/components/admin/VariableAutocompleteTextarea';

// 카테고리 옵션
const CATEGORY_OPTIONS = [
  { value: 'greeting', label: '인사말', color: 'bg-green-100 text-green-800' },
  { value: 'footer', label: '마무리', color: 'bg-blue-100 text-blue-800' },
  { value: 'alert', label: '알림', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'etc', label: '기타', color: 'bg-gray-100 text-gray-800' },
];

interface SnippetFormData {
  name: string;
  content: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}

const initialFormData: SnippetFormData = {
  name: '',
  content: '',
  category: 'greeting',
  sortOrder: 0,
  isActive: true,
};

export default function CopySnippetsManagementPage() {
  // 다이얼로그 상태
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<CopySnippet | null>(null);
  const [deletingSnippet, setDeletingSnippet] = useState<CopySnippet | null>(null);

  // 폼 상태
  const [formData, setFormData] = useState<SnippetFormData>(initialFormData);

  // React Query 훅
  const { data, isLoading, error } = useAdminCopySnippets();
  const { data: variablesData } = useTemplateVariables();
  const createMutation = useCreateSnippet();
  const updateMutation = useUpdateSnippet();
  const deleteMutation = useDeleteSnippet();

  const snippets = data?.data || [];
  const variables = variablesData?.data || [];

  // 폼 리셋
  const resetForm = () => {
    setFormData(initialFormData);
    setEditingSnippet(null);
  };

  // 추가 다이얼로그 열기
  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // 수정 다이얼로그 열기
  const openEditDialog = (snippet: CopySnippet) => {
    setEditingSnippet(snippet);
    setFormData({
      name: snippet.name,
      content: snippet.content,
      category: snippet.category || 'etc',
      sortOrder: snippet.sortOrder,
      isActive: snippet.isActive,
    });
    setIsDialogOpen(true);
  };

  // 삭제 다이얼로그 열기
  const openDeleteDialog = (snippet: CopySnippet) => {
    setDeletingSnippet(snippet);
    setIsDeleteDialogOpen(true);
  };

  // 저장 핸들러
  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('스니펫 이름을 입력해주세요');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('스니펫 내용을 입력해주세요');
      return;
    }

    if (editingSnippet) {
      updateMutation.mutate(
        { id: editingSnippet.id, data: formData },
        {
          onSuccess: res => {
            if (res.success) {
              toast.success('스니펫이 수정되었습니다');
              setIsDialogOpen(false);
              resetForm();
            } else {
              toast.error(res.error?.message || '수정 실패');
            }
          },
          onError: (error: Error) => {
            toast.error(error.message);
          },
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: res => {
          if (res.success) {
            toast.success('스니펫이 생성되었습니다');
            setIsDialogOpen(false);
            resetForm();
          } else {
            toast.error(res.error?.message || '생성 실패');
          }
        },
        onError: (error: Error) => {
          toast.error(error.message);
        },
      });
    }
  };

  // 삭제 핸들러
  const handleDelete = () => {
    if (!deletingSnippet) return;

    deleteMutation.mutate(deletingSnippet.id, {
      onSuccess: () => {
        toast.success('스니펫이 삭제되었습니다');
        setIsDeleteDialogOpen(false);
        setDeletingSnippet(null);
      },
      onError: (error: Error) => {
        toast.error(error.message);
      },
    });
  };

  // 카테고리별 그룹핑
  const groupedSnippets = snippets.reduce(
    (acc, snippet) => {
      const category = snippet.category || 'etc';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(snippet);
      return acc;
    },
    {} as Record<string, CopySnippet[]>
  );

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
        <p className="text-red-500">스니펫을 불러오는데 실패했습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/settings/copy-templates">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              템플릿으로 돌아가기
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">자주 쓰는 문구 (스니펫)</h1>
          <p className="text-gray-600 mt-1">
            템플릿 작성 시 자주 사용하는 문구를 저장하고 빠르게 삽입할 수 있습니다.
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-2" />
          스니펫 추가
        </Button>
      </div>

      {/* 변수 안내 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-blue-800">
              스니펫에서도 템플릿 변수를 사용할 수 있습니다
            </CardTitle>
            <Link href="/admin/settings/template-variables">
              <Button variant="ghost" size="sm" className="text-blue-700 hover:text-blue-900">
                <Variable className="w-3 h-3 mr-1" />
                변수 관리
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 text-sm text-blue-700">
            {variables.map((variable, idx) => (
              <span key={variable.id} className="flex items-center gap-1">
                {idx > 0 && <span className="text-blue-400">|</span>}
                <code className="bg-blue-100 px-1 rounded">{`{{${variable.name}}}`}</code>
                <span>{variable.displayName}</span>
                {!variable.isSystem && (
                  <span className="text-blue-500 text-xs">({variable.value})</span>
                )}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 스니펫 목록 (카테고리별) */}
      {Object.entries(groupedSnippets).length === 0 ? (
        <Card className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">스니펫이 없습니다</h3>
            <p className="text-gray-500 mb-4">자주 사용하는 문구를 추가해주세요</p>
            <Button onClick={openAddDialog}>
              <Plus className="w-4 h-4 mr-2" />
              스니펫 추가
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {CATEGORY_OPTIONS.map(categoryOption => {
            const categorySnippets = groupedSnippets[categoryOption.value];
            if (!categorySnippets || categorySnippets.length === 0) return null;

            return (
              <div key={categoryOption.value}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={categoryOption.color}>{categoryOption.label}</Badge>
                  <span className="text-sm text-gray-500">{categorySnippets.length}개</span>
                </div>
                <div className="grid gap-3">
                  {categorySnippets.map(snippet => (
                    <Card key={snippet.id} className={!snippet.isActive ? 'opacity-60' : ''}>
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <MessageSquare className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-base">{snippet.name}</CardTitle>
                                {!snippet.isActive && (
                                  <Badge variant="outline" className="text-gray-500">
                                    <EyeOff className="w-3 h-3 mr-1" />
                                    비활성
                                  </Badge>
                                )}
                              </div>
                              <CardDescription className="mt-1 line-clamp-2">
                                {snippet.content}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(snippet)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => openDeleteDialog(snippet)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 추가/수정 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSnippet ? '스니펫 수정' : '스니펫 추가'}</DialogTitle>
            <DialogDescription>
              {editingSnippet ? '스니펫 정보를 수정합니다.' : '자주 사용하는 문구를 추가합니다.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="예: 기본 인사말"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <Select
                  value={formData.category}
                  onValueChange={value => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">내용 *</Label>
              <VariableAutocompleteTextarea
                id="content"
                value={formData.content}
                onChange={value => setFormData(prev => ({ ...prev, content: value }))}
                variables={variables}
                placeholder="안녕하세요! {{customerName}}님 ({{ 입력 시 변수 자동완성)"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sortOrder">정렬 순서</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))
                  }
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={checked => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">활성화</Label>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
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
            <AlertDialogTitle>스니펫 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deletingSnippet?.name}&quot; 스니펫을 삭제하시겠습니까? 이 작업은 되돌릴 수
              없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
