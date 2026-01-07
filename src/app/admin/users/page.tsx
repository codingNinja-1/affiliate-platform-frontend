'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAdminUsers, type AdminUser } from '@/hooks/useAdmin';
import AdminSidebar from '@/app/components/AdminSidebar';

export default function AdminUsersPage() {
  const { user, hydrated } = useAuth();
  const { data: users, isLoading, error } = useAdminUsers();

  useEffect(() => {
    if (hydrated && user && user.user_type?.toLowerCase() !== 'admin' && user.user_type?.toLowerCase() !== 'superadmin') {
      window.location.href = '/dashboard';
    }
  }, [hydrated, user]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-white">
        <div className="flex-1 p-8">
          <div className="h-screen flex items-center justify-center">
            <p className="text-slate-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || (user.user_type?.toLowerCase() !== 'admin' && user.user_type?.toLowerCase() !== 'superadmin')) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <AdminSidebar />
      
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-blue-400 hover:text-blue-300">
            ← Back to admin dashboard
          </Link>
          <h1 className="mt-2 text-4xl font-bold">Users Management</h1>
          <p className="text-slate-400">Manage all platform users</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-100">
            {error.message}
          </div>
        )}

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-800" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p>No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-800">
                  <tr className="text-left text-slate-400">
                    <th className="pb-3 px-4">Email</th>
                    <th className="pb-3 px-4">Name</th>
                    <th className="pb-3 px-4">Type</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 px-4">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: AdminUser) => (
                    <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-3 px-4">{u.email}</td>
                      <td className="py-3 px-4">
                        {u.first_name || u.last_name ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                          u.user_type === 'admin' ? 'bg-red-500/20 text-red-300' :
                          u.user_type === 'vendor' ? 'bg-blue-500/20 text-blue-300' :
                          u.user_type === 'affiliate' ? 'bg-green-500/20 text-green-300' :
                          'bg-slate-500/20 text-slate-300'
                        }`}>
                          {u.user_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                          u.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-slate-500/20 text-slate-300'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
