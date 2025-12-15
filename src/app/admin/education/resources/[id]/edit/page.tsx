import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ResourceForm } from '@/components/admin/ResourceForm';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Admin Edit Resource Page
 */
export default async function AdminEditResourcePage({ params }: PageProps) {
  const { id } = await params;

  // Fetch resource
  const { data: resource, error } = await supabaseAdmin
    .from('resources')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !resource) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/education/resources"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          자료 목록으로 돌아가기
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">자료 수정</h1>
        <p className="text-gray-600 mt-2">{resource.title}</p>
      </div>

      {/* Form */}
      <ResourceForm mode="edit" resource={resource} />
    </div>
  );
}
