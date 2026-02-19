'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Upload, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import { type PostFormData, type KnowHowCategory } from '@/hooks/useEducation';
import { flattenCategories } from '@/lib/category-utils';

// 게시글 작성 스키마
const postFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(100, '제목은 100자 이내로 작성해주세요'),
  content: z
    .string()
    .min(10, '내용은 최소 10자 이상 입력해주세요')
    .max(5000, '내용은 5000자 이내로 작성해주세요'),
  categoryId: z.string().min(1, '카테고리를 선택해주세요'),
  isAnnouncement: z.boolean().optional(),
  isEvent: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

interface KnowHowPostFormProps {
  categories: KnowHowCategory[];
  onSubmit: (data: PostFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<PostFormData>;
  showAdminOptions?: boolean; // 관리자 옵션 (공지, 이벤트) 표시 여부
}

/**
 * 노하우 커뮤니티 게시글 작성/수정 폼
 * - react-hook-form + Zod 검증
 * - 제목, 내용, 카테고리, 작성자 필드
 * - 공지/이벤트 설정 (관리자용)
 * - 이미지/파일 업로드 기능
 * - 로딩 상태 표시
 */
export function KnowHowPostForm({
  categories,
  onSubmit,
  onCancel,
  isSubmitting = false,
  defaultValues,
  showAdminOptions = false,
}: KnowHowPostFormProps) {
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; name: string }>>(
    defaultValues?.fileUrls?.map((url, i) => ({
      url,
      name: defaultValues.fileNames?.[i] || '파일',
    })) || []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [content, setContent] = useState(defaultValues?.content || '');

  // 계층형 카테고리를 플랫 리스트로 변환
  const flatCategories = flattenCategories(categories);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PostFormData>({
    resolver: zodResolver(postFormSchema),
    defaultValues: defaultValues || {
      title: '',
      content: '',
      categoryId: '',
      isAnnouncement: false,
      isEvent: false,
      startDate: '',
      endDate: '',
    },
  });

  const categoryId = watch('categoryId');
  const isAnnouncement = watch('isAnnouncement');
  const isEvent = watch('isEvent');
  const startDate = watch('startDate');
  const endDate = watch('endDate');

  // 파일 업로드
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('파일 크기는 10MB 이하여야 합니다');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'file');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('File upload failed');
      }

      const data = await res.json();
      setUploadedFiles(prev => [...prev, { url: data.data.url, name: data.data.fileName }]);

      toast.success('파일 업로드 성공', {
        description: `${data.data.fileName}이(가) 업로드되었습니다.`,
      });

      // 파일 input 초기화
      e.target.value = '';
    } catch (error) {
      toast.error('파일 업로드 실패', {
        description: error instanceof Error ? error.message : '다시 시도해주세요.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // 파일 제거
  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (data: PostFormData) => {
    // 이벤트인 경우 시작일/종료일 필수 검증
    if (data.isEvent) {
      if (!data.startDate || !data.endDate) {
        toast.error('이벤트는 시작일과 종료일이 필수입니다');
        return;
      }
    }

    try {
      await onSubmit({
        ...data,
        content, // TiptapEditor의 최신 content 사용
        fileUrls: uploadedFiles.map(f => f.url),
        fileNames: uploadedFiles.map(f => f.name),
      });
    } catch (error) {
      console.error('게시글 작성 실패:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{defaultValues ? '게시글 수정' : '게시글 작성'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                placeholder="게시글 제목을 입력하세요"
                disabled={isSubmitting}
                {...register('title')}
              />
              {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
            </div>

            {/* 카테고리 */}
            <div className="space-y-2">
              <Label htmlFor="categoryId">카테고리 *</Label>
              <Select
                value={categoryId || undefined}
                onValueChange={value => setValue('categoryId', value)}
                disabled={isSubmitting || isAnnouncement || isEvent}
              >
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {flatCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-red-600">{errors.categoryId.message}</p>
              )}
              {(isAnnouncement || isEvent) && (
                <p className="text-sm text-gray-500">
                  {isAnnouncement ? '공지사항' : '이벤트'}은 카테고리를 변경할 수 없습니다.
                </p>
              )}
            </div>

            {/* 공지/이벤트 옵션 (관리자용) */}
            {showAdminOptions && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                <Label className="text-sm font-medium text-gray-700">게시글 유형</Label>
                <div className="flex items-center gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isAnnouncement"
                      checked={isAnnouncement}
                      onCheckedChange={checked => {
                        setValue('isAnnouncement', checked === true);
                        // 공지로 설정하면 이벤트 해제
                        if (checked) {
                          setValue('isEvent', false);
                        }
                      }}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="isAnnouncement" className="text-sm font-normal cursor-pointer">
                      공지사항으로 등록
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isEvent"
                      checked={isEvent}
                      onCheckedChange={checked => {
                        setValue('isEvent', checked === true);
                        // 이벤트로 설정하면 공지 해제
                        if (checked) {
                          setValue('isAnnouncement', false);
                        }
                      }}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="isEvent" className="text-sm font-normal cursor-pointer">
                      이벤트로 등록
                    </Label>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  공지사항은 목록 상단에 고정되며, 이벤트는 이벤트 탭에서 확인할 수 있습니다.
                </p>

                {/* 공지/이벤트 일정 선택 */}
                {(isAnnouncement || isEvent) && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">
                        시작일 {isEvent && <span className="text-red-500">*</span>}
                        {isAnnouncement && (
                          <span className="text-xs text-gray-500 ml-1">(선택)</span>
                        )}
                      </Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        value={startDate || ''}
                        onChange={e => setValue('startDate', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">
                        종료일 {isEvent && <span className="text-red-500">*</span>}
                        {isAnnouncement && (
                          <span className="text-xs text-gray-500 ml-1">(선택)</span>
                        )}
                      </Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        value={endDate || ''}
                        onChange={e => setValue('endDate', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 내용 */}
            <div className="space-y-2">
              <Label>내용 *</Label>
              <TiptapEditor
                content={content}
                onChange={newContent => {
                  setContent(newContent);
                  setValue('content', newContent);
                }}
                onImageUpload={async file => {
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('type', 'image');

                  const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                  });

                  if (!res.ok) {
                    throw new Error('Image upload failed');
                  }

                  const data = await res.json();
                  return data.data.url;
                }}
                placeholder="게시글 내용을 입력하세요 (최소 10자)"
                editable={!isSubmitting}
              />
              <p className="text-xs text-gray-500">
                에디터 내 이미지 업로드는 최대 5MB까지 가능합니다
              </p>
              {errors.content && <p className="text-sm text-red-600">{errors.content.message}</p>}
            </div>

            {/* 파일 첨부 */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">파일 첨부 (선택)</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt"
                  disabled={isSubmitting || isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={isSubmitting || isUploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? '업로드 중...' : '파일 업로드'}
                </Button>
                <span className="text-sm text-gray-500">
                  PDF, Word, Excel, PowerPoint, ZIP, TXT (최대 10MB)
                </span>
              </div>

              {/* 첨부된 파일 목록 */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2 mt-3">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#0052CC]" />
                        <span className="text-sm text-gray-900">{file.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        className="text-red-600 hover:text-red-700"
                        disabled={isSubmitting}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-3 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                  취소
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting || isUploading}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {defaultValues ? '수정 중...' : '작성 중...'}
                  </>
                ) : defaultValues ? (
                  '수정하기'
                ) : (
                  '작성하기'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
