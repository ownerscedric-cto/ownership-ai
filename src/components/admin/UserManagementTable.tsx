'use client';

import { useState } from 'react';
import { formatDateTime } from '@/lib/utils/date';
import { Shield, User, MoreVertical } from 'lucide-react';
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
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface UserData {
  id: string;
  email: string;
  role: 'admin' | 'consultant';
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

interface UserManagementTableProps {
  users: UserData[];
}

export function UserManagementTable({ users }: UserManagementTableProps) {
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'consultant') => {
    setUpdatingUsers(prev => new Set(prev).add(userId));

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to update role');
      }

      toast.success('역할 변경 완료', {
        description: `${newRole === 'admin' ? '관리자' : '컨설턴트'} 권한으로 변경되었습니다.`,
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
          {users.map(user => (
            <TableRow key={user.id}>
              {/* Email */}
              <TableCell className="font-medium">{user.email}</TableCell>

              {/* Role Badge */}
              <TableCell>
                {user.role === 'admin' ? (
                  <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                    <Shield className="w-3 h-3 mr-1" />
                    관리자
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <User className="w-3 h-3 mr-1" />
                    컨설턴트
                  </Badge>
                )}
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
                  <DropdownMenuContent align="end">
                    {user.role === 'consultant' ? (
                      <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}>
                        <Shield className="w-4 h-4 mr-2" />
                        관리자로 변경
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'consultant')}>
                        <User className="w-4 h-4 mr-2" />
                        컨설턴트로 변경
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
