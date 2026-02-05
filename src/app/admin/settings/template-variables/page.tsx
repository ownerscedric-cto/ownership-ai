'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Pencil,
  Trash2,
  Variable,
  Loader2,
  EyeOff,
  ArrowLeft,
  Lock,
  Copy,
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
import { toast } from 'sonner';
import {
  useAdminTemplateVariables,
  useCreateVariable,
  useUpdateVariable,
  useDeleteVariable,
  type TemplateVariable,
} from '@/hooks/useTemplateVariables';

interface VariableFormData {
  name: string;
  displayName: string;
  value: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

const initialFormData: VariableFormData = {
  name: '',
  displayName: '',
  value: '',
  description: '',
  sortOrder: 100,
  isActive: true,
};

export default function TemplateVariablesManagementPage() {
  // 다이얼로그 상태
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingVariable, setEditingVariable] = useState<TemplateVariable | null>(null);
  const [deletingVariable, setDeletingVariable] = useState<TemplateVariable | null>(null);

  // 폼 상태
  const [formData, setFormData] = useState<VariableFormData>(initialFormData);

  // React Query 훅
  const { data, isLoading, error } = useAdminTemplateVariables();
  const createMutation = useCreateVariable();
  const updateMutation = useUpdateVariable();
  const deleteMutation = useDeleteVariable();

  const variables = data?.data || [];
  const systemVariables = variables.filter(v => v.isSystem);
  const customVariables = variables.filter(v => !v.isSystem);

  // 폼 리셋
  const resetForm = () => {
    setFormData(initialFormData);
    setEditingVariable(null);
  };

  // 추가 다이얼로그 열기
  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // 수정 다이얼로그 열기
  const openEditDialog = (variable: TemplateVariable) => {
    if (variable.isSystem) {
      toast.error('시스템 변수는 수정할 수 없습니다');
      return;
    }
    setEditingVariable(variable);
    setFormData({
      name: variable.name,
      displayName: variable.displayName,
      value: variable.value,
      description: variable.description || '',
      sortOrder: variable.sortOrder,
      isActive: variable.isActive,
    });
    setIsDialogOpen(true);
  };

  // 삭제 다이얼로그 열기
  const openDeleteDialog = (variable: TemplateVariable) => {
    if (variable.isSystem) {
      toast.error('시스템 변수는 삭제할 수 없습니다');
      return;
    }
    setDeletingVariable(variable);
    setIsDeleteDialogOpen(true);
  };

  // 변수명 복사
  const copyVariableName = (name: string) => {
    navigator.clipboard.writeText(`{{${name}}}`);
    toast.success(`{{${name}}} 복사됨`);
  };

  // 저장 핸들러
  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('변수명을 입력해주세요');
      return;
    }
    if (!formData.displayName.trim()) {
      toast.error('표시명을 입력해주세요');
      return;
    }
    if (!formData.value.trim()) {
      toast.error('값을 입력해주세요');
      return;
    }

    // 변수명 형식 체크
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(formData.name)) {
      toast.error('변수명은 영문자로 시작하고 영문자/숫자만 사용 가능합니다');
      return;
    }

    if (editingVariable) {
      updateMutation.mutate(
        {
          id: editingVariable.id,
          data: {
            displayName: formData.displayName,
            value: formData.value,
            description: formData.description || null,
            sortOrder: formData.sortOrder,
            isActive: formData.isActive,
          },
        },
        {
          onSuccess: res => {
            if (res.success) {
              toast.success('변수가 수정되었습니다');
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
            toast.success('변수가 생성되었습니다');
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
    if (!deletingVariable) return;

    deleteMutation.mutate(deletingVariable.id, {
      onSuccess: () => {
        toast.success('변수가 삭제되었습니다');
        setIsDeleteDialogOpen(false);
        setDeletingVariable(null);
      },
      onError: (error: Error) => {
        toast.error(error.message);
      },
    });
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
        <p className="text-red-500">변수를 불러오는데 실패했습니다.</p>
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
          <h1 className="text-3xl font-bold text-gray-900">템플릿 변수 관리</h1>
          <p className="text-gray-600 mt-1">
            템플릿에서 사용할 수 있는 변수를 관리합니다. 시스템 변수는 수정/삭제할 수 없습니다.
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-2" />
          변수 추가
        </Button>
      </div>

      {/* 시스템 변수 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Badge className="bg-gray-100 text-gray-800">
            <Lock className="w-3 h-3 mr-1" />
            시스템 변수
          </Badge>
          <span className="text-sm text-gray-500">
            {systemVariables.length}개 (자동으로 값이 대체됩니다)
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {systemVariables.map(variable => (
            <Card key={variable.id} className="bg-gray-50">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Variable className="w-4 h-4 text-gray-400" />
                    <CardTitle className="text-sm font-mono">
                      {'{{'}
                      {variable.name}
                      {'}}'}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyVariableName(variable.name)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <CardDescription className="text-xs">{variable.displayName}</CardDescription>
                {variable.description && (
                  <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* 커스텀 변수 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Badge className="bg-blue-100 text-blue-800">커스텀 변수</Badge>
          <span className="text-sm text-gray-500">
            {customVariables.length}개 (설정한 값으로 대체됩니다)
          </span>
        </div>

        {customVariables.length === 0 ? (
          <Card className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Variable className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">커스텀 변수가 없습니다</h3>
              <p className="text-gray-500 mb-4">자주 사용하는 값을 변수로 추가해보세요</p>
              <Button onClick={openAddDialog}>
                <Plus className="w-4 h-4 mr-2" />
                변수 추가
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {customVariables.map(variable => (
              <Card key={variable.id} className={!variable.isActive ? 'opacity-60' : ''}>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Variable className="w-4 h-4 text-blue-500" />
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-mono">
                            {'{{'}
                            {variable.name}
                            {'}}'}
                          </CardTitle>
                          <span className="text-sm text-gray-500">→</span>
                          <span className="text-sm font-medium text-gray-700">
                            {variable.value}
                          </span>
                          {!variable.isActive && (
                            <Badge variant="outline" className="text-gray-500">
                              <EyeOff className="w-3 h-3 mr-1" />
                              비활성
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {variable.displayName}
                          {variable.description && ` - ${variable.description}`}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyVariableName(variable.name)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(variable)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => openDeleteDialog(variable)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 추가/수정 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingVariable ? '변수 수정' : '변수 추가'}</DialogTitle>
            <DialogDescription>
              {editingVariable
                ? '커스텀 변수 정보를 수정합니다.'
                : '템플릿에서 사용할 커스텀 변수를 추가합니다.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">변수명 * (영문)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="예: consultantName"
                  disabled={!!editingVariable}
                />
                {formData.name && (
                  <p className="text-xs text-gray-500">
                    사용 시:{' '}
                    <code className="bg-gray-100 px-1 rounded">{`{{${formData.name}}}`}</code>
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">표시명 *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={e => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="예: 컨설턴트명"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">값 *</Label>
              <Input
                id="value"
                value={formData.value}
                onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder="예: 홍길동"
              />
              <p className="text-xs text-gray-500">이 값이 템플릿의 변수 위치에 삽입됩니다</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명 (선택)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="변수에 대한 설명"
                rows={2}
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
                  placeholder="100"
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
            <AlertDialogTitle>변수 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <code className="bg-gray-100 px-1 rounded">{`{{${deletingVariable?.name}}}`}</code>{' '}
              변수를 삭제하시겠습니까? 이 변수를 사용하는 템플릿에서 값이 대체되지 않습니다.
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
