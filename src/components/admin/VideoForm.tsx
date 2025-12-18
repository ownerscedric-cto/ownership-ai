'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Loader2, Sparkles, Upload, X, FileText, Clock } from 'lucide-react';
import type { EducationVideo } from '@/lib/types/education';
import {
  fetchYouTubeMetadata,
  fetchYouTubeDuration,
  isYouTubeDataAPIAvailable,
} from '@/lib/youtube';
import { createClient } from '@/lib/supabase/client';

interface VideoCategory {
  id: string;
  name: string;
}

interface ResourceCategory {
  id: string;
  name: string;
}

interface UploadedResource {
  name: string;
  size: number;
  url: string;
  categoryId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const [isFetchingDuration, setIsFetchingDuration] = useState(false);
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Check if YouTube Data API is available (has API key)
  const youtubeAPIAvailable = isYouTubeDataAPIAvailable();

  // Resource upload states
  const [resourceCategories, setResourceCategories] = useState<ResourceCategory[]>([]);
  const [isLoadingResourceCategories, setIsLoadingResourceCategories] = useState(true);
  const [uploadedResources, setUploadedResources] = useState<UploadedResource[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedResourceCategoryId, setSelectedResourceCategoryId] = useState<string>('');

  // Fetch video categories on mount
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

  // Fetch resource categories on mount
  useEffect(() => {
    async function fetchResourceCategories() {
      try {
        const res = await fetch('/api/admin/education/resource-categories');
        const json = await res.json();
        if (json.success) {
          setResourceCategories(json.data);
          // 기본 카테고리 선택
          if (json.data.length > 0) {
            setSelectedResourceCategoryId(json.data[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch resource categories:', error);
      } finally {
        setIsLoadingResourceCategories(false);
      }
    }
    fetchResourceCategories();
  }, []);

  // File upload handler for resources
  const handleResourceUpload = useCallback(
    async (file: File) => {
      // 파일 크기 체크 (50MB 제한)
      const MAX_SIZE = 50 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        toast.error('파일 크기 초과', {
          description: '파일 크기는 50MB를 초과할 수 없습니다.',
        });
        return;
      }

      if (!selectedResourceCategoryId) {
        toast.error('카테고리를 먼저 선택해주세요.');
        return;
      }

      setIsUploading(true);

      try {
        const supabase = createClient();

        // 고유한 파일명 생성
        const timestamp = Date.now();
        const safeFileName = file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_');
        const storagePath = `resources/${timestamp}_${safeFileName}`;

        // Supabase Storage에 업로드
        const { error: uploadError } = await supabase.storage
          .from('resources')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Public URL 가져오기
        const {
          data: { publicUrl },
        } = supabase.storage.from('resources').getPublicUrl(storagePath);

        // 업로드된 자료 목록에 추가
        setUploadedResources(prev => [
          ...prev,
          {
            name: file.name,
            size: file.size,
            url: publicUrl,
            categoryId: selectedResourceCategoryId,
          },
        ]);

        toast.success('파일 업로드 완료', {
          description: `${file.name} (${formatFileSize(file.size)})`,
        });
      } catch (error) {
        console.error('File upload error:', error);
        toast.error('파일 업로드 실패', {
          description: error instanceof Error ? error.message : '다시 시도해주세요.',
        });
      } finally {
        setIsUploading(false);
      }
    },
    [selectedResourceCategoryId]
  );

  // Drag & Drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleResourceUpload(files[0]);
      }
    },
    [handleResourceUpload]
  );

  // File input handler
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleResourceUpload(files[0]);
      }
      // Reset input value to allow re-uploading same file
      e.target.value = '';
    },
    [handleResourceUpload]
  );

  // Remove uploaded resource
  const handleRemoveResource = useCallback((index: number) => {
    setUploadedResources(prev => prev.filter((_, i) => i !== index));
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

  /**
   * Fetch YouTube duration using YouTube Data API v3 (optional)
   */
  const handleFetchDuration = async () => {
    if (!videoUrl || videoType !== 'youtube') {
      toast.error('YouTube URL을 먼저 입력해주세요.');
      return;
    }

    if (!youtubeAPIAvailable) {
      toast.error('YouTube API 키가 설정되지 않았습니다.', {
        description: 'NEXT_PUBLIC_YOUTUBE_API_KEY 환경변수를 설정해주세요.',
      });
      return;
    }

    setIsFetchingDuration(true);

    try {
      const duration = await fetchYouTubeDuration(videoUrl);

      if (duration === null) {
        toast.error('재생시간을 가져올 수 없습니다.', {
          description: 'URL을 확인하거나 API 키를 확인해주세요.',
        });
        return;
      }

      setValue('duration', String(duration));

      // Format duration for display
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const formatted = minutes > 0 ? `${minutes}분 ${seconds}초` : `${seconds}초`;

      toast.success('재생시간을 가져왔습니다!', {
        description: `${formatted} (${duration}초)`,
      });
    } catch (error) {
      console.error('Fetch duration error:', error);
      toast.error('재생시간을 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsFetchingDuration(false);
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

      // Prepare payload with resources
      const payload = {
        title: data.title,
        description: data.description || null,
        categoryId: data.categoryId,
        videoUrl: data.videoUrl,
        videoType: data.videoType,
        thumbnailUrl: data.thumbnailUrl || null,
        duration: data.duration ? Number(data.duration) : null,
        tags: tagsArray,
        // 첨부자료 정보 추가
        resources: uploadedResources.map(r => ({
          title: r.name.replace(/\.[^/.]+$/, ''), // 확장자 제거한 파일명을 제목으로
          fileName: r.name,
          fileUrl: r.url,
          fileSize: r.size,
          categoryId: r.categoryId,
        })),
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

      const resourceCount = uploadedResources.length;
      const message =
        mode === 'create'
          ? resourceCount > 0
            ? `비디오가 추가되었습니다. (첨부자료 ${resourceCount}개)`
            : '비디오가 추가되었습니다.'
          : '비디오가 수정되었습니다.';

      toast.success(message);

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
            <div className="flex gap-2 mt-1">
              <Input
                id="duration"
                type="number"
                {...register('duration')}
                placeholder="예: 180 (선택사항)"
                className="flex-1"
              />
              {videoType === 'youtube' && youtubeAPIAvailable && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFetchDuration}
                  disabled={isFetchingDuration || !videoUrl}
                  className="whitespace-nowrap"
                >
                  {isFetchingDuration ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      가져오는 중...
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      재생시간 가져오기
                    </>
                  )}
                </Button>
              )}
            </div>
            {errors.duration && (
              <p className="text-sm text-red-600 mt-1">{errors.duration.message}</p>
            )}
            {videoType === 'youtube' && !youtubeAPIAvailable && (
              <p className="text-sm text-gray-500 mt-1">
                💡 NEXT_PUBLIC_YOUTUBE_API_KEY를 설정하면 재생시간을 자동으로 가져올 수 있습니다.
              </p>
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

        {/* Step 4: Attached Resources (create mode only) */}
        {mode === 'create' && (
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0052CC] text-white text-sm font-semibold">
                4
              </div>
              <h3 className="text-lg font-semibold text-gray-900">첨부자료 (선택)</h3>
            </div>
            <p className="text-sm text-gray-500">
              비디오와 함께 제공할 자료를 업로드하세요. 업로드된 자료는 자료실에도 저장됩니다.
            </p>

            {/* Resource Category Selection */}
            <div>
              <Label>자료 카테고리</Label>
              <Select
                value={selectedResourceCategoryId}
                onValueChange={setSelectedResourceCategoryId}
                disabled={isLoadingResourceCategories}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue
                    placeholder={isLoadingResourceCategories ? '로딩 중...' : '카테고리 선택'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {resourceCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">업로드할 자료의 카테고리를 선택하세요.</p>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
                ${isDragging ? 'border-[#0052CC] bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                ${isUploading ? 'pointer-events-none opacity-50' : ''}
              `}
            >
              <input
                type="file"
                onChange={handleFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.hwp,.hwpx,.txt,.zip,.csv"
                disabled={isUploading || !selectedResourceCategoryId}
              />

              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-[#0052CC] animate-spin" />
                  <p className="text-gray-600">파일 업로드 중...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <div>
                    <p className="text-gray-700 font-medium">파일을 드래그하여 업로드</p>
                    <p className="text-gray-500 text-sm">또는 클릭하여 파일 선택</p>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    PDF, Word, Excel, PowerPoint, 한글 등 (최대 50MB)
                  </p>
                </div>
              )}
            </div>

            {/* Uploaded Resources List */}
            {uploadedResources.length > 0 && (
              <div className="space-y-2">
                <Label>업로드된 자료 ({uploadedResources.length}개)</Label>
                <div className="space-y-2">
                  {uploadedResources.map((resource, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{resource.name}</p>
                          <p className="text-xs text-gray-600">
                            {formatFileSize(resource.size)} •{' '}
                            {resourceCategories.find(c => c.id === resource.categoryId)?.name ||
                              '미분류'}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveResource(index)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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
