'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ReportSummary = {
  totalUsers: number;
  totalRevenue: number;
  totalCommissions: number;
  totalWithdrawals: number;
  activeVendors: number;
  activeAffiliates: number;
};

export default function AdminReportsPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !['admin', 'superadmin'].includes(user.user_type)) {
      window.location.href = '/dashboard';
      return;
    }

    const loadReports = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        const res = await fetch(`${apiUrl}/api/admin/reports?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to load reports');

        const data = await res.json();
        setSummary(data.data || null);
      } catch (err) {
        setError('Unable to load reports. Admin API endpoint may not be ready yet.');
        setSummary({
          totalUsers: 0,
          totalRevenue: 0,
          totalCommissions: 0,
          totalWithdrawals: 0,
          activeVendors: 0,
          activeAffiliates: 0,
        });
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [period]);

  const downloadReport = (format: 'csv' | 'pdf') => {
    alert(`Download ${format.toUpperCase()} functionality will be implemented`);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 bg-gray-50 px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">Reports & audits</h1>
          <p className="text-sm text-gray-600">Platform analytics and financial reports</p>
        </div>
        <div className="flex gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
          
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={() => downloadReport('csv')}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
          >
            Export CSV
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Total users"
          value={summary?.totalUsers.toString() || '0'}
          loading={loading}
        />
        <MetricCard
          title="Total revenue"
          value={`₦${(summary?.totalRevenue || 0).toLocaleString()}`}
          loading={loading}
        />
        <MetricCard
          title="Total commissions"
          value={`₦${(summary?.totalCommissions || 0).toLocaleString()}`}
          loading={loading}
        />
        <MetricCard
          title="Total withdrawals"
          value={`₦${(summary?.totalWithdrawals || 0).toLocaleString()}`}
          loading={loading}
        />
        <MetricCard
          title="Active vendors"
          value={summary?.activeVendors.toString() || '0'}
          loading={loading}
        />
        <MetricCard
          title="Active affiliates"
          value={summary?.activeAffiliates.toString() || '0'}
          loading={loading}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Revenue breakdown</h2>
          <div className="flex h-48 items-center justify-center text-gray-500">
            <p>Chart visualization coming soon</p>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">User growth</h2>
          <div className="flex h-48 items-center justify-center text-gray-500">
            <p>Chart visualization coming soon</p>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Transaction logs</h2>
        <div className="py-8 text-center text-gray-500">
          <p>Recent transactions and audit trail will appear here</p>
          <p className="mt-2 text-sm">Hook this to the transactions API endpoint</p>
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  title,
  value,
  loading,
}: {
  title: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-600">{title}</p>
      {loading ? (
        <div className="mt-3 h-7 w-32 animate-pulse rounded bg-gray-100" />
      ) : (
        <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
      )}
    </div>
  );
}
