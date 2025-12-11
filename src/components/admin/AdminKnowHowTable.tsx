'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/utils/date';
import { Edit, Trash2, Eye, BookOpen } from 'lucide-react';
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

interface KnowHowCategory {
  id: string;
  name: string;
  description: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface KnowHow {
  id: string;
  title: string;
  content: string;
  categoryId: string | null;
  author: string | null;
  tags: string[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  category: KnowHowCategory | null;
}

interface AdminKnowHowTableProps {
  knowhows: KnowHow[];
  type: 'archive' | 'community';
}

const categoryColors: Record<string, string> = {
  업종별: 'bg-blue-100 text-blue-800',
  사업별: 'bg-green-100 text-green-800',
  팁: 'bg-purple-100 text-purple-800',
  주의사항: 'bg-yellow-100 text-yellow-800',
};

export function AdminKnowHowTable({ knowhows, type }: AdminKnowHowTableProps) {
  const [deletingKnowHows, setDeletingKnowHows] = useState<Set<string>>(new Set());

  const handleDelete = async (knowHowId: string, title: string) => {
    const confirmMessage =
      type === 'archive'
        ? `"${title}" 아카이브를 삭제하시겠습니까?`
        : `"${title}" 게시글을 삭제하시겠습니까?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setDeletingKnowHows(prev => new Set(prev).add(knowHowId));

    try {
      const endpoint =
        type === 'archive'
          ? `/api/admin/education/knowhow/${knowHowId}`
          : `/api/admin/education/knowhow/posts/${knowHowId}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to delete');
      }

      const successMessage = type === 'archive' ? '아카이브 삭제 완료' : '게시글 삭제 완료';
      toast.success(successMessage, {
        description: `"${title}"이(가) 삭제되었습니다.`,
      });

      // Refresh page
      window.location.reload();
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = type === 'archive' ? '아카이브 삭제 실패' : '게시글 삭제 실패';
      toast.error(errorMessage, {
        description: error instanceof Error ? error.message : '다시 시도해주세요.',
      });
    } finally {
      setDeletingKnowHows(prev => {
        const next = new Set(prev);
        next.delete(knowHowId);
        return next;
      });
    }
  };

  if (knowhows.length === 0) {
    return (
      <div className="p-8 text-center">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          {type === 'archive' ? '아카이브가 없습니다' : '게시글이 없습니다'}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {type === 'archive'
            ? '첫 번째 아카이브를 추가해보세요.'
            : '첫 번째 게시글을 작성해보세요.'}
        </p>
        <Link
          href={
            type === 'archive'
              ? '/admin/education/knowhow/new'
              : '/admin/education/knowhow/posts/new'
          }
        >
          <Button size="sm" className="bg-[#0052CC] hover:bg-[#003d99]">
            {type === 'archive' ? '아카이브 추가' : '게시글 작성'}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>제목</TableHead>
            <TableHead>카테고리</TableHead>
            <TableHead>작성자</TableHead>
            <TableHead>조회수</TableHead>
            <TableHead>생성일</TableHead>
            <TableHead className="text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {knowhows.map(knowhow => (
            <TableRow key={knowhow.id}>
              {/* Title */}
              <TableCell className="font-medium max-w-md">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-[#0052CC] flex-shrink-0" />
                  <div className="truncate">
                    <p className="truncate">{knowhow.title}</p>
                    {/* Tags */}
                    {knowhow.tags && knowhow.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {knowhow.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="text-xs text-gray-500">
                            #{tag}
                          </span>
                        ))}
                        {knowhow.tags.length > 3 && (
                          <span className="text-xs text-gray-400">+{knowhow.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>

              {/* Category */}
              <TableCell>
                {knowhow.category ? (
                  <Badge
                    className={categoryColors[knowhow.category.name] || 'bg-gray-100 text-gray-800'}
                  >
                    {knowhow.category.name}
                  </Badge>
                ) : (
                  <span className="text-sm text-gray-400">미분류</span>
                )}
              </TableCell>

              {/* Author */}
              <TableCell className="text-sm text-gray-600">{knowhow.author || '관리자'}</TableCell>

              {/* View Count */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span>{knowhow.viewCount.toLocaleString()}</span>
                </div>
              </TableCell>

              {/* Created At */}
              <TableCell className="text-sm text-gray-600">
                {formatDate(knowhow.createdAt)}
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={
                      type === 'archive'
                        ? `/admin/education/knowhow/archive/${knowhow.id}/edit`
                        : `/admin/education/knowhow/posts/${knowhow.id}/edit`
                    }
                  >
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      수정
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(knowhow.id, knowhow.title)}
                    disabled={deletingKnowHows.has(knowhow.id)}
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
