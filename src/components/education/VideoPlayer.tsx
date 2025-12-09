'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const ReactPlayer = dynamic(() => import('react-player').then(mod => mod.default), { ssr: false });

interface VideoPlayerProps {
  url: string;
  thumbnailUrl?: string | null;
  title?: string;
}

/**
 * 비디오 플레이어 컴포넌트
 * - react-player 사용 (YouTube, Vimeo, 로컬 파일 지원)
 * - 반응형 16:9 비율
 */
export function VideoPlayer({ url, thumbnailUrl, title }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Player = ReactPlayer as any;

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      <Player
        url={url}
        width="100%"
        height="100%"
        playing={playing}
        controls
        light={thumbnailUrl || undefined}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {!playing && !thumbnailUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
          <p className="text-white text-lg font-medium">{title || '비디오 로딩 중...'}</p>
        </div>
      )}
    </div>
  );
}
