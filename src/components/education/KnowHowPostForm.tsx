'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Loader2 } from 'lucide-react';

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

export type PostFormData = z.infer<typeof postFormSchema>;

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
 * - 로딩 상태 표시
 */
export function KnowHowPostForm({
  categories,
  onSubmit,
  onCancel,
  isSubmitting = false,
  defaultValues,
}: KnowHowPostFormProps) {
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

  const handleFormSubmit = async (data: PostFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('게시글 작성 실패:', error);
    }
  };

  return (
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
            <Label htmlFor="content">내용 *</Label>
            <Textarea
              id="content"
              placeholder="게시글 내용을 입력하세요 (최소 10자)"
              disabled={isSubmitting}
              rows={15}
              className="resize-none"
              {...register('content')}
            />
            {errors.content && <p className="text-sm text-red-600">{errors.content.message}</p>}
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                취소
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
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
  );
}
