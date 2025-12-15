'use client';

import { useState } from 'react';
import { formatDateTime } from '@/lib/utils/date';
import { Shield, User, Star, MoreVertical, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface RoleData {
  id: string;
  name: string;
  displayName: string;
}

interface UserData {
  id: string;
  email: string;
  role: RoleData;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

interface UserManagementTableProps {
  users: UserData[];
  roles: RoleData[];
}

// 역할별 아이콘 및 스타일
const getRoleStyle = (roleName: string) => {
  switch (roleName) {
    case 'admin':
      return {
        icon: Shield,
        className: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      };
    case 'premium':
      return {
        icon: Star,
        className: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
      };
    case 'consultant':
    default:
      return {
        icon: User,
        className: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      };
  }
};

export function UserManagementTable({ users, roles }: UserManagementTableProps) {
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());

  const handleRoleChange = async (
    userId: string,
    newRoleId: string,
    newRoleDisplayName: string
  ) => {
    setUpdatingUsers(prev => new Set(prev).add(userId));

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: newRoleId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to update role');
      }

      toast.success('역할 변경 완료', {
        description: `${newRoleDisplayName} 권한으로 변경되었습니다.`,
      });

      // Refresh page to update UI
      window.location.reload();
    } catch (error) {
      console.error('Role change error:', error);
      toast.error('역할 변경 실패', {
        description: error instanceof Error ? error.message : '다시 시도해주세요.',
      });
    } finally {
      setUpdatingUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>이메일</TableHead>
            <TableHead>역할</TableHead>
            <TableHead>가입일</TableHead>
            <TableHead>최근 로그인</TableHead>
            <TableHead>이메일 인증</TableHead>
            <TableHead className="text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => {
            const roleStyle = getRoleStyle(user.role.name);
            const RoleIcon = roleStyle.icon;

            return (
              <TableRow key={user.id}>
                {/* Email */}
                <TableCell className="font-medium">{user.email}</TableCell>

                {/* Role Badge */}
                <TableCell>
                  <Badge className={roleStyle.className}>
                    <RoleIcon className="w-3 h-3 mr-1" />
                    {user.role.displayName}
                  </Badge>
                </TableCell>

                {/* Created At */}
                <TableCell className="text-sm text-gray-600">
                  {formatDateTime(user.created_at)}
                </TableCell>

                {/* Last Sign In */}
                <TableCell className="text-sm text-gray-600">
                  {user.last_sign_in_at ? formatDateTime(user.last_sign_in_at) : '-'}
                </TableCell>

                {/* Email Confirmed */}
                <TableCell>
                  {user.email_confirmed_at ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      인증됨
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      미인증
                    </Badge>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={updatingUsers.has(user.id)}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>역할 변경</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {roles.map(role => {
                        const style = getRoleStyle(role.name);
                        const Icon = style.icon;
                        const isCurrentRole = user.role.id === role.id;

                        return (
                          <DropdownMenuItem
                            key={role.id}
                            onClick={() => {
                              if (!isCurrentRole) {
                                handleRoleChange(user.id, role.id, role.displayName);
                              }
                            }}
                            disabled={isCurrentRole}
                            className={isCurrentRole ? 'bg-gray-50' : ''}
                          >
                            <Icon className="w-4 h-4 mr-2" />
                            {role.displayName}
                            {isCurrentRole && <Check className="w-4 h-4 ml-auto text-green-600" />}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
