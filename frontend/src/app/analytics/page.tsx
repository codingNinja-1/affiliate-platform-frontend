'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type AnalyticsData = {
  totalRevenue: number;
  totalSales: number;
  conversionRate: number;
  avgOrderValue: number;
  topProducts?: Array<{
    product_id: number;
    product_name: string;
    sales_count: number;
    revenue: number;
  }>;
  dailySales?: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const loadAnalytics = async () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const prefix = user.user_type === 'vendor' ? 'vendor' : 'affiliate';

      try {
        const res = await fetch(`/api/${prefix}/reports?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to load analytics');

        const data = await res.json();
        setAnalytics(data.data || null);
      } catch (err) {
        setError('Analytics data unavailable. This page will be functional once the API is ready.');
        console.error(err);
        // Set placeholder data
        setAnalytics({
          totalRevenue: 0,
          totalSales: 0,
          conversionRate: 0,
          avgOrderValue: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [period]);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 bg-gray-50 px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-600">Track your performance metrics</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </header>

      {error && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total revenue"
          value={`₦${(analytics?.totalRevenue || 0).toLocaleString()}`}
          loading={loading}
        />
        <MetricCard
          title="Total sales"
          value={(analytics?.totalSales || 0).toString()}
          loading={loading}
        />
        <MetricCard
          title="Growth rate"
          value={`${(analytics?.conversionRate || 0) > 0 ? '+' : ''}${(analytics?.conversionRate || 0).toFixed(2)}%`}
          loading={loading}
        />
        <MetricCard
          title="Avg order value"
          value={`₦${(analytics?.avgOrderValue || 0).toLocaleString()}`}
          loading={loading}
        />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Performance chart</h2>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-32 animate-pulse rounded bg-gray-100" />
          </div>
        ) : analytics?.dailySales && analytics.dailySales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr className="text-left text-gray-600">
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Sales</th>
                  <th className="pb-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.dailySales.map((day, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 text-gray-700">{new Date(day.date).toLocaleDateString()}</td>
                    <td className="py-3 text-right font-medium text-gray-900">{day.sales}</td>
                    <td className="py-3 text-right font-medium text-gray-900">₦{day.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-gray-500">
            <p>No sales data for this period</p>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Top performing items</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ) : analytics?.topProducts && analytics.topProducts.length > 0 ? (
          <div className="space-y-3">
            {analytics.topProducts.map((product, index) => (
              <div
                key={product.product_id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.product_name}</p>
                    <p className="text-sm text-gray-600">{product.sales_count} sales</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-gray-900">₦{product.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <p>No product sales data for this period</p>
          </div>
        )}
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
