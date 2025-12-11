'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

// 게시글 작성 스키마
const postFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(100, '제목은 100자 이내로 작성해주세요'),
  content: z
    .string()
    .min(10, '내용은 최소 10자 이상 입력해주세요')
    .max(5000, '내용은 5000자 이내로 작성해주세요'),
  categoryId: z.string().min(1, '카테고리를 선택해주세요'),
  authorName: z
    .string()
    .min(1, '작성자 이름을 입력해주세요')
    .max(50, '작성자 이름은 50자 이내로 입력해주세요'),
});

export type PostFormData = z.infer<typeof postFormSchema> & {
  imageUrls?: string[];
  fileUrls?: string[];
  fileNames?: string[];
};

interface KnowHowPostFormProps {
  categories: Array<{ id: string; name: string }>;
  onSubmit: (data: PostFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<PostFormData>;
}

/**
 * 노하우 커뮤니티 게시글 작성/수정 폼
 * - react-hook-form + Zod 검증
 * - 제목, 내용, 카테고리, 작성자 필드
 * - 이미지/파일 업로드 기능
 * - 로딩 상태 표시
 */
export function KnowHowPostForm({
  categories,
  onSubmit,
  onCancel,
  isSubmitting = false,
  defaultValues,
}: KnowHowPostFormProps) {
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; name: string }>>(
    defaultValues?.fileUrls?.map((url, i) => ({
      url,
      name: defaultValues.fileNames?.[i] || '파일',
    })) || []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [content, setContent] = useState(defaultValues?.content || '');

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
      authorName: '',
    },
  });

  const categoryId = watch('categoryId');

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
    try {
      await onSubmit({
        ...data,
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
          <CardTitle>게시글 작성</CardTitle>
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
                value={categoryId}
                onValueChange={value => setValue('categoryId', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-red-600">{errors.categoryId.message}</p>
              )}
            </div>

            {/* 작성자 */}
            <div className="space-y-2">
              <Label htmlFor="authorName">작성자 *</Label>
              <Input
                id="authorName"
                placeholder="작성자 이름을 입력하세요"
                disabled={isSubmitting}
                {...register('authorName')}
              />
              {errors.authorName && (
                <p className="text-sm text-red-600">{errors.authorName.message}</p>
              )}
            </div>

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
                    작성 중...
                  </>
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
