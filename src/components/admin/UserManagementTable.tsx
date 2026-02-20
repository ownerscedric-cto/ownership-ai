'use client';

import { useState } from 'react';
import { formatDateTime } from '@/lib/utils/date';
import { Shield, User, Star, MoreVertical, Check, KeyRound, Mail, Trash2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface RoleData {
  id: string;
  name: string;
  displayName: string;
}

interface UserData {
  id: string;
  email: string;
  name: string | null;
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
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserData | null>(null);

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

  // 비밀번호 초기화 핸들러
  const handleResetPassword = async (userId: string, email: string) => {
    setUpdatingUsers(prev => new Set(prev).add(userId));

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || '비밀번호 초기화 실패');
      }

      toast.success('비밀번호 재설정 이메일 발송 완료', {
        description: `${email}로 비밀번호 재설정 링크가 발송되었습니다.`,
      });
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('비밀번호 초기화 실패', {
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

  // 인증 메일 재발송 핸들러
  const handleResendVerification = async (userId: string, email: string) => {
    setUpdatingUsers(prev => new Set(prev).add(userId));

    try {
      const response = await fetch(`/api/admin/users/${userId}/resend-verification`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || '인증 메일 재발송 실패');
      }

      toast.success('인증 메일 발송 완료', {
        description: `${email}로 인증 메일이 발송되었습니다.`,
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error('인증 메일 재발송 실패', {
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

  // 계정 삭제 핸들러
  const handleDeleteUser = async (user: UserData) => {
    setUpdatingUsers(prev => new Set(prev).add(user.id));

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || '사용자 삭제 실패');
      }

      toast.success('사용자 삭제 완료', {
        description: `${user.email} 계정이 삭제되었습니다.`,
      });

      setDeleteTargetUser(null);
      window.location.reload();
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error('사용자 삭제 실패', {
        description: error instanceof Error ? error.message : '다시 시도해주세요.',
      });
    } finally {
      setUpdatingUsers(prev => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
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
                  {/* Name */}
                  <TableCell className="font-medium">
                    {user.name || <span className="text-gray-400 text-sm">미등록</span>}
                  </TableCell>

                  {/* Email */}
                  <TableCell>{user.email}</TableCell>

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
                              {isCurrentRole && (
                                <Check className="w-4 h-4 ml-auto text-green-600" />
                              )}
                            </DropdownMenuItem>
                          );
                        })}

                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>계정 관리</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {/* 비밀번호 초기화 */}
                        <DropdownMenuItem onClick={() => handleResetPassword(user.id, user.email)}>
                          <KeyRound className="w-4 h-4 mr-2" />
                          비밀번호 초기화
                        </DropdownMenuItem>

                        {/* 인증 메일 재발송 (미인증 사용자만) */}
                        {!user.email_confirmed_at && (
                          <DropdownMenuItem
                            onClick={() => handleResendVerification(user.id, user.email)}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            인증 메일 재발송
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        {/* 계정 삭제 */}
                        <DropdownMenuItem
                          onClick={() => setDeleteTargetUser(user)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          계정 삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteTargetUser} onOpenChange={() => setDeleteTargetUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>사용자 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 <span className="font-semibold text-gray-900">{deleteTargetUser?.email}</span>{' '}
              계정을 삭제하시겠습니까?
              <br />
              <span className="text-red-600">이 작업은 되돌릴 수 없습니다.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTargetUser && handleDeleteUser(deleteTargetUser)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
