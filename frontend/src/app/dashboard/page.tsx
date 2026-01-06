'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type User = {
  id: number;
  first_name?: string;
  last_name?: string;
  email: string;
  user_type?: string;
};

type DashboardSummary = {
  balance: number;
  totalEarnings: number;
  totalWithdrawn: number;
  pendingBalance: number;
  totalSales: number;
  totalClicks: number;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');

    if (!storedUser || !token) {
      window.location.href = '/login';
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Redirect admins to admin dashboard
      const userType = parsedUser?.user_type?.toLowerCase();
      if (userType === 'admin' || userType === 'superadmin') {
        window.location.href = '/admin';
        return;
      }
    } catch (err) {
      console.error('Failed to parse stored user', err);
    }

    const loadSummary = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/dashboard/summary', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Unable to load dashboard data');
        }

        const data = await res.json();

        setSummary({
          balance: Number(data?.data?.balance ?? 0),
          totalEarnings: Number(data?.data?.total_earnings ?? 0),
          totalWithdrawn: Number(data?.data?.total_withdrawn ?? 0),
          pendingBalance: Number(data?.data?.pending_balance ?? 0),
          totalSales: Number(data?.data?.total_sales ?? 0),
          totalClicks: Number(data?.data?.total_clicks ?? 0),
        });
      } catch (err) {
        console.warn('Dashboard summary fallback', err);
        setError('Live dashboard data is unavailable. Showing placeholders.');
        // Fallback placeholders so the page is not empty
        setSummary({
          balance: 0,
          totalEarnings: 0,
          totalWithdrawn: 0,
          pendingBalance: 0,
          totalSales: 0,
          totalClicks: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const fullName = user?.first_name || user?.last_name
    ? `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim()
    : user?.email;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 bg-slate-950 px-6 py-10 text-white">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">{greeting}, {fullName ?? 'there'}</p>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-500">Account overview and quick actions</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/profile"
            className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500"
          >
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
          >
            Log out
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      )}

      <RoleSections userType={user?.user_type} summary={summary} loading={loading} />
    </main>
  );
}

function RoleSections({
  userType,
  summary,
  loading,
}: {
  userType?: string;
  summary: DashboardSummary | null;
  loading: boolean;
}) {
  const type = userType?.toLowerCase();

  if (type === 'vendor') {
    return (
      <>
        <StatsGrid
          items={[
            { title: 'Balance', value: summary?.balance ?? 0, prefix: '₦' },
            { title: 'Total earnings', value: summary?.totalEarnings ?? 0, prefix: '₦' },
            { title: 'Total withdrawn', value: summary?.totalWithdrawn ?? 0, prefix: '₦' },
            { title: 'Total sales', value: summary?.totalSales ?? 0 },
            { title: 'Pending payouts', value: summary?.pendingBalance ?? 0, prefix: '₦' },
          ]}
          loading={loading}
        />

        <Panels
          primaryTitle="Sales & payouts"
          primaryHint="Hook this to vendor orders and payout queue."
          actions={[
            { href: '/products', label: 'Manage products' },
            { href: '/withdrawals', label: 'Request payout' },
            { href: '/analytics', label: 'View sales analytics' },
          ]}
        />
      </>
    );
  }

  if (type === 'affiliate') {
    return (
      <>
        <StatsGrid
          items={[
            { title: 'Balance', value: summary?.balance ?? 0, prefix: '₦' },
            { title: 'Pending balance', value: summary?.pendingBalance ?? 0, prefix: '₦' },
            { title: 'Total earnings', value: summary?.totalEarnings ?? 0, prefix: '₦' },
            { title: 'Total withdrawn', value: summary?.totalWithdrawn ?? 0, prefix: '₦' },
            { title: 'Total sales', value: summary?.totalSales ?? 0 },
            { title: 'Total clicks', value: summary?.totalClicks ?? 0 },
          ]}
          loading={loading}
        />

        <Panels
          primaryTitle="Affiliate performance"
          primaryHint="Connect this to conversions and commissions."
          actions={[
            { href: '/links', label: 'Get referral links' },
            { href: '/withdrawals', label: 'Request withdrawal' },
            { href: '/analytics', label: 'View funnel analytics' },
          ]}
        />
      </>
    );
  }

  // Superadmin / admin default
  return (
    <>
      <StatsGrid
        items={[
          { title: 'Platform balance', value: summary?.balance ?? 0, prefix: '₦' },
          { title: 'Total payouts', value: summary?.totalWithdrawn ?? 0, prefix: '₦' },
          { title: 'Pending liabilities', value: summary?.pendingBalance ?? 0, prefix: '₦' },
          { title: 'Total sales', value: summary?.totalSales ?? 0 },
          { title: 'Total clicks', value: summary?.totalClicks ?? 0 },
        ]}
        loading={loading}
      />

      <Panels
        primaryTitle="Operations overview"
        primaryHint="Attach admin metrics: top vendors, top affiliates, dispute queue."
        actions={[
          { href: '/admin/users', label: 'Manage users' },
          { href: '/admin/payouts', label: 'Payout approvals' },
          { href: '/admin/reports', label: 'Reports & audits' },
        ]}
      />
    </>
  );
}

function StatsGrid({
  items,
  loading,
}: {
  items: { title: string; value: number; prefix?: string }[];
  loading: boolean;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <StatCard
          key={item.title}
          title={item.title}
          value={item.value}
          prefix={item.prefix}
          loading={loading}
        />
      ))}
    </section>
  );
}

function Panels({
  primaryTitle,
  primaryHint,
  actions,
}: {
  primaryTitle: string;
  primaryHint: string;
  actions: { href: string; label: string }[];
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl lg:col-span-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{primaryTitle}</h2>
          <span className="text-xs text-slate-400">Coming soon</span>
        </div>
        <p className="mt-3 text-sm text-slate-400">{primaryHint}</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-white">Quick actions</h2>
        <div className="mt-3 flex flex-col gap-3 text-sm text-slate-200">
          {actions.map((action) => (
            <Link
              key={action.href}
              className="rounded-md border border-slate-700 px-3 py-2 hover:border-slate-500"
              href={action.href}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({
  title,
  value,
  prefix,
  loading,
}: {
  title: string;
  value: number;
  prefix?: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
      <p className="text-sm text-slate-400">{title}</p>
      {loading ? (
        <div className="mt-3 h-7 w-32 animate-pulse rounded bg-slate-800" />
      ) : (
        <p className="mt-2 text-2xl font-semibold text-white">
          {prefix ?? ''}
          {value.toLocaleString()}
        </p>
      )}
    </div>
  );
}
