'use client';

import { useState, useEffect } from 'react';
import { Copy, FileText, Star, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  useCopyTemplates,
  type CopyTemplateListItem,
  type TemplateUsageType,
} from '@/lib/hooks/useCopyTemplates';
import { useTemplateVariables } from '@/hooks/useTemplateVariables';
import {
  formatProgramsWithTemplate,
  type CopyTemplateData,
  type CustomVariable,
} from '@/lib/utils/programTextFormatter';
import type { WatchlistProgram } from '@/lib/hooks/useWatchlist';
import type { Program } from '@/lib/types/program';

interface TemplateSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programs: (WatchlistProgram | Program)[];
  customerName?: string;
  onCopySuccess?: () => void;
  /** 템플릿 용도 필터 - customer: 고객용, internal: 사내용 */
  usageType?: TemplateUsageType;
}

/**
 * 텍스트 복사 템플릿 선택 다이얼로그
 *
 * 사용자가 템플릿을 선택하고 미리보기를 확인한 후 클립보드에 복사
 */
export function TemplateSelectDialog({
  open,
  onOpenChange,
  programs,
  customerName,
  onCopySuccess,
  usageType,
}: TemplateSelectDialogProps) {
  // 다이얼로그가 열릴 때만 템플릿 조회
  const { data: templates, isLoading, error, refetch } = useCopyTemplates(usageType);
  // 커스텀 변수 조회
  const { data: variablesData } = useTemplateVariables();

  // 다이얼로그 열릴 때 데이터 새로고침
  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [previewText, setPreviewText] = useState<string>('');
  const [isCopying, setIsCopying] = useState(false);

  // 기본 템플릿 자동 선택
  useEffect(() => {
    if (templates && templates.length > 0 && !selectedTemplateId) {
      const defaultTemplate = templates.find(t => t.isDefault) || templates[0];
      setSelectedTemplateId(defaultTemplate.id);
    }
  }, [templates, selectedTemplateId]);

  // 미리보기 업데이트
  useEffect(() => {
    if (!templates || !selectedTemplateId || programs.length === 0) {
      setPreviewText('');
      return;
    }

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    if (!selectedTemplate) {
      setPreviewText('');
      return;
    }

    const templateData: CopyTemplateData = {
      headerTemplate: selectedTemplate.headerTemplate,
      itemTemplate: selectedTemplate.itemTemplate,
      footerTemplate: selectedTemplate.footerTemplate,
    };

    // 커스텀 변수 추출 (시스템 변수 제외)
    const customVariables: CustomVariable[] = (variablesData?.data || [])
      .filter(v => !v.isSystem)
      .map(v => ({ name: v.name, value: v.value }));

    const text = formatProgramsWithTemplate(programs, templateData, {
      customerName,
      customVariables,
    });
    setPreviewText(text);
  }, [templates, selectedTemplateId, programs, customerName, variablesData]);

  // 복사 핸들러
  const handleCopy = async () => {
    if (!previewText) {
      toast.error('복사할 내용이 없습니다');
      return;
    }

    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(previewText);
      toast.success(`${programs.length}개의 프로그램 정보가 복사되었습니다`);
      onCopySuccess?.();
      onOpenChange(false);
    } catch {
      toast.error('클립보드 복사에 실패했습니다');
    } finally {
      setIsCopying(false);
    }
  };

  // 다이얼로그가 닫힐 때 상태 초기화
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedTemplateId('');
      setPreviewText('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            템플릿 선택
          </DialogTitle>
          <DialogDescription>
            복사할 템플릿을 선택하세요. 선택한 {programs.length}개의 프로그램이 적용됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          {/* 템플릿 선택 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">템플릿 선택</Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : templates && templates.length > 0 ? (
              <RadioGroup
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
                className="grid gap-2"
              >
                {templates.map((template: CopyTemplateListItem) => (
                  <div
                    key={template.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedTemplateId === template.id
                        ? 'border-[#0052CC] bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedTemplateId(template.id)}
                  >
                    <RadioGroupItem value={template.id} id={template.id} />
                    <Label
                      htmlFor={template.id}
                      className="flex-1 cursor-pointer flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{template.name}</span>
                      {template.isDefault && (
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      )}
                      {template.description && (
                        <span className="text-gray-500 text-sm">- {template.description}</span>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="text-center py-4 text-gray-500">사용 가능한 템플릿이 없습니다</div>
            )}
          </div>

          {/* 미리보기 */}
          <div className="flex-1 min-h-0 flex flex-col space-y-2">
            <Label className="text-sm font-medium">미리보기</Label>
            <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 border">
              {previewText ? (
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                  {previewText}
                </pre>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  템플릿을 선택하면 미리보기가 표시됩니다
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleCopy} disabled={!previewText || isCopying}>
            {isCopying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                복사 중...
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                클립보드에 복사
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
