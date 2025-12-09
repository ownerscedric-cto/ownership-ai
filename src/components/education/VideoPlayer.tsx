'use client';

interface VideoPlayerProps {
  url: string;
  thumbnailUrl?: string | null;
  title?: string;
}

/**
 * 비디오 플레이어 컴포넌트
 * - YouTube iframe 직접 사용
 * - 반응형 16:9 비율
 */
export function VideoPlayer({ url }: VideoPlayerProps) {
  // YouTube URL에서 비디오 ID 추출
  const getYouTubeVideoId = (url: string): string | null => {
    // https://www.youtube.com/watch?v=VIDEO_ID
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeVideoId(url);

  if (!videoId) {
    return (
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center text-white p-4">
          <p className="text-lg font-medium mb-2">비디오 URL 오류</p>
          <p className="text-sm text-gray-400">올바른 YouTube URL이 아닙니다</p>
          <p className="text-sm text-gray-400 mt-2">URL: {url}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
