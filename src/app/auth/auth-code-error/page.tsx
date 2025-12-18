'use client';

import Link from 'next/link';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">인증 오류</h1>
        <p className="text-gray-600 mb-6">
          이메일 인증 처리 중 오류가 발생했습니다.
          <br />
          링크가 만료되었거나 이미 사용된 링크일 수 있습니다.
        </p>

        <div className="space-y-3">
          <p className="text-sm text-gray-500">다음을 시도해보세요:</p>
          <ul className="text-sm text-gray-600 text-left list-disc list-inside space-y-1">
            <li>이메일에서 가장 최근 인증 링크를 클릭하세요</li>
            <li>인증 링크는 24시간 동안만 유효합니다</li>
            <li>문제가 지속되면 다시 회원가입을 시도하세요</li>
          </ul>
        </div>

        <div className="mt-8 space-y-3">
          <Link href="/auth/signup" className="block">
            <Button variant="primary" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              다시 회원가입
            </Button>
          </Link>
          <Link href="/auth/login" className="block">
            <Button variant="secondary" className="w-full">
              로그인 페이지로
            </Button>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm mt-4"
          >
            <ArrowLeft className="w-4 h-4" />
            홈으로 돌아가기
          </Link>
        </div>
      </Card>
    </div>
  );
}
