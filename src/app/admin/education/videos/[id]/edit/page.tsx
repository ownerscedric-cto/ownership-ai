import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VideoForm } from '@/components/admin/VideoForm';
import { prisma } from '@/lib/prisma';

interface AdminEditVideoPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Admin Edit Video Page
 */
export default async function AdminEditVideoPage({ params }: AdminEditVideoPageProps) {
  const { id } = await params;

  // Fetch video
  const video = await prisma.educationVideo.findUnique({
    where: { id },
  });

  if (!video) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/education/videos"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          비디오 목록으로 돌아가기
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">비디오 수정</h1>
        <p className="text-gray-600 mt-2">교육 비디오 콘텐츠를 수정합니다.</p>
      </div>

      {/* Form */}
      <VideoForm mode="edit" video={video} />
    </div>
  );
}
