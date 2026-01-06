'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAdminWithdrawals, type AdminWithdrawal } from '@/hooks/useAdmin';
import AdminSidebar from '@/app/components/AdminSidebar';

export default function AdminWithdrawalsPage() {
  const { user, hydrated } = useAuth();
  const { data: withdrawals, isLoading, error } = useAdminWithdrawals();
  const [approving, setApproving] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (hydrated && user && user.user_type?.toLowerCase() !== 'admin' && user.user_type?.toLowerCase() !== 'superadmin') {
      window.location.href = '/dashboard';
    }
  }, [hydrated, user]);

  // Don't render until hydrated on client
  if (!isMounted || !hydrated) {
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

  const approveWithdrawal = async (withdrawalId: number) => {
    setApproving(withdrawalId);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiUrl}/api/admin/withdrawals/${withdrawalId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert('Withdrawal approved');
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to approve withdrawal');
      }
    } catch (err) {
      alert('Error approving withdrawal');
    } finally {
      setApproving(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <AdminSidebar userType={user?.user_type} />
      
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-blue-400 hover:text-blue-300">
            ← Back to admin dashboard
          </Link>
          <h1 className="mt-2 text-4xl font-bold">Withdrawals Management</h1>
          <p className="text-slate-400">Approve and manage withdrawal requests</p>
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
          ) : withdrawals.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p>No withdrawals found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-800">
                  <tr className="text-left text-slate-400">
                    <th className="pb-3 px-4">User ID</th>
                    <th className="pb-3 px-4">Amount</th>
                    <th className="pb-3 px-4">Method</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 px-4">Requested</th>
                    <th className="pb-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w: AdminWithdrawal) => (
                    <tr key={w.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-3 px-4">#{w.user_id}</td>
                      <td className="py-3 px-4 font-bold">₦{w.amount.toLocaleString()}</td>
                      <td className="py-3 px-4">{w.payment_method || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                          w.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                          w.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(w.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {w.status === 'pending' ? (
                          <button
                            onClick={() => approveWithdrawal(w.id)}
                            disabled={approving === w.id}
                            className="rounded bg-green-600 px-3 py-1 text-xs font-medium hover:bg-green-500 disabled:opacity-50"
                          >
                            {approving === w.id ? 'Approving...' : 'Approve'}
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">{w.status}</span>
                        )}
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
