'use client';

import { useSyncExternalStore } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagementTable } from './UserManagementTable';
import { InquiryManagementTable } from './InquiryManagementTable';
import { Users, Star } from 'lucide-react';

// Hydration 에러 방지를 위한 클라이언트 마운트 체크
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

interface Role {
  id: string;
  name: string;
  displayName: string;
  order: number;
}

interface UserData {
  id: string;
  email: string;
  role: {
    id: string;
    name: string;
    displayName: string;
  };
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

interface AdminUsersTabsProps {
  users: UserData[];
  roles: Role[];
}

/**
 * 관리자 사용자 관리 페이지 탭 컴포넌트
 * - 회원 목록 탭: 전체 사용자 및 역할 관리
 * - 업그레이드 문의 탭: 프리미엄 업그레이드 요청 관리
 */
export function AdminUsersTabs({ users, roles }: AdminUsersTabsProps) {
  // Hydration 에러 방지: useSyncExternalStore로 클라이언트 마운트 체크
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  if (!mounted) {
    // SSR 중에는 로딩 상태 표시
    return (
      <div className="w-full">
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse max-w-md" />
        <div className="mt-6 h-96 bg-gray-50 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="users" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="users" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          회원 목록
        </TabsTrigger>
        <TabsTrigger value="inquiries" className="flex items-center gap-2">
          <Star className="w-4 h-4" />
          업그레이드 문의
        </TabsTrigger>
      </TabsList>

      <TabsContent value="users" className="mt-6">
        <UserManagementTable users={users} roles={roles} />
      </TabsContent>

      <TabsContent value="inquiries" className="mt-6">
        <InquiryManagementTable />
      </TabsContent>
    </Tabs>
  );
}
