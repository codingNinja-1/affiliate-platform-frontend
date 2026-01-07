'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAdminTransactions, type AdminTransaction } from '@/hooks/useAdmin';
import AdminSidebar from '@/app/components/AdminSidebar';
import { Card } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';

export default function AdminTransactionsPage() {
  const { user, hydrated } = useAuth();
  const { data: transactions, isLoading, error } = useAdminTransactions();

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
          <h1 className="mt-2 text-4xl font-bold">Transactions Management</h1>
          <p className="text-slate-400">View all platform transactions</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-100">
            {error.message}
          </div>
        )}

        <Card>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-800" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p>No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-800">
                  <tr className="text-left text-slate-400">
                    <th className="pb-3 px-4">Transaction Ref</th>
                    <th className="pb-3 px-4">Amount</th>
                    <th className="pb-3 px-4">Payment Method</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t: AdminTransaction) => (
                    <tr key={t.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono text-xs">{t.transaction_ref}</td>
                      <td className="py-3 px-4">₦{t.amount.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                          t.payment_method === 'bank_transfer' ? 'bg-blue-500/20 text-blue-300' :
                          t.payment_method === 'paystack' ? 'bg-green-500/20 text-green-300' :
                          t.payment_method === 'stripe' ? 'bg-purple-500/20 text-purple-200' :
                          'bg-slate-500/20 text-slate-300'
                        }`}>
                          {t.payment_method || 'n/a'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge tone={
                          t.status === 'completed' ? 'success' :
                          t.status === 'pending' ? 'warning' :
                          t.status === 'processing' ? 'muted' :
                          t.status === 'settled' ? 'success' :
                          'danger'
                        }>{t.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
