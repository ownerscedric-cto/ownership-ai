'use client';

import { useCanAccessEducation, useMyRole } from '@/hooks/useRoles';
import { EducationAccessDenied } from './EducationAccessDenied';
import { Loader2 } from 'lucide-react';

interface EducationGuardProps {
  children: React.ReactNode;
}

/**
 * 교육 센터 접근 권한 체크 래퍼 컴포넌트
 * - 권한 확인 중 로딩 표시
 * - 권한 없으면 안내 페이지 표시
 * - 권한 있으면 children 렌더링
 */
export function EducationGuard({ children }: EducationGuardProps) {
  const { hasPermission, isLoading } = useCanAccessEducation();
  const { data: myRole } = useMyRole();

  // 권한 확인 중
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0052CC]" />
      </div>
    );
  }

  // 권한 없음
  if (!hasPermission) {
    return <EducationAccessDenied userRole={myRole?.role.displayName} />;
  }

  // 권한 있음
  return <>{children}</>;
}
