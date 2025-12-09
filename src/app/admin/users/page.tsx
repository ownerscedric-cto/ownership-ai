import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Users } from 'lucide-react';

/**
 * Admin Users Management Page
 * - List all users
 * - Change user roles (admin ↔ consultant)
 */
export default async function AdminUsersPage() {
  // Fetch all users
  const {
    data: { users },
    error,
  } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
          <p className="text-red-600 mt-2">
            사용자 목록을 불러오는데 실패했습니다: {error.message}
          </p>
        </div>
      </div>
    );
  }

  const usersData = users.map(u => ({
    id: u.id,
    email: u.email || '',
    role: (u.app_metadata?.role as 'admin' | 'consultant') || 'consultant',
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at || null,
    email_confirmed_at: u.email_confirmed_at || null,
  }));

  const stats = {
    total: usersData.length,
    admins: usersData.filter(u => u.role === 'admin').length,
    consultants: usersData.filter(u => u.role === 'consultant').length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
        <p className="text-gray-600 mt-2">전체 사용자 목록 및 역할 관리</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 사용자</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Users className="w-10 h-10 text-[#0052CC]" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">관리자</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.admins}</p>
            </div>
            <Users className="w-10 h-10 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">컨설턴트</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.consultants}</p>
            </div>
            <Users className="w-10 h-10 text-green-600" />
          </div>
        </div>
      </div>

      {/* User Table */}
      <UserManagementTable users={usersData} />
    </div>
  );
}
