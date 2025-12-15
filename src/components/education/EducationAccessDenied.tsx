'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PremiumInquiryModal } from './PremiumInquiryModal';

interface EducationAccessDeniedProps {
  userRole?: string;
}

/**
 * 교육 센터 접근 불가 안내 페이지
 * - 프리미엄 이상 등급만 접근 가능
 * - 일반 컨설턴트에게 업그레이드 안내
 */
export function EducationAccessDenied({ userRole = '컨설턴트' }: EducationAccessDeniedProps) {
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);

  return (
    <>
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 p-4 bg-amber-100 rounded-full w-fit">
              <Lock className="w-12 h-12 text-amber-600" />
            </div>
            <CardTitle className="text-2xl">교육 센터 접근 권한이 없습니다</CardTitle>
            <CardDescription className="text-base mt-2">
              현재 회원님의 등급은 <span className="font-semibold">{userRole}</span>입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                프리미엄 회원 혜택
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#0052CC] mt-0.5">✓</span>
                  <span>정부지원사업 전문 교육 비디오 무제한 시청</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0052CC] mt-0.5">✓</span>
                  <span>업종별/사업별 실전 노하우 아카이브 열람</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0052CC] mt-0.5">✓</span>
                  <span>신청서 템플릿, 체크리스트 등 자료 다운로드</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0052CC] mt-0.5">✓</span>
                  <span>전문가 커뮤니티 참여 및 질문 게시</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                프리미엄 등급으로 업그레이드하여 모든 교육 콘텐츠를 이용해보세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    대시보드로 돌아가기
                  </Button>
                </Link>
                <Button
                  className="w-full sm:w-auto bg-[#0052CC] hover:bg-[#0052CC]/90"
                  onClick={() => setInquiryModalOpen(true)}
                >
                  <Star className="w-4 h-4 mr-2" />
                  프리미엄 업그레이드 문의
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <PremiumInquiryModal open={inquiryModalOpen} onOpenChange={setInquiryModalOpen} />
    </>
  );
}
