'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAdminDashboard } from '@/hooks/useAdmin';
import AdminSidebar from '@/app/components/AdminSidebar';

export default function AdminPage() {
  const { user, hydrated } = useAuth();
  const { data: metrics, isLoading } = useAdminDashboard();

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

  const statCard = (title: string, value: string | number, icon: string) => (
    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-6 shadow-lg">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-bold text-white">{icon} {value}</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <AdminSidebar userType={user?.user_type} />
      
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-blue-400 hover:text-blue-300">
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-slate-400">Platform overview and management</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-800" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Revenue Section */}
            <div>
              <h2 className="mb-4 text-xl font-semibold">Revenue Overview</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {statCard('App Gross Revenue', metrics?.app_gross_revenue ? `₦${(metrics.app_gross_revenue).toLocaleString()}` : '₦0', '💰')}
                {statCard('Total Transactions', metrics?.total_transactions || 0, '💳')}
                {statCard('Total Paid Out', metrics?.total_paid_out ? `₦${(metrics.total_paid_out).toLocaleString()}` : '₦0', '✅')}
              </div>
            </div>

            {/* Earnings Section */}
            <div>
              <h2 className="mb-4 text-xl font-semibold">Earnings</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {statCard('Vendor Earnings', metrics?.vendor_earnings ? `₦${(metrics.vendor_earnings).toLocaleString()}` : '₦0', '🏪')}
                {statCard('Affiliate Earnings', metrics?.affiliate_earnings ? `₦${(metrics.affiliate_earnings).toLocaleString()}` : '₦0', '🤝')}
                {statCard('App Commission', metrics?.app_gross_revenue && metrics?.vendor_earnings && metrics?.affiliate_earnings 
                  ? `₦${(metrics.app_gross_revenue - metrics.vendor_earnings - metrics.affiliate_earnings).toLocaleString()}` 
                  : '₦0', '📈')}
              </div>
            </div>

            {/* Pending Balances */}
            <div>
              <h2 className="mb-4 text-xl font-semibold">Pending Balances</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {statCard('Vendor Unpaid', metrics?.unpaid_vendor_balance ? `₦${(metrics.unpaid_vendor_balance).toLocaleString()}` : '₦0', '⏳')}
                {statCard('Affiliate Unpaid', metrics?.unpaid_affiliate_balance ? `₦${(metrics.unpaid_affiliate_balance).toLocaleString()}` : '₦0', '⏳')}
                {statCard('Pending Withdrawals', metrics?.pending_withdrawals || 0, '🔄')}
              </div>
            </div>

            {/* User Stats */}
            <div>
              <h2 className="mb-4 text-xl font-semibold">Users & Products</h2>
              <div className="grid gap-4 md:grid-cols-4">
                {statCard('Active Vendors', metrics?.active_vendors || 0, '🏪')}
                {statCard('Active Affiliates', metrics?.active_affiliates || 0, '🤝')}
                {statCard('Total Customers', metrics?.total_customers || 0, '👥')}
                {statCard('Approved Products', metrics?.approved_products || 0, '📦')}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
              <div className="grid gap-3 md:grid-cols-4">
                <Link
                  href="/admin/users"
                  className="rounded-lg bg-blue-600 px-4 py-3 text-center font-medium hover:bg-blue-500 transition"
                >
                  Manage Users
                </Link>
                <Link
                  href="/admin/products"
                  className="rounded-lg bg-green-600 px-4 py-3 text-center font-medium hover:bg-green-500 transition"
                >
                  Approve Products
                </Link>
                <Link
                  href="/admin/withdrawals"
                  className="rounded-lg bg-purple-600 px-4 py-3 text-center font-medium hover:bg-purple-500 transition"
                >
                  Manage Withdrawals
                </Link>
                <Link
                  href="/admin/transactions"
                  className="rounded-lg bg-cyan-600 px-4 py-3 text-center font-medium hover:bg-cyan-500 transition"
                >
                  View Transactions
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
