'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import AdminSidebar from '@/app/components/AdminSidebar';

export default function AdminAffiliatesPage() {
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.user_type?.toLowerCase() !== 'admin' && user.user_type?.toLowerCase() !== 'superadmin') {
      window.location.href = '/dashboard';
    }
  }, [user]);

  if (!user || (user.user_type?.toLowerCase() !== 'admin' && user.user_type?.toLowerCase() !== 'superadmin')) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <AdminSidebar userType={user?.user_type} />
      
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-blue-400 hover:text-blue-300">
            ← Back to admin dashboard
          </Link>
          <h1 className="mt-2 text-4xl font-bold">Affiliates Management</h1>
          <p className="text-slate-400">Manage affiliate accounts and performance</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 shadow-xl text-center">
          <p className="text-slate-400 mb-4">Affiliates management page</p>
          <p className="text-slate-500 text-sm">Coming soon - Advanced affiliate management tools</p>
        </div>
      </main>
    </div>
  );
}
