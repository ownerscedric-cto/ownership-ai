import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

/**
 * Admin Layout
 * - Dark sidebar navigation
 * - Admin role verification (server-side)
 * - Redirect to home if not admin
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side admin check
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login?redirect=/admin');
  }

  const role = user.app_metadata?.role || 'consultant';

  if (role !== 'admin') {
    redirect('/'); // Redirect non-admin users to home
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
