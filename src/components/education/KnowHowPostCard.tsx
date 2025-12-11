import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, MessageSquare, User, Calendar, Pin } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/date';

export interface KnowHowPost {
  id: string;
  title: string;
  content: string;
  authorName: string;
  viewCount: number;
  isPinned: boolean;
  isAnnouncement: boolean;
  isEvent: boolean;
  createdAt: string;
  category: {
    id: string;
    name: string;
  };
  _count: {
    comments: number;
  };
}

interface KnowHowPostCardProps {
  post: KnowHowPost;
}

/**
 * 노하우 게시글 카드 컴포넌트 (커뮤니티 게시판 스타일)
 * - 제목, 작성자, 카테고리, 조회수, 댓글수, 작성일
 * - 공지/이벤트 배지
 * - 고정글 아이콘
 */
export function KnowHowPostCard({ post }: KnowHowPostCardProps) {
  return (
    <Link href={`/education/knowhow/posts/${post.id}`}>
      <Card className="hover:shadow-md transition-all duration-200 cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* 고정글 아이콘 */}
            {post.isPinned && (
              <Pin className="w-5 h-5 text-[#0052CC] flex-shrink-0 mt-0.5" fill="#0052CC" />
            )}

            <div className="flex-1 min-w-0">
              {/* 배지 (공지/이벤트) */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {post.isAnnouncement && (
                  <Badge variant="destructive" className="text-xs">
                    공지
                  </Badge>
                )}
                {post.isEvent && (
                  <Badge variant="default" className="text-xs bg-green-600">
                    이벤트
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  {post.category.name}
                </Badge>
              </div>

              {/* 제목 */}
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 hover:text-[#0052CC] transition-colors">
                {post.title}
              </h3>

              {/* 메타 정보 */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                {/* 작성자 */}
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{post.authorName}</span>
                </div>

                {/* 작성일 */}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatRelativeTime(post.createdAt)}</span>
                </div>

                {/* 조회수 */}
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{post.viewCount.toLocaleString()}</span>
                </div>

                {/* 댓글수 */}
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>{post._count.comments.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
