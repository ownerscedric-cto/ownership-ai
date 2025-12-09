import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Clock } from 'lucide-react';
import type { EducationVideo } from '@/hooks/useEducation';

interface VideoCardProps {
  video: EducationVideo;
}

/**
 * 비디오 카드 컴포넌트
 * - 썸네일, 제목, 카테고리, 조회수, 재생시간 표시
 */
export function VideoCard({ video }: VideoCardProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Link href={`/education/videos/${video.id}`}>
      <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden">
        {/* 썸네일 */}
        <div className="relative aspect-video bg-gray-200 flex-shrink-0">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <p className="text-gray-400 text-sm">썸네일 없음</p>
            </div>
          )}
          {/* 재생시간 Badge */}
          {video.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(video.duration)}
            </div>
          )}
        </div>

        <CardContent className="p-4 flex flex-col flex-grow">
          {/* 카테고리 */}
          <Badge variant="secondary" className="mb-2 w-fit">
            {video.category.name}
          </Badge>

          {/* 제목 */}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
            {video.title}
          </h3>

          {/* 설명 */}
          {video.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[2.5rem]">
              {video.description}
            </p>
          )}

          {/* 조회수 */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-auto">
            <Eye className="w-4 h-4" />
            <span>조회수 {video.viewCount.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
