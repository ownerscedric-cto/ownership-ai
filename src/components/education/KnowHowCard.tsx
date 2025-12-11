import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, User, Tag } from 'lucide-react';
import type { KnowHow } from '@/hooks/useEducation';
import { formatDate } from '@/lib/utils/date';

interface KnowHowCardProps {
  knowhow: KnowHow;
}

/**
 * 노하우 카드 컴포넌트
 * - 제목, 카테고리, 작성자, 조회수, 요약 표시
 * - 아카이브 페이지에서 사용 시 archive 경로로 링크
 */
export function KnowHowCard({ knowhow }: KnowHowCardProps) {
  // 콘텐츠 요약 (HTML 태그 제거, 이미지만 있는 경우 처리)
  const getSummary = (content: string) => {
    // 1. HTML 태그 제거하여 순수 텍스트 추출
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();
    const plainText = stripHtml(content);

    // 2. 텍스트가 있으면 텍스트 요약 반환
    if (plainText.length > 0) {
      return plainText.length > 100 ? plainText.slice(0, 100) + '...' : plainText;
    }

    // 3. 이미지만 있는 경우 (텍스트 없음)
    const imageMatches = content.match(/<img/g);
    if (imageMatches && imageMatches.length > 0) {
      return `📷 이미지 ${imageMatches.length}개`;
    }

    // 4. 내용 없음
    return '내용 없음';
  };

  return (
    <Link href={`/education/knowhow/archive/${knowhow.id}`}>
      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer h-full">
        <CardHeader>
          {/* 카테고리 */}
          {knowhow.category && (
            <Badge variant="secondary" className="mb-2 w-fit">
              {knowhow.category.name}
            </Badge>
          )}

          {/* 제목 */}
          <CardTitle className="text-lg line-clamp-2">{knowhow.title}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 콘텐츠 요약 */}
          <p className="text-sm text-gray-600 line-clamp-3">{getSummary(knowhow.content)}</p>

          {/* 메타 정보 */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              {/* 작성자 */}
              {knowhow.author && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{knowhow.author}</span>
                </div>
              )}

              {/* 조회수 */}
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{knowhow.viewCount.toLocaleString()}</span>
              </div>

              {/* 태그 수 */}
              {knowhow.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>{knowhow.tags.length}</span>
                </div>
              )}
            </div>

            {/* 생성일 */}
            <span>{formatDate(knowhow.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
