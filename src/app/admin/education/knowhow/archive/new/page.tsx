import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { KnowHowArchiveForm } from '@/components/admin/KnowHowArchiveForm';

export default async function AdminKnowHowArchiveNewPage() {
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
        <h1 className="text-3xl font-bold text-gray-900">노하우 아카이브 추가</h1>
        <p className="text-gray-600 mt-2">오너스경영연구소 전문 노하우를 작성합니다</p>
      </div>

      <KnowHowArchiveForm mode="create" categories={categories || []} />
    </div>
  );
}
