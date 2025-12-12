'use client';

import { useRouter, useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { KnowHowPostForm } from '@/components/education/KnowHowPostForm';
import {
  useKnowHowCategories,
  useKnowHowPost,
  useUpdateKnowHowPost,
  type PostFormData,
} from '@/hooks/useEducation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

/**
 * 노하우 커뮤니티 게시글 수정 페이지 (사용자용)
 * - 작성자만 수정 가능
 * - 게시글 데이터 pre-populate
 * - 수정 완료 후 상세 페이지로 이동
 */
export default function EditKnowHowPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const { user } = useAuth();
  const { data: categoriesData, isLoading: isLoadingCategories } = useKnowHowCategories();
  const { data: postData, isLoading: isLoadingPost } = useKnowHowPost(postId);
  const updatePost = useUpdateKnowHowPost();

  const post = postData?.data;

  // 권한 체크: 작성자만 수정 가능
  if (!isLoadingPost && post && user && post.userId !== user.id) {
    toast.error('수정 권한이 없습니다', {
      description: '본인이 작성한 게시글만 수정할 수 있습니다.',
    });
    router.push(`/education/knowhow/posts/${postId}`);
    return null;
  }

  const handleSubmit = async (data: PostFormData) => {
    try {
      await updatePost.mutateAsync({
        id: postId,
        ...data,
      });

      toast.success('게시글 수정 완료', {
        description: '게시글이 성공적으로 수정되었습니다.',
      });

      // 상세 페이지로 이동
      router.push(`/education/knowhow/posts/${postId}`);
    } catch (error) {
      console.error('게시글 수정 실패:', error);
      toast.error('게시글 수정 실패', {
        description: error instanceof Error ? error.message : '다시 시도해주세요.',
      });
    }
  };

  const handleCancel = () => {
    router.push(`/education/knowhow/posts/${postId}`);
  };

  // 로딩 상태
  if (isLoadingCategories || isLoadingPost) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // 게시글 없음
  if (!post) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <p className="text-red-600">게시글을 찾을 수 없습니다.</p>
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
          onClick={() => router.push(`/education/knowhow/posts/${postId}`)}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          게시글로 돌아가기
        </Button>

        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">게시글 수정</h1>
          <p className="text-gray-600 mt-2">게시글을 수정합니다</p>
        </div>

        {/* 게시글 수정 폼 */}
        <KnowHowPostForm
          categories={categoriesData?.data || []}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={updatePost.isPending}
          defaultValues={{
            title: post.title,
            content: post.content,
            categoryId: post.categoryId,
            authorName: post.authorName,
            imageUrls: post.imageUrls || [],
            fileUrls: post.fileUrls || [],
            fileNames: post.fileNames || [],
          }}
        />
      </div>
    </AppLayout>
  );
}
