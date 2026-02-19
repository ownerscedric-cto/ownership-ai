import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { KnowHowPostForm } from '@/components/admin/KnowHowPostForm';

export default async function AdminKnowHowPostNewPage() {
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
        <h1 className="text-3xl font-bold text-gray-900">노하우 게시글 작성</h1>
        <p className="text-gray-600 mt-2">노하우 커뮤니티에 공유할 게시글을 작성해주세요.</p>
      </div>

      <KnowHowPostForm mode="create" categories={categories || []} />
    </div>
  );
}
