import Link from 'next/link';
import { BookOpen, Video, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';

/**
 * 교육 메인 페이지
 * - VOD, 노하우, 자료실 섹션으로 이동
 */
export default function EducationPage() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">교육 센터</h1>
          <p className="text-gray-600">정부지원사업 전문가가 되기 위한 교육 콘텐츠를 제공합니다</p>
        </div>

        {/* 섹션 카드 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* VOD 섹션 */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#0052CC]/10 rounded-lg">
                  <Video className="w-6 h-6 text-[#0052CC]" />
                </div>
                <CardTitle className="text-xl">교육 비디오</CardTitle>
              </div>
              <CardDescription>정부지원사업 관련 동영상 강의</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                개요, 분야별, 신청서 작성, 성공사례 등 다양한 주제의 비디오 콘텐츠를 제공합니다.
              </p>
              <Link href="/education/videos">
                <Button className="w-full bg-[#0052CC] hover:bg-[#0052CC]/90">비디오 보기</Button>
              </Link>
            </CardContent>
          </Card>

          {/* 노하우 아카이브 섹션 */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#0052CC]/10 rounded-lg">
                  <BookOpen className="w-6 h-6 text-[#0052CC]" />
                </div>
                <CardTitle className="text-xl">노하우 아카이브</CardTitle>
              </div>
              <CardDescription>업종별/사업별 실전 노하우</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                업종별, 사업별 팁, 주의사항 등 실무에 바로 적용 가능한 노하우를 공유합니다.
              </p>
              <Link href="/education/knowhow">
                <Button className="w-full bg-[#0052CC] hover:bg-[#0052CC]/90">노하우 보기</Button>
              </Link>
            </CardContent>
          </Card>

          {/* 자료실 섹션 */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#0052CC]/10 rounded-lg">
                  <FileText className="w-6 h-6 text-[#0052CC]" />
                </div>
                <CardTitle className="text-xl">자료실</CardTitle>
              </div>
              <CardDescription>템플릿 및 체크리스트 다운로드</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                신청서 템플릿, 체크리스트, 참고 문서 등 실무에 필요한 자료를 다운로드하세요.
              </p>
              <Link href="/education/resources">
                <Button className="w-full bg-[#0052CC] hover:bg-[#0052CC]/90">자료 다운로드</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
