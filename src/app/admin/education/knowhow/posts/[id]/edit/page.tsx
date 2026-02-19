import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { KnowHowPostForm } from '@/components/admin/KnowHowPostForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminKnowHowPostEditPage({ params }: PageProps) {
  const { id } = await params;

  const { data: post, error } = await supabaseAdmin
    .from('knowhow_posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !post) {
    notFound();
  }

  const { data: categories } = await supabaseAdmin
    .from('knowhow_categories')
    .select('*')
    .order('name');

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link
          href="/admin/education/knowhow"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          노하우 관리로 돌아가기
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">커뮤니티 글 수정</h1>
        <p className="text-gray-600 mt-2">컨설턴트 커뮤니티 게시글을 수정합니다</p>
      </div>

      <KnowHowPostForm mode="edit" post={post} categories={categories || []} />
    </div>
  );
}
