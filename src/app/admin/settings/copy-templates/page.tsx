'use client';

import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  FileText,
  Loader2,
  Star,
  EyeOff,
  ChevronDown,
  ChevronUp,
  MessageSquarePlus,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAdminCopyTemplates,
  useCreateCopyTemplate,
  useUpdateCopyTemplate,
  useDeleteCopyTemplate,
  type CopyTemplate,
  type CreateTemplateInput,
  type UpdateTemplateInput,
  type TemplateUsageType,
} from '@/lib/hooks/useCopyTemplates';
import { SnippetPicker } from '@/components/admin/SnippetPicker';
import { VariableAutocompleteTextarea } from '@/components/admin/VariableAutocompleteTextarea';
import { useTemplateVariables } from '@/hooks/useTemplateVariables';
import Link from 'next/link';

// 용도 라벨
const USAGE_TYPE_LABELS: Record<
  TemplateUsageType,
  { label: string; description: string; color: string }
> = {
  customer: {
    label: '고객용',
    description: '컨설턴트가 고객에게 보낼 때 사용',
    color: 'bg-green-100 text-green-800',
  },
  internal: {
    label: '사내용',
    description: '관리자가 사내 공유할 때 사용',
    color: 'bg-purple-100 text-purple-800',
  },
  all: {
    label: '모든 용도',
    description: '모든 곳에서 사용 가능',
    color: 'bg-blue-100 text-blue-800',
  },
};

// 샘플 데이터 (미리보기용)
const sampleData = {
  customerName: '홍길동',
  programs: [
    {
      index: 1,
      title: '2024년 창업지원사업',
      dataSource: '중소벤처기업부',
      deadline: '2024-12-31',
      category: '창업지원',
      sourceUrl: 'https://example.com/1',
      registeredAt: '2024-01-15',
    },
    {
      index: 2,
      title: '스마트공장 구축지원',
      dataSource: '산업통상자원부',
      deadline: '2024-11-30',
      category: '기술개발',
      sourceUrl: 'https://example.com/2',
      registeredAt: '2024-01-10',
    },
    {
      index: 3,
      title: '수출바우처사업',
      dataSource: 'KOTRA',
      deadline: '2024-10-31',
      category: '수출지원',
      sourceUrl: 'https://example.com/3',
      registeredAt: '2024-01-05',
    },
  ],
  totalCount: 3,
};

// 커스텀 변수 타입
interface CustomVariable {
  name: string;
  value: string;
}

// 커스텀 변수 치환 함수
function applyCustomVariables(template: string, customVariables: CustomVariable[]): string {
  let result = template;
  customVariables.forEach(variable => {
    const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
    result = result.replace(regex, variable.value);
  });
  return result;
}

// 템플릿 변수 치환 함수
function applyTemplateVariables(
  template: string,
  data: typeof sampleData,
  customVariables: CustomVariable[] = []
): string {
  let result = template;
  // 시스템 변수 치환
  result = result.replace(/\{\{customerName\}\}/g, data.customerName);
  result = result.replace(/\{\{totalCount\}\}/g, String(data.totalCount));
  // 커스텀 변수 치환
  result = applyCustomVariables(result, customVariables);
  return result;
}

// 아이템 템플릿 변수 치환 함수
function applyItemTemplateVariables(
  template: string,
  item: (typeof sampleData.programs)[0],
  customVariables: CustomVariable[] = []
): string {
  let result = template;
  // 시스템 변수 치환
  result = result.replace(/\{\{index\}\}/g, String(item.index));
  result = result.replace(/\{\{title\}\}/g, item.title);
  result = result.replace(/\{\{dataSource\}\}/g, item.dataSource);
  result = result.replace(/\{\{deadline\}\}/g, item.deadline);
  result = result.replace(/\{\{category\}\}/g, item.category);
  result = result.replace(/\{\{sourceUrl\}\}/g, item.sourceUrl);
  result = result.replace(/\{\{registeredAt\}\}/g, item.registeredAt);
  // 커스텀 변수 치환
  result = applyCustomVariables(result, customVariables);
  return result;
}

// 미리보기 생성 함수
function generatePreview(
  template: CopyTemplate | Omit<CopyTemplate, 'id' | 'createdAt' | 'updatedAt'>,
  customVariables: CustomVariable[] = []
): string {
  const parts: string[] = [];

  if (template.headerTemplate) {
    parts.push(applyTemplateVariables(template.headerTemplate, sampleData, customVariables));
    parts.push('');
  }

  sampleData.programs.forEach(program => {
    parts.push(applyItemTemplateVariables(template.itemTemplate, program, customVariables));
    parts.push('');
  });

  if (template.footerTemplate) {
    parts.push(applyTemplateVariables(template.footerTemplate, sampleData, customVariables));
  }

  return parts.join('\n').trim();
}

interface TemplateFormData {
  name: string;
  description: string;
  headerTemplate: string;
  itemTemplate: string;
  footerTemplate: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  usageType: TemplateUsageType;
}

const initialFormData: TemplateFormData = {
  name: '',
  description: '',
  headerTemplate: '📢 {{customerName}}님께 추천하는 정부지원사업',
  itemTemplate: `{{index}}. {{title}}
   - 지원기관: {{dataSource}}
   - 신청기한: {{deadline}}
   - 분야: {{category}}
   - 상세보기: {{sourceUrl}}`,
  footerTemplate: '문의사항이 있으시면 언제든 연락주세요! 😊',
  isDefault: false,
  isActive: true,
  sortOrder: 0,
  usageType: 'all',
};

export default function CopyTemplatesManagementPage() {
  // 다이얼로그 상태
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CopyTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<CopyTemplate | null>(null);
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);

  // 폼 상태
  const [formData, setFormData] = useState<TemplateFormData>(initialFormData);

  // React Query 훅
  const { data: templates, isLoading, error } = useAdminCopyTemplates();
  const { data: variablesData } = useTemplateVariables();
  const createMutation = useCreateCopyTemplate();
  const updateMutation = useUpdateCopyTemplate();
  const deleteMutation = useDeleteCopyTemplate();

  // 변수 목록
  const variables = variablesData?.data || [];

  // 커스텀 변수 (미리보기용)
  const customVariables: CustomVariable[] = variables
    .filter(v => !v.isSystem)
    .map(v => ({ name: v.name, value: v.value }));

  // 폼 리셋
  const resetForm = () => {
    setFormData(initialFormData);
    setEditingTemplate(null);
  };

  // 추가 다이얼로그 열기
  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // 수정 다이얼로그 열기
  const openEditDialog = (template: CopyTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      headerTemplate: template.headerTemplate || '',
      itemTemplate: template.itemTemplate,
      footerTemplate: template.footerTemplate || '',
      isDefault: template.isDefault,
      isActive: template.isActive,
      sortOrder: template.sortOrder,
      usageType: template.usageType || 'all',
    });
    setIsDialogOpen(true);
  };

  // 삭제 다이얼로그 열기
  const openDeleteDialog = (template: CopyTemplate) => {
    setDeletingTemplate(template);
    setIsDeleteDialogOpen(true);
  };

  // 저장 핸들러
  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('템플릿 이름을 입력해주세요');
      return;
    }
    if (!formData.itemTemplate.trim()) {
      toast.error('아이템 템플릿을 입력해주세요');
      return;
    }

    if (editingTemplate) {
      const updateData: UpdateTemplateInput = {
        name: formData.name,
        description: formData.description || null,
        headerTemplate: formData.headerTemplate || null,
        itemTemplate: formData.itemTemplate,
        footerTemplate: formData.footerTemplate || null,
        isDefault: formData.isDefault,
        isActive: formData.isActive,
        sortOrder: formData.sortOrder,
        usageType: formData.usageType,
      };
      updateMutation.mutate(
        { id: editingTemplate.id, data: updateData },
        {
          onSuccess: () => {
            toast.success('템플릿이 수정되었습니다');
            setIsDialogOpen(false);
            resetForm();
          },
          onError: (error: Error) => {
            toast.error(error.message);
          },
        }
      );
    } else {
      const createData: CreateTemplateInput = {
        name: formData.name,
        description: formData.description || undefined,
        headerTemplate: formData.headerTemplate || undefined,
        itemTemplate: formData.itemTemplate,
        footerTemplate: formData.footerTemplate || undefined,
        isDefault: formData.isDefault,
        isActive: formData.isActive,
        sortOrder: formData.sortOrder,
        usageType: formData.usageType,
      };
      createMutation.mutate(createData, {
        onSuccess: () => {
          toast.success('템플릿이 생성되었습니다');
          setIsDialogOpen(false);
          resetForm();
        },
        onError: (error: Error) => {
          toast.error(error.message);
        },
      });
    }
  };

  // 삭제 핸들러
  const handleDelete = () => {
    if (!deletingTemplate) return;

    deleteMutation.mutate(deletingTemplate.id, {
      onSuccess: () => {
        toast.success('템플릿이 삭제되었습니다');
        setIsDeleteDialogOpen(false);
        setDeletingTemplate(null);
      },
      onError: (error: Error) => {
        toast.error(error.message);
      },
    });
  };

  // 토글 핸들러
  const toggleExpand = (templateId: string) => {
    setExpandedTemplateId(prev => (prev === templateId ? null : templateId));
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
        <p className="text-red-500">템플릿을 불러오는데 실패했습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">텍스트 복사 템플릿</h1>
          <p className="text-gray-600 mt-1">
            고객에게 정부지원사업을 안내할 때 사용하는 텍스트 템플릿을 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/settings/template-variables">
            <Button variant="outline">
              <Variable className="w-4 h-4 mr-2" />
              변수 관리
            </Button>
          </Link>
          <Link href="/admin/settings/copy-snippets">
            <Button variant="outline">
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              스니펫 관리
            </Button>
          </Link>
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            템플릿 추가
          </Button>
        </div>
      </div>

      {/* 템플릿 변수 설명 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-blue-800">
              사용 가능한 템플릿 변수
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
            {variables.map(variable => (
              <div key={variable.id} className="text-blue-700">
                <code className="bg-blue-100 px-1 rounded">{`{{${variable.name}}}`}</code>{' '}
                {variable.displayName}
                {!variable.isSystem && (
                  <span className="text-blue-500 text-xs ml-1">({variable.value})</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 템플릿 목록 */}
      <div className="grid gap-4">
        {templates?.map(template => (
          <Card key={template.id} className={!template.isActive ? 'opacity-60' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.isDefault && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1" />
                          기본
                        </Badge>
                      )}
                      {!template.isActive && (
                        <Badge variant="outline" className="text-gray-500">
                          <EyeOff className="w-3 h-3 mr-1" />
                          비활성
                        </Badge>
                      )}
                      {template.usageType && (
                        <Badge className={USAGE_TYPE_LABELS[template.usageType].color}>
                          {USAGE_TYPE_LABELS[template.usageType].label}
                        </Badge>
                      )}
                    </div>
                    {template.description && (
                      <CardDescription>{template.description}</CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleExpand(template.id)}>
                    {expandedTemplateId === template.id ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-1" />
                        접기
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-1" />
                        미리보기
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(template)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => openDeleteDialog(template)}
                    disabled={template.isDefault}
                    title={template.isDefault ? '기본 템플릿은 삭제할 수 없습니다' : '삭제'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {expandedTemplateId === template.id && (
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-500">미리보기</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(generatePreview(template, customVariables));
                        toast.success('미리보기가 클립보드에 복사되었습니다');
                      }}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      복사
                    </Button>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {generatePreview(template, customVariables)}
                  </pre>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {(!templates || templates.length === 0) && (
          <Card className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <FileText className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">템플릿이 없습니다</h3>
              <p className="text-gray-500 mb-4">새 템플릿을 추가해주세요</p>
              <Button onClick={openAddDialog}>
                <Plus className="w-4 h-4 mr-2" />
                템플릿 추가
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* 추가/수정 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? '템플릿 수정' : '템플릿 추가'}</DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? '템플릿 정보를 수정합니다.'
                : '새로운 텍스트 복사 템플릿을 추가합니다.'}
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="edit" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">편집</TabsTrigger>
              <TabsTrigger value="preview">미리보기</TabsTrigger>
            </TabsList>
            <TabsContent value="edit" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">템플릿 이름 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="예: 기본 템플릿, 카카오톡용"
                  />
                </div>
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="description">설명</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="템플릿에 대한 간단한 설명"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usageType">용도</Label>
                  <Select
                    value={formData.usageType}
                    onValueChange={(value: TemplateUsageType) =>
                      setFormData(prev => ({ ...prev, usageType: value }))
                    }
                  >
                    <SelectTrigger id="usageType">
                      <SelectValue placeholder="용도 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.entries(USAGE_TYPE_LABELS) as [
                          TemplateUsageType,
                          { label: string; description: string },
                        ][]
                      ).map(([value, { label, description }]) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex flex-col">
                            <span>{label}</span>
                            <span className="text-xs text-gray-500">{description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="headerTemplate">헤더 템플릿</Label>
                  <SnippetPicker
                    onInsert={content =>
                      setFormData(prev => ({
                        ...prev,
                        headerTemplate: prev.headerTemplate + content,
                      }))
                    }
                  />
                </div>
                <VariableAutocompleteTextarea
                  id="headerTemplate"
                  value={formData.headerTemplate}
                  onChange={value => setFormData(prev => ({ ...prev, headerTemplate: value }))}
                  variables={variables}
                  placeholder="메시지 상단에 표시될 내용 ({{ 입력 시 변수 자동완성)"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="itemTemplate">아이템 템플릿 * (각 프로그램마다 반복)</Label>
                  <SnippetPicker
                    onInsert={content =>
                      setFormData(prev => ({
                        ...prev,
                        itemTemplate: prev.itemTemplate + content,
                      }))
                    }
                  />
                </div>
                <VariableAutocompleteTextarea
                  id="itemTemplate"
                  value={formData.itemTemplate}
                  onChange={value => setFormData(prev => ({ ...prev, itemTemplate: value }))}
                  variables={variables}
                  placeholder="각 프로그램에 적용될 템플릿 ({{ 입력 시 변수 자동완성)"
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="footerTemplate">푸터 템플릿</Label>
                  <SnippetPicker
                    onInsert={content =>
                      setFormData(prev => ({
                        ...prev,
                        footerTemplate: prev.footerTemplate + content,
                      }))
                    }
                  />
                </div>
                <VariableAutocompleteTextarea
                  id="footerTemplate"
                  value={formData.footerTemplate}
                  onChange={value => setFormData(prev => ({ ...prev, footerTemplate: value }))}
                  variables={variables}
                  placeholder="메시지 하단에 표시될 내용 ({{ 입력 시 변수 자동완성)"
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={checked =>
                      setFormData(prev => ({ ...prev, isDefault: checked }))
                    }
                  />
                  <Label htmlFor="isDefault">기본 템플릿으로 설정</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={checked =>
                      setFormData(prev => ({ ...prev, isActive: checked }))
                    }
                  />
                  <Label htmlFor="isActive">활성화</Label>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="preview" className="mt-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                  {generatePreview(formData as CopyTemplate, customVariables)}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
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
            <AlertDialogTitle>템플릿 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deletingTemplate?.name}&quot; 템플릿을 삭제하시겠습니까? 이 작업은 되돌릴 수
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
