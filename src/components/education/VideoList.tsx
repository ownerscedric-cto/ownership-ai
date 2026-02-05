'use client';

import { VideoCard } from './VideoCard';
import type { EducationVideo } from '@/hooks/useEducation';

interface VideoListProps {
  videos: EducationVideo[];
  isLoading?: boolean;
  error?: Error | null;
}

/**
 * 비디오 목록 컴포넌트
 * - Grid 레이아웃 (모바일 1열, 태블릿 2열, 데스크탑 3열)
 * - Loading/Error 상태 처리
 */
export function VideoList({ videos, isLoading, error }: VideoListProps) {
  // 로딩 상태
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-lg overflow-hidden">
            <div className="aspect-video bg-gray-300" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-300 rounded w-1/3" />
              <div className="h-5 bg-gray-300 rounded w-full" />
              <div className="h-4 bg-gray-300 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-red-600 font-semibold mb-2">비디오를 불러오는 중 오류가 발생했습니다</p>
        <p className="text-gray-600 text-sm">{error.message}</p>
      </div>
    );
  }

  // 데이터 없음
  if (!videos || videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-gray-600">등록된 비디오가 없습니다</p>
      </div>
    );
  }

  // 비디오 목록 표시
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {videos.map(video => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
