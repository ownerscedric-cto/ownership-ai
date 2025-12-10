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
import { Loader2, Sparkles } from 'lucide-react';
import type { EducationVideo } from "@/lib/types/program";
import { fetchYouTubeMetadata } from '@/lib/youtube';

interface VideoCategory {
  id: string;
  name: string;
}

/**
 * Form Schema
 */
const videoFormSchema = z.object({
  title: z.string().min(1, { message: '제목을 입력해주세요' }),
  description: z.string().optional(),
  categoryId: z.string().min(1, { message: '카테고리를 선택해주세요' }),
  videoUrl: z.string().min(1, { message: 'URL을 입력해주세요' }),
  videoType: z.enum(['youtube', 'vimeo', 'file']),
  thumbnailUrl: z.string().optional().or(z.literal('')),
  duration: z.string().optional().or(z.literal('')),
  tags: z.string().optional(), // Comma-separated tags
});

type VideoFormData = z.infer<typeof videoFormSchema>;

interface VideoFormProps {
  mode: 'create' | 'edit';
  video?: EducationVideo;
}

export function VideoForm({ mode, video }: VideoFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/admin/education/categories');
        const json = await res.json();
        if (json.success) {
          setCategories(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        toast.error('카테고리 목록을 불러오지 못했습니다.');
      } finally {
        setIsLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<VideoFormData>({
    resolver: zodResolver(videoFormSchema),
    defaultValues:
      mode === 'edit' && video
        ? {
            title: video.title,
            description: video.description || '',
            categoryId: video.categoryId,
            videoUrl: video.videoUrl,
            videoType: video.videoType as 'youtube' | 'vimeo' | 'file',
            thumbnailUrl: video.thumbnailUrl || '',
            duration: video.duration ? String(video.duration) : '',
            tags: video.tags.join(', '),
          }
        : {
            videoType: 'youtube' as const,
            tags: '',
          },
  });

  const categoryId = watch('categoryId');
  const videoType = watch('videoType');
  const videoUrl = watch('videoUrl');

  /**
   * Fetch YouTube metadata and auto-fill form fields
   */
  const handleAutoFill = async () => {
    if (!videoUrl || videoType !== 'youtube') {
      toast.error('YouTube URL을 먼저 입력해주세요.');
      return;
    }

    setIsFetchingMetadata(true);

    try {
      const metadata = await fetchYouTubeMetadata(videoUrl);

      if (!metadata) {
        toast.error('YouTube 정보를 가져올 수 없습니다.', {
          description: 'URL을 확인해주세요.',
        });
        return;
      }

      // Auto-fill form fields
      if (metadata.title && !watch('title')) {
        setValue('title', metadata.title);
      }
      if (metadata.thumbnailUrl && !watch('thumbnailUrl')) {
        setValue('thumbnailUrl', metadata.thumbnailUrl);
      }

      toast.success('YouTube 정보를 가져왔습니다!', {
        description: '제목과 썸네일이 자동으로 입력되었습니다.',
      });
    } catch (error) {
      console.error('Auto-fill error:', error);
      toast.error('정보를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const onSubmit = async (data: VideoFormData) => {
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
        categoryId: data.categoryId,
        videoUrl: data.videoUrl,
        videoType: data.videoType,
        thumbnailUrl: data.thumbnailUrl || null,
        duration: data.duration ? Number(data.duration) : null,
        tags: tagsArray,
      };

      const url =
        mode === 'create'
          ? '/api/admin/education/videos'
          : `/api/admin/education/videos/${video!.id}`;

      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save video');
      }

      toast.success(mode === 'create' ? '비디오가 추가되었습니다.' : '비디오가 수정되었습니다.');

      router.push('/admin/education/videos');
      router.refresh();
    } catch (error) {
      console.error('Video form submit error:', error);
      toast.error(mode === 'create' ? '비디오 추가 실패' : '비디오 수정 실패', {
        description: error instanceof Error ? error.message : '다시 시도해주세요.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Step 1: Video Type & URL */}
        <div className="space-y-4 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0052CC] text-white text-sm font-semibold">
              1
            </div>
            <h3 className="text-lg font-semibold text-gray-900">비디오 소스</h3>
          </div>

          {/* Video Type */}
          <div>
            <Label htmlFor="videoType">비디오 타입 *</Label>
            <Select
              value={videoType}
              onValueChange={value => setValue('videoType', value as 'youtube' | 'vimeo' | 'file')}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="vimeo">Vimeo</SelectItem>
                <SelectItem value="file">파일</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Video URL with Auto-Fill Button */}
          <div>
            <Label htmlFor="videoUrl">비디오 URL *</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="videoUrl"
                {...register('videoUrl')}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1"
              />
              {videoType === 'youtube' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAutoFill}
                  disabled={isFetchingMetadata || !videoUrl}
                  className="whitespace-nowrap"
                >
                  {isFetchingMetadata ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      불러오는 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      자동 입력
                    </>
                  )}
                </Button>
              )}
            </div>
            {errors.videoUrl && (
              <p className="text-sm text-red-600 mt-1">{errors.videoUrl.message}</p>
            )}
            {videoType === 'youtube' && (
              <p className="text-sm text-gray-500 mt-1">
                💡 YouTube URL을 입력하고 &quot;자동 입력&quot; 버튼을 눌러보세요!
              </p>
            )}
          </div>
        </div>

        {/* Step 2: Basic Info */}
        <div className="space-y-4 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0052CC] text-white text-sm font-semibold">
              2
            </div>
            <h3 className="text-lg font-semibold text-gray-900">기본 정보</h3>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="비디오 제목을 입력하세요"
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
              placeholder="비디오 설명을 입력하세요"
              rows={4}
              className="mt-1"
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="categoryId">카테고리 *</Label>
            <Select
              value={categoryId}
              onValueChange={value => setValue('categoryId', value)}
              disabled={isLoadingCategories}
            >
              <SelectTrigger className="mt-1">
                <SelectValue
                  placeholder={isLoadingCategories ? '로딩 중...' : '카테고리를 선택하세요'}
                />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-sm text-red-600 mt-1">{errors.categoryId.message}</p>
            )}
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

          {/* Thumbnail URL */}
          <div>
            <Label htmlFor="thumbnailUrl">썸네일 URL</Label>
            <Input
              id="thumbnailUrl"
              {...register('thumbnailUrl')}
              placeholder="https://example.com/thumbnail.jpg (선택사항)"
              className="mt-1"
            />
            {errors.thumbnailUrl && (
              <p className="text-sm text-red-600 mt-1">{errors.thumbnailUrl.message}</p>
            )}
          </div>

          {/* Duration */}
          <div>
            <Label htmlFor="duration">재생시간 (초)</Label>
            <Input
              id="duration"
              type="number"
              {...register('duration')}
              placeholder="예: 180 (선택사항)"
              className="mt-1"
            />
            {errors.duration && (
              <p className="text-sm text-red-600 mt-1">{errors.duration.message}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">태그</Label>
            <Input
              id="tags"
              {...register('tags')}
              placeholder="쉼표로 구분하여 입력 (예: 신청서, 사업계획서, 팁)"
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              쉼표(,)로 구분하여 여러 태그를 입력할 수 있습니다.
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
            '비디오 추가'
          ) : (
            '변경사항 저장'
          )}
        </Button>
      </div>
    </form>
  );
}
