'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/common/Button';
import { LogOut, User, Home, Users, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AppHeaderProps {
  user: SupabaseUser | null;
}

export function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || '사용자';

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(path);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* 로고 & 네비게이션 */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[var(--primary-blue)] hover:text-[var(--gradient-end)] transition-colors">
                Ownership AI
              </h1>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-blue-50 text-[var(--primary-blue)] font-medium'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-gray-50'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>대시보드</span>
              </Link>

              <Link
                href="/customers"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/customers')
                    ? 'bg-blue-50 text-[var(--primary-blue)] font-medium'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-gray-50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>고객 관리</span>
              </Link>

              <Link
                href="/programs"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/programs')
                    ? 'bg-blue-50 text-[var(--primary-blue)] font-medium'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>정부지원사업</span>
              </Link>
            </nav>
          </div>

          {/* 사용자 정보 & 로그아웃 */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <User className="w-5 h-5 text-[var(--text-secondary)]" />
              <span className="text-[var(--text-primary)] font-medium">{userName}</span>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">로그아웃</span>
            </Button>
          </div>
        </div>

        {/* 모바일 네비게이션 */}
        <nav className="md:hidden flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
          <Link
            href="/dashboard"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              isActive('/dashboard')
                ? 'bg-blue-50 text-[var(--primary-blue)] font-medium'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-gray-50'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>대시보드</span>
          </Link>

          <Link
            href="/customers"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              isActive('/customers')
                ? 'bg-blue-50 text-[var(--primary-blue)] font-medium'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>고객 관리</span>
          </Link>

          <Link
            href="/programs"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              isActive('/programs')
                ? 'bg-blue-50 text-[var(--primary-blue)] font-medium'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>정부지원사업</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
