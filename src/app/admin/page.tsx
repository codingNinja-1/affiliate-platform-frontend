'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';

const API_BASE = '/api';

interface DashboardStats {
  app_gross_revenue: number;
  total_transactions: number;
  total_paid_out: number;
  vendor_earnings: number;
  affiliate_earnings: number;
  unpaid_vendor_balance: number;
  unpaid_affiliate_balance: number;
  pending_withdrawals: number;
  active_vendors: number;
  active_affiliates: number;
  total_customers: number;
  approved_products: number;
}

const Dashboard = ({ stats }: { stats: DashboardStats | null }) => (
  <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
    <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:justify-between md:items-center mb-4 sm:mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-xs sm:text-sm text-gray-600">Platform overview and management</p>
      </div>
      <button className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 shadow-sm text-sm sm:text-base w-full sm:w-auto">
        <Plus size={18} />
        New Campaign
      </button>
    </div>

    {/* Quick Setup Guide */}
    <div className="bg-blue-50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-blue-100">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Quick setup guide</h2>
        <button className="text-xs sm:text-sm text-gray-600 hover:text-gray-900">Collapse</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100">
          <div className="h-20 sm:h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-lg mb-3 flex items-center justify-center">
            <div className="text-3xl sm:text-4xl">📊</div>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Customize your account</h3>
          <p className="text-xs text-gray-600">Supercharge your brand identity. Upload your logo to your account.</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100">
          <div className="h-20 sm:h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-lg mb-3 flex items-center justify-center">
            <div className="text-3xl sm:text-4xl">🎯</div>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Create the 1st offer</h3>
          <p className="text-xs text-gray-600">Set up affiliate commissions and add your landing page in under 5 minutes.</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100">
          <div className="h-20 sm:h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center">
            <div className="text-3xl sm:text-4xl">✅</div>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Verify the configuration</h3>
          <p className="text-xs text-gray-600">Test that your affiliates can sign up and generate referral codes. Once you&apos;ve configured the tracking, test the initial click.</p>
        </div>
      </div>
    </div>

    {/* Key Metrics */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
        <p className="text-xs sm:text-sm text-gray-600 mb-2">Revenue</p>
        <div className="flex items-baseline gap-2 mb-2 flex-wrap">
          <p className="text-xl sm:text-3xl font-bold text-gray-900">₦{stats?.app_gross_revenue?.toLocaleString() || '0'}</p>
          <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">+5%</span>
        </div>
        <p className="text-xs text-gray-500">↗ +27.5% From last month</p>
      </div>
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
        <p className="text-xs sm:text-sm text-gray-600 mb-2">Transactions</p>
        <div className="flex items-baseline gap-2 mb-2 flex-wrap">
          <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats?.total_transactions?.toLocaleString() || '0'}</p>
          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">-2.5%</span>
        </div>
        <p className="text-xs text-gray-500">↘ -2.5% From last month</p>
      </div>
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
        <p className="text-xs sm:text-sm text-gray-600 mb-2">Active Affiliates</p>
        <div className="flex items-baseline gap-2 mb-2 flex-wrap">
          <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats?.active_affiliates || '0'}</p>
          <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">+4.5%</span>
        </div>
        <p className="text-xs text-gray-500">↗ +4.5% From last month</p>
      </div>
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
        <p className="text-xs sm:text-sm text-gray-600 mb-2">Total Paid Out</p>
        <div className="flex items-baseline gap-2 mb-2 flex-wrap">
          <p className="text-xl sm:text-3xl font-bold text-gray-900">₦{stats?.total_paid_out?.toLocaleString() || '0'}</p>
          <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">+5%</span>
        </div>
        <p className="text-xs text-gray-500">↗ +5% From last month</p>
      </div>
    </div>

    {/* Performance Overview & Campaign */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
      <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Performance Overview</h3>
          <select className="text-xs sm:text-sm border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5">
            <option>Last Month</option>
            <option>Last 3 Months</option>
            <option>Last 6 Months</option>
          </select>
        </div>
        <div className="h-48 sm:h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
          <div className="text-center">
            <div className="text-3xl sm:text-5xl mb-2">📈</div>
            <p className="text-xs sm:text-sm text-gray-600">Chart visualization coming soon</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Discount campaign</h3>
        <button className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm w-full mb-4">Create Campaign</button>
        <div className="w-40 h-40 mx-auto mb-4 relative flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 rounded-full">
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">Performance Progress</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">₦{stats?.affiliate_earnings?.toLocaleString() || '0'}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center">Affiliates earnings to date</p>
      </div>
    </div>

    {/* Pending Balances */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
        <p className="text-xs sm:text-sm text-gray-600 mb-2">Vendor Unpaid Balance</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900">₦{stats?.unpaid_vendor_balance?.toLocaleString() || '0'}</p>
      </div>
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
        <p className="text-xs sm:text-sm text-gray-600 mb-2">Pending Withdrawals</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats?.pending_withdrawals?.toLocaleString() || '0'}</p>
      </div>
    </div>

    {/* Users & Products */}
    <div>
      <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900">Users & Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs sm:text-sm text-gray-600 mb-2">Active Vendors</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats?.active_vendors?.toLocaleString() || '0'}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs sm:text-sm text-gray-600 mb-2">Active Affiliates</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats?.active_affiliates?.toLocaleString() || '0'}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs sm:text-sm text-gray-600 mb-2">Total Customers</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats?.total_customers?.toLocaleString() || '0'}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs sm:text-sm text-gray-600 mb-2">Approved Products</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats?.approved_products?.toLocaleString() || '0'}</p>
        </div>
      </div>
    </div>
  </div>
);

export default function AdminApp() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const parsed = JSON.parse(user);
      const role = parsed?.user_type?.toLowerCase();
      if (role !== 'admin' && role !== 'superadmin') {
        router.push('/dashboard');
        return;
      }
    } catch {
      router.push('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${API_BASE}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data.data || null);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    fetchStats();
  }, [router]);

  return (
    <div className="flex bg-gray-100 text-gray-900">
      <Sidebar userType="admin" />
      <main className="w-full md:ml-60 flex-1 min-h-screen overflow-y-auto">
        <Dashboard stats={stats} />
      </main>
    </div>
  );
}
