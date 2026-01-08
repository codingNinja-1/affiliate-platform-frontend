'use client';

import React, { useState, useEffect } from 'react';
import { Home, ShoppingBag, Users, CreditCard, TrendingUp, BarChart3, DollarSign, Settings, Mail, Link2, Plus, LogOut, LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.134:8000/api').replace(/\/$/, '');

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

// Sidebar Component
const Sidebar = ({ currentPage, setCurrentPage }: { currentPage: string; setCurrentPage: (page: string) => void }) => {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleNavigation = (id: string, path?: string) => {
    if (path) {
      router.push(path);
    } else {
      setCurrentPage(id);
    }
  };

  const menuItems: Array<{ id: string; icon: LucideIcon; label: string; path?: string; badge?: string }> = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'users', icon: Users, label: 'Users', path: '/admin/users' },
    { id: 'products', icon: ShoppingBag, label: 'Products', path: '/admin/products' },
    { id: 'transactions', icon: CreditCard, label: 'Transactions', path: '/admin/transactions' },
    { id: 'withdrawals', icon: DollarSign, label: 'Withdrawals', path: '/admin/withdrawals' },
    { id: 'affiliates', icon: TrendingUp, label: 'Affiliates', path: '/admin/affiliates' },
    { id: 'reports', icon: BarChart3, label: 'Reports', path: '/admin/reports' },
  ];

  const preferences = [
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'integrations', icon: Link2, label: 'Integrations' },
    { id: 'email', icon: Mail, label: 'Email' },
  ];

  return (
    <div className="w-60 bg-white h-screen flex flex-col border-r border-gray-200 fixed left-0 top-0 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">A</span>
          </div>
          <span className="text-xl font-bold text-gray-900">AffiliateHub</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 mb-3">Dashboard</p>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id, item.path)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                currentPage === item.id 
                  ? 'bg-blue-50 text-blue-600 font-medium' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={currentPage === item.id ? 'text-blue-600' : 'text-gray-500'} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">{item.badge}</span>
              )}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 mb-3">Preferences</p>
          {preferences.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                currentPage === item.id 
                  ? 'bg-blue-50 text-blue-600 font-medium' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={currentPage === item.id ? 'text-blue-600' : 'text-gray-500'} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg hover:bg-red-50 text-red-600 font-medium transition-colors"
        >
          <LogOut size={20} />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};

// Dashboard Page
const Dashboard = ({ stats }: { stats: DashboardStats | null }) => {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600">Platform overview and management</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm">
          <Plus size={20} />
          New Campaign
        </button>
      </div>

      {/* Quick Setup Guide */}
      <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Quick setup guide</h2>
          <button className="text-sm text-gray-600 hover:text-gray-900">Collapse</button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
            <div className="h-24 bg-linear-to-br from-green-100 to-green-200 rounded-lg mb-3 flex items-center justify-center">
              <div className="text-4xl">📊</div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Customize your account</h3>
            <p className="text-xs text-gray-600">Supercharge your brand identity. Upload your logo to your account.</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
            <div className="h-24 bg-linear-to-br from-red-100 to-red-200 rounded-lg mb-3 flex items-center justify-center">
              <div className="text-4xl">🎯</div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Create the 1st offer</h3>
            <p className="text-xs text-gray-600">Set up affiliate commissions and add your landing page in under 5 minutes.</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
            <div className="h-24 bg-linear-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center">
              <div className="text-4xl">✅</div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Verify the configuration</h3>
            <p className="text-xs text-gray-600">Test that your affiliates can sign up and generate referral codes.</p>
            <p className="text-xs text-gray-600">Once you&apos;ve configured the tracking, test the initial click.</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600 mb-2">Revenue</p>
          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-3xl font-bold text-gray-900">₦{stats?.app_gross_revenue?.toLocaleString() || '0'}</p>
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">+5%</span>
          </div>
          <p className="text-xs text-gray-500">↗ +27.5% From last month</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600 mb-2">Transactions</p>
          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-3xl font-bold text-gray-900">{stats?.total_transactions?.toLocaleString() || '0'}</p>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">-2.5%</span>
          </div>
          <p className="text-xs text-gray-500">↘ -2.5% From last month</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600 mb-2">Conversions</p>
          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-3xl font-bold text-gray-900">{stats?.active_affiliates || '47'}</p>
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">+4.5%</span>
          </div>
          <p className="text-xs text-gray-500">↗ +4.5% From last month</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600 mb-2">Payouts</p>
          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-3xl font-bold text-gray-900">₦{stats?.total_paid_out?.toLocaleString() || '0'}</p>
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">+5%</span>
          </div>
          <p className="text-xs text-gray-500">↗ +5% From last month</p>
        </div>
      </div>

      {/* Performance Overview and Campaign */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5">
              <option>Last Month</option>
              <option>Last 3 Months</option>
              <option>Last 6 Months</option>
            </select>
          </div>
          <div className="h-64 flex items-center justify-center bg-linear-to-br from-blue-50 to-purple-50 rounded-lg">
            <div className="text-center">
              <div className="text-5xl mb-2">📈</div>
              <p className="text-gray-600">Chart visualization coming soon</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Discount campaign</h3>
          <div className="text-center">
            <div className="w-48 h-48 mx-auto mb-4 relative flex items-center justify-center bg-linear-to-br from-purple-100 to-blue-100 rounded-full">
              <div>
                <p className="text-xs text-gray-600 mb-1">Performance Progress</p>
                <p className="text-3xl font-bold text-gray-900">₦{stats?.affiliate_earnings?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Earnings & Balances */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Earnings</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-600 mb-2">Vendor Earnings</p>
              <p className="text-2xl font-bold text-gray-900">₦{stats?.vendor_earnings?.toLocaleString() || '0'}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-600 mb-2">Affiliate Earnings</p>
              <p className="text-2xl font-bold text-gray-900">₦{stats?.affiliate_earnings?.toLocaleString() || '0'}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-600 mb-2">App Commission</p>
              <p className="text-2xl font-bold text-gray-900">₦{stats?.app_gross_revenue && stats?.vendor_earnings && stats?.affiliate_earnings 
                ? (stats.app_gross_revenue - stats.vendor_earnings - stats.affiliate_earnings).toLocaleString()
                : '0'}</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Pending Balances</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-600 mb-2">Vendor Unpaid</p>
              <p className="text-2xl font-bold text-gray-900">₦{stats?.unpaid_vendor_balance?.toLocaleString() || '0'}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-600 mb-2">Affiliate Unpaid</p>
              <p className="text-2xl font-bold text-gray-900">₦{stats?.unpaid_affiliate_balance?.toLocaleString() || '0'}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-600 mb-2">Pending Withdrawals</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.pending_withdrawals?.toLocaleString() || '0'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users & Products */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Users & Products</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-2">Active Vendors</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.active_vendors || '0'}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-2">Active Affiliates</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.active_affiliates || '0'}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-2">Total Customers</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.total_customers || '0'}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-2">Approved Products</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.approved_products || '0'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Empty pages for other sections
const SettingsPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Settings</h1></div>;
const IntegrationsPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Integrations</h1></div>;
const EmailPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Email Settings</h1></div>;

// Main App
export default function AdminApp() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${API_BASE}/admin/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
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

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard stats={stats} />;
      case 'settings': return <SettingsPage />;
      case 'integrations': return <IntegrationsPage />;
      case 'email': return <EmailPage />;
      default: return <Dashboard stats={stats} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="ml-60 flex-1 overflow-y-auto">
        {renderPage()}
      </div>
    </div>
  );
}
