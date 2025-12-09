import { Users, GraduationCap, Mail, Database, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { prisma } from '@/lib/prisma';

/**
 * Admin Dashboard - 통계 및 요약 정보
 */
export default async function AdminDashboardPage() {
  // 통계 데이터 수집 (순차 실행으로 connection pool 타임아웃 방지)
  const usersResult = await supabaseAdmin.auth.admin.listUsers();
  const videosCount = await prisma.educationVideo.count();
  const knowhowCount = await prisma.knowHow.count();
  const resourcesCount = await prisma.resource.count();
  const invitationsCount = await prisma.invitation.count();

  const users = usersResult.data.users || [];
  const stats = {
    totalUsers: users.length,
    adminUsers: users.filter(u => u.app_metadata?.role === 'admin').length,
    consultantUsers: users.filter(
      u => !u.app_metadata?.role || u.app_metadata?.role === 'consultant'
    ).length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="text-gray-600 mt-2">시스템 전체 통계 및 관리</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">전체 사용자</CardTitle>
            <Users className="w-5 h-5 text-[#0052CC]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalUsers}</div>
            <p className="text-xs text-gray-500 mt-2">
              관리자: {stats.adminUsers} / 컨설턴트: {stats.consultantUsers}
            </p>
          </CardContent>
        </Card>

        {/* Education Videos Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">교육 비디오</CardTitle>
            <GraduationCap className="w-5 h-5 text-[#0052CC]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{videosCount}</div>
            <p className="text-xs text-gray-500 mt-2">등록된 비디오 콘텐츠</p>
          </CardContent>
        </Card>

        {/* Knowhow Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">노하우</CardTitle>
            <Database className="w-5 h-5 text-[#0052CC]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{knowhowCount}</div>
            <p className="text-xs text-gray-500 mt-2">노하우 아카이브</p>
          </CardContent>
        </Card>

        {/* Resources Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">자료실</CardTitle>
            <FileText className="w-5 h-5 text-[#0052CC]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{resourcesCount}</div>
            <p className="text-xs text-gray-500 mt-2">다운로드 자료</p>
          </CardContent>
        </Card>

        {/* Invitations Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">초대 신청</CardTitle>
            <Mail className="w-5 h-5 text-[#0052CC]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{invitationsCount}</div>
            <p className="text-xs text-gray-500 mt-2">대기 중인 초대</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 작업</CardTitle>
          <CardDescription>자주 사용하는 관리 기능</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/users"
              className="p-4 border border-gray-200 rounded-lg hover:border-[#0052CC] hover:bg-blue-50 transition-colors"
            >
              <Users className="w-8 h-8 text-[#0052CC] mb-2" />
              <h3 className="font-semibold text-gray-900">사용자 관리</h3>
              <p className="text-sm text-gray-600 mt-1">사용자 역할 및 권한 관리</p>
            </a>

            <a
              href="/admin/education/videos"
              className="p-4 border border-gray-200 rounded-lg hover:border-[#0052CC] hover:bg-blue-50 transition-colors"
            >
              <GraduationCap className="w-8 h-8 text-[#0052CC] mb-2" />
              <h3 className="font-semibold text-gray-900">교육 콘텐츠</h3>
              <p className="text-sm text-gray-600 mt-1">비디오, 노하우, 자료 관리</p>
            </a>

            <a
              href="/admin/invitations"
              className="p-4 border border-gray-200 rounded-lg hover:border-[#0052CC] hover:bg-blue-50 transition-colors"
            >
              <Mail className="w-8 h-8 text-[#0052CC] mb-2" />
              <h3 className="font-semibold text-gray-900">초대 승인</h3>
              <p className="text-sm text-gray-600 mt-1">신규 사용자 초대 승인</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
