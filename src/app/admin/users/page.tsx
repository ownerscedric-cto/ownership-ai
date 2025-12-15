import { AdminUsersTabs } from '@/components/admin/AdminUsersTabs';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Users, Shield, Star } from 'lucide-react';

/**
 * Admin Users Management Page
 * - List all users with their roles from user_roles table
 * - Change user roles (admin, premium, consultant)
 */
export default async function AdminUsersPage() {
  // Fetch all users
  const {
    data: { users },
    error: usersError,
  } = await supabaseAdmin.auth.admin.listUsers();

  if (usersError) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
          <p className="text-red-600 mt-2">
            사용자 목록을 불러오는데 실패했습니다: {usersError.message}
          </p>
        </div>
      </div>
    );
  }

  // Fetch all roles
  const { data: roles, error: rolesError } = await supabaseAdmin
    .from('roles')
    .select('*')
    .order('order', { ascending: true });

  if (rolesError) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
          <p className="text-red-600 mt-2">
            역할 목록을 불러오는데 실패했습니다: {rolesError.message}
          </p>
        </div>
      </div>
    );
  }

  // Fetch user_roles mapping
  const { data: userRoles, error: userRolesError } = await supabaseAdmin
    .from('user_roles')
    .select('userId, roleId, role:roleId(id, name, displayName)');

  if (userRolesError) {
    console.error('Failed to fetch user roles:', userRolesError);
  }

  // Create userId -> role mapping
  const userRoleMap = new Map<string, { id: string; name: string; displayName: string }>();
  if (userRoles) {
    for (const ur of userRoles) {
      const role = Array.isArray(ur.role) ? ur.role[0] : ur.role;
      if (role) {
        userRoleMap.set(ur.userId, {
          id: role.id,
          name: role.name,
          displayName: role.displayName,
        });
      }
    }
  }

  // Get default role (consultant)
  const defaultRole = roles?.find(r => r.name === 'consultant') || {
    id: '',
    name: 'consultant',
    displayName: '컨설턴트',
  };

  // Map users with their roles
  const usersData = users.map(u => {
    const userRole = userRoleMap.get(u.id) || defaultRole;
    return {
      id: u.id,
      email: u.email || '',
      role: userRole,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at || null,
      email_confirmed_at: u.email_confirmed_at || null,
    };
  });

  // Calculate stats by role
  const stats = {
    total: usersData.length,
    admin: usersData.filter(u => u.role.name === 'admin').length,
    premium: usersData.filter(u => u.role.name === 'premium').length,
    consultant: usersData.filter(u => u.role.name === 'consultant').length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
        <p className="text-gray-600 mt-2">전체 사용자 목록 및 역할 관리</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.admin}</p>
            </div>
            <Shield className="w-10 h-10 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">프리미엄</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.premium}</p>
            </div>
            <Star className="w-10 h-10 text-amber-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">컨설턴트</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.consultant}</p>
            </div>
            <Users className="w-10 h-10 text-green-600" />
          </div>
        </div>
      </div>

      {/* Tabs: 회원 목록 + 업그레이드 문의 */}
      <AdminUsersTabs users={usersData} roles={roles || []} />
    </div>
  );
}
