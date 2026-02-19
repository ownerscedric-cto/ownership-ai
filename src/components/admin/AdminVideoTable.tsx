'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils/date';
import { Edit, Trash2, Eye, Video as VideoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import Link from 'next/link';
import type { EducationVideo } from '@/hooks/useEducation';

interface AdminVideoTableProps {
  videos: EducationVideo[];
}

const categoryColors: Record<string, string> = {
  개요: 'bg-blue-100 text-blue-800',
  분야별: 'bg-green-100 text-green-800',
  신청서작성: 'bg-purple-100 text-purple-800',
  성공사례: 'bg-yellow-100 text-yellow-800',
};

export function AdminVideoTable({ videos }: AdminVideoTableProps) {
  const router = useRouter();
  const [deletingVideos, setDeletingVideos] = useState<Set<string>>(new Set());

  const handleDelete = async (videoId: string, title: string) => {
    if (!confirm(`"${title}" 비디오를 삭제하시겠습니까?`)) {
      return;
    }

    setDeletingVideos(prev => new Set(prev).add(videoId));

    try {
      const response = await fetch(`/api/admin/education/videos/${videoId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to delete video');
      }

      toast.success('비디오 삭제 완료', {
        description: `"${title}" 비디오가 삭제되었습니다.`,
      });

      // Refresh server component data
      router.refresh();
    } catch (error) {
      console.error('Delete video error:', error);
      toast.error('비디오 삭제 실패', {
        description: error instanceof Error ? error.message : '다시 시도해주세요.',
      });
    } finally {
      setDeletingVideos(prev => {
        const next = new Set(prev);
        next.delete(videoId);
        return next;
      });
    }
  };

  if (videos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <VideoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">비디오가 없습니다</h3>
        <p className="text-gray-600 mb-6">첫 번째 교육 비디오를 추가해보세요.</p>
        <Link href="/admin/education/videos/new">
          <Button className="bg-[#0052CC] hover:bg-[#003d99]">비디오 추가</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>제목</TableHead>
            <TableHead>카테고리</TableHead>
            <TableHead>조회수</TableHead>
            <TableHead>생성일</TableHead>
            <TableHead className="text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.map(video => (
            <TableRow key={video.id}>
              {/* Title */}
              <TableCell className="font-medium max-w-md">
                <div className="flex items-center gap-3">
                  <VideoIcon className="w-5 h-5 text-[#0052CC] flex-shrink-0" />
                  <div className="truncate">
                    <p className="truncate">{video.title}</p>
                    {video.description && (
                      <p className="text-sm text-gray-500 truncate">{video.description}</p>
                    )}
                  </div>
                </div>
              </TableCell>

              {/* Category */}
              <TableCell>
                <Badge
                  className={categoryColors[video.category.name] || 'bg-gray-100 text-gray-800'}
                >
                  {video.category.name}
                </Badge>
              </TableCell>

              {/* View Count */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span>{video.viewCount.toLocaleString()}</span>
                </div>
              </TableCell>

              {/* Created At */}
              <TableCell className="text-sm text-gray-600">{formatDate(video.createdAt)}</TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/admin/education/videos/${video.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      수정
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(video.id, video.title)}
                    disabled={deletingVideos.has(video.id)}
                    className="text-red-600 hover:text-red-700 hover:border-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    삭제
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
