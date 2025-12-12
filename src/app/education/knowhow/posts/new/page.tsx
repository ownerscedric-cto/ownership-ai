'use client';

import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { KnowHowPostForm } from '@/components/education/KnowHowPostForm';
import {
  useKnowHowCategories,
  useCreateKnowHowPost,
  type PostFormData,
} from '@/hooks/useEducation';

/**
 * 노하우 게시글 작성 페이지
 * - KnowHowPostForm 컴포넌트 사용
 * - 카테고리 목록 조회
 * - 작성 완료 후 상세 페이지로 이동
 */
export default function NewKnowHowPostPage() {
  const router = useRouter();
  const { data: categoriesData, isLoading: isLoadingCategories } = useKnowHowCategories();
  const createPost = useCreateKnowHowPost();

  const handleSubmit = async (data: PostFormData) => {
    try {
      const result = await createPost.mutateAsync({
        title: data.title,
        content: data.content,
        categoryId: data.categoryId,
        authorName: data.authorName,
        imageUrls: data.imageUrls || [],
        fileUrls: data.fileUrls || [],
        fileNames: data.fileNames || [],
      });

      // 작성 성공 시 상세 페이지로 이동
      if (result.success && result.data?.id) {
        router.push(`/education/knowhow/posts/${result.data.id}`);
      }
    } catch (error) {
      console.error('게시글 작성 실패:', error);
      alert(error instanceof Error ? error.message : '게시글 작성에 실패했습니다.');
    }
  };

  const handleCancel = () => {
    router.push('/education/knowhow/posts');
  };

  // 카테고리 로딩 중
  if (isLoadingCategories) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600">카테고리 목록을 불러오는 중...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 뒤로가기 버튼 */}
        <Button
          onClick={() => router.push('/education/knowhow/posts')}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          목록으로
        </Button>

        {/* 게시글 작성 폼 */}
        <KnowHowPostForm
          categories={categoriesData?.data || []}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={createPost.isPending}
        />
      </div>
    </AppLayout>
  );
}
