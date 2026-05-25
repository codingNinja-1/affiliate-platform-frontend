'use client';

import React, { useState, useEffect } from 'react';
import { Home, ShoppingBag, Users, CreditCard, TrendingUp, BarChart3, DollarSign, Settings, Mail, Link2, Plus, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_BASE = '/api';

interface DashboardStats {
  totalRevenue: number;
  totalClicks: number;
  totalConversions: number;
  totalPayouts: number;
}

interface Affiliate {
  id: string;
  name: string;
  email: string;
  clicks: number;
  commission: number;
  status: string;
}

// Sidebar Component
const Sidebar = ({ currentPage, setCurrentPage }: { currentPage: string; setCurrentPage: (page: string) => void }) => {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'marketplace', icon: ShoppingBag, label: 'Marketplace' },
    { id: 'affiliates', icon: Users, label: 'Affiliates' },
    { id: 'transactions', icon: CreditCard, label: 'Transactions', badge: 'New' },
    { id: 'referrals', icon: TrendingUp, label: 'Referrals' },
    { id: 'reports', icon: BarChart3, label: 'Reports' },
    { id: 'payouts', icon: DollarSign, label: 'Payouts' },
  ];

  const preferences = [
    { id: 'campaign-settings', icon: Settings, label: 'Campaign Settings' },
    { id: 'integrations', icon: Link2, label: 'Integrations' },
    { id: 'email-settings', icon: Mail, label: 'Email Settings', badge: 'New' },
  ];

  return (
    <div className="w-60 bg-gray-50 h-screen flex flex-col border-r border-gray-200 fixed left-0 top-0">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">A</span>
          </div>
          <span className="text-xl font-bold">AffiliateHub</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <div className="mb-6">
          <p className="text-xs text-gray-500 px-3 mb-2">Dashboard</p>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg mb-1 ${
                currentPage === item.id ? 'bg-white shadow-sm' : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className="text-gray-600" />
                <span className="text-sm">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{item.badge}</span>
              )}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <p className="text-xs text-gray-500 px-3 mb-2">Preferences</p>
          {preferences.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg mb-1 ${
                currentPage === item.id ? 'bg-white shadow-sm' : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className="text-gray-600" />
                <span className="text-sm">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{item.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-red-600 font-medium"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
};

// Dashboard Page
const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalPayouts: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${API_BASE}/admin/dashboard/summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        if (res.ok) {
          const data = await res.json();
          setStats(data.data || {});
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus size={20} />
          New Campaign
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold">₦{stats.totalRevenue?.toLocaleString() || '0'}</p>
              <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">+5%</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">↗ From last month</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Clicks</p>
              <p className="text-3xl font-bold">{stats.totalClicks?.toLocaleString() || '0'}</p>
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">-2.5%</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">↘ From last month</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Conversions</p>
              <p className="text-3xl font-bold">{stats.totalConversions?.toLocaleString() || '0'}</p>
              <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">+4.5%</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">↗ From last month</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Payouts</p>
              <p className="text-3xl font-bold">₦{stats.totalPayouts?.toLocaleString() || '0'}</p>
              <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">+5%</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">↗ From last month</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            📊 Chart Coming Soon
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              href="/admin/products"
              className="block bg-blue-50 hover:bg-blue-100 p-3 rounded-lg text-sm font-medium text-blue-600"
            >
              → Manage Products
            </Link>
            <Link
              href="/admin/withdrawals"
              className="block bg-green-50 hover:bg-green-100 p-3 rounded-lg text-sm font-medium text-green-600"
            >
              → Review Withdrawals
            </Link>
            <Link
              href="/admin/users"
              className="block bg-purple-50 hover:bg-purple-100 p-3 rounded-lg text-sm font-medium text-purple-600"
            >
              → Manage Users
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Affiliates Page
const Affiliates = () => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);

  useEffect(() => {
    const fetchAffiliates = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${API_BASE}/admin/affiliates`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        if (res.ok) {
          const data = await res.json();
          setAffiliates(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching affiliates:', err);
      }
    };

    fetchAffiliates();
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Affiliates</h1>
          <p className="text-sm text-gray-600">Manage your affiliate partners</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus size={20} />
          Add Affiliate
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Email</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Clicks</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Commission</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((affiliate) => (
                <tr key={affiliate.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="font-medium text-blue-600">{affiliate.name?.charAt(0)}</span>
                      </div>
                      <span className="font-medium">{affiliate.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{affiliate.email}</td>
                  <td className="p-4 text-sm">{affiliate.clicks || 0}</td>
                  <td className="p-4 text-sm">₦{affiliate.commission?.toLocaleString() || '0'}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-600">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
    </div>
  );
};

// Empty pages for other sections
const Transactions = () => <div className="p-8"><h1 className="text-2xl font-bold">Transactions</h1></div>;
const Referrals = () => <div className="p-8"><h1 className="text-2xl font-bold">Referrals</h1></div>;
const Reports = () => <div className="p-8"><h1 className="text-2xl font-bold">Reports</h1></div>;
const Payouts = () => <div className="p-8"><h1 className="text-2xl font-bold">Payouts</h1></div>;
const Marketplace = () => <div className="p-8"><h1 className="text-2xl font-bold">Marketplace</h1></div>;
const CampaignSettings = () => <div className="p-8"><h1 className="text-2xl font-bold">Campaign Settings</h1></div>;
const Integrations = () => <div className="p-8"><h1 className="text-2xl font-bold">Integrations</h1></div>;
const EmailSettings = () => <div className="p-8"><h1 className="text-2xl font-bold">Email Settings</h1></div>;

// Main App
export default function AdminApp() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
    }
  }, [router]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'marketplace': return <Marketplace />;
      case 'affiliates': return <Affiliates />;
      case 'transactions': return <Transactions />;
      case 'referrals': return <Referrals />;
      case 'reports': return <Reports />;
      case 'payouts': return <Payouts />;
      case 'campaign-settings': return <CampaignSettings />;
      case 'integrations': return <Integrations />;
      case 'email-settings': return <EmailSettings />;
      default: return <Dashboard />;
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
