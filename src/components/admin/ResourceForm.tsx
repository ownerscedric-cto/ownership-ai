'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: string;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  tags: string[];
  videoId: string | null;
}

interface Video {
  id: string;
  title: string;
}

/**
 * Form Schema
 */
const resourceFormSchema = z.object({
  title: z.string().min(1, { message: '제목을 입력해주세요' }),
  description: z.string().optional(),
  type: z.enum(['template', 'checklist', 'document']),
  fileUrl: z.string().min(1, { message: '파일 URL을 입력해주세요' }),
  fileName: z.string().min(1, { message: '파일명을 입력해주세요' }),
  fileSize: z.string().optional().or(z.literal('')),
  tags: z.string().optional(),
  videoId: z.string().optional().or(z.literal('')),
});

type ResourceFormData = z.infer<typeof resourceFormSchema>;

interface ResourceFormProps {
  mode: 'create' | 'edit';
  resource?: Resource;
}

export function ResourceForm({ mode, resource }: ResourceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);

  // Fetch videos for linking
  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch('/api/education/videos?limit=100');
        const json = await res.json();
        if (json.success) {
          setVideos(json.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch videos:', error);
      } finally {
        setIsLoadingVideos(false);
      }
    }
    fetchVideos();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ResourceFormData>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues:
      mode === 'edit' && resource
        ? {
            title: resource.title,
            description: resource.description || '',
            type: resource.type as 'template' | 'checklist' | 'document',
            fileUrl: resource.fileUrl,
            fileName: resource.fileName,
            fileSize: resource.fileSize ? String(resource.fileSize) : '',
            tags: resource.tags.join(', '),
            videoId: resource.videoId || '',
          }
        : {
            type: 'document' as const,
            tags: '',
            videoId: '',
          },
  });

  const resourceType = watch('type');
  const videoId = watch('videoId');

  const onSubmit = async (data: ResourceFormData) => {
    setIsSubmitting(true);

    try {
      // Process tags
      const tagsArray = data.tags
        ? data.tags
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean)
        : [];

      // Prepare payload
      const payload = {
        title: data.title,
        description: data.description || null,
        type: data.type,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize ? Number(data.fileSize) : null,
        tags: tagsArray,
        videoId: data.videoId || null,
      };

      const url =
        mode === 'create' ? '/api/education/resources' : `/api/education/resources/${resource!.id}`;

      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save resource');
      }

      toast.success(mode === 'create' ? '자료가 추가되었습니다.' : '자료가 수정되었습니다.');

      router.push('/admin/education/resources');
      router.refresh();
    } catch (error) {
      console.error('Resource form submit error:', error);
      toast.error(mode === 'create' ? '자료 추가 실패' : '자료 수정 실패', {
        description: error instanceof Error ? error.message : '다시 시도해주세요.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Step 1: Basic Info */}
        <div className="space-y-4 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0052CC] text-white text-sm font-semibold">
              1
            </div>
            <h3 className="text-lg font-semibold text-gray-900">기본 정보</h3>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="자료 제목을 입력하세요"
              className="mt-1"
            />
            {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="자료에 대한 설명을 입력하세요"
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Type */}
          <div>
            <Label htmlFor="type">자료 타입 *</Label>
            <Select
              value={resourceType}
              onValueChange={value =>
                setValue('type', value as 'template' | 'checklist' | 'document')
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="template">템플릿</SelectItem>
                <SelectItem value="checklist">체크리스트</SelectItem>
                <SelectItem value="document">문서</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Step 2: File Info */}
        <div className="space-y-4 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0052CC] text-white text-sm font-semibold">
              2
            </div>
            <h3 className="text-lg font-semibold text-gray-900">파일 정보</h3>
          </div>

          {/* File URL */}
          <div>
            <Label htmlFor="fileUrl">파일 URL *</Label>
            <Input
              id="fileUrl"
              {...register('fileUrl')}
              placeholder="https://example.com/file.pdf"
              className="mt-1"
            />
            {errors.fileUrl && (
              <p className="text-sm text-red-600 mt-1">{errors.fileUrl.message}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Supabase Storage 또는 외부 URL을 입력하세요
            </p>
          </div>

          {/* File Name */}
          <div>
            <Label htmlFor="fileName">파일명 *</Label>
            <Input
              id="fileName"
              {...register('fileName')}
              placeholder="사업계획서_템플릿.docx"
              className="mt-1"
            />
            {errors.fileName && (
              <p className="text-sm text-red-600 mt-1">{errors.fileName.message}</p>
            )}
          </div>

          {/* File Size */}
          <div>
            <Label htmlFor="fileSize">파일 크기 (bytes)</Label>
            <Input
              id="fileSize"
              type="number"
              {...register('fileSize')}
              placeholder="예: 1048576 (1MB)"
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">선택사항입니다</p>
          </div>
        </div>

        {/* Step 3: Additional Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0052CC] text-white text-sm font-semibold">
              3
            </div>
            <h3 className="text-lg font-semibold text-gray-900">추가 정보 (선택)</h3>
          </div>

          {/* Video Link */}
          <div>
            <Label htmlFor="videoId">연결할 비디오</Label>
            <Select
              value={videoId || 'none'}
              onValueChange={value => setValue('videoId', value === 'none' ? '' : value)}
              disabled={isLoadingVideos}
            >
              <SelectTrigger className="mt-1">
                <SelectValue
                  placeholder={isLoadingVideos ? '로딩 중...' : '비디오를 선택하세요 (선택사항)'}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">연결 안함</SelectItem>
                {videos.map(video => (
                  <SelectItem key={video.id} value={video.id}>
                    {video.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              이 자료를 특정 비디오와 연결하면 해당 비디오 페이지에서 다운로드 버튼이 표시됩니다
            </p>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">태그</Label>
            <Input
              id="tags"
              {...register('tags')}
              placeholder="쉼표로 구분하여 입력 (예: 사업계획서, 템플릿, 신청서)"
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              쉼표(,)로 구분하여 여러 태그를 입력할 수 있습니다
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button type="submit" className="bg-[#0052CC] hover:bg-[#003d99]" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : mode === 'create' ? (
            '자료 추가'
          ) : (
            '변경사항 저장'
          )}
        </Button>
      </div>
    </form>
  );
}
