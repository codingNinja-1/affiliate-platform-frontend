'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Search,
  Filter,
  MoreVertical,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  Home,
  ShoppingBag,
  CreditCard,
  BarChart3,
  Settings,
  Mail,
  Link2,
  ChevronLeft,
} from 'lucide-react';

interface Affiliate {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  total_earnings?: number;
  total_referrals?: number;
  total_clicks?: number;
  approval_date?: string;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.134:8000/api').replace(/\/$/, '');

// Reuse the modern admin sidebar from the dashboard styling
const Sidebar = () => {
  const router = useRouter();
  
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', path: '/admin' },
    { id: 'users', icon: Users, label: 'Users', path: '/admin/users' },
    { id: 'products', icon: ShoppingBag, label: 'Products', path: '/admin/products' },
    { id: 'transactions', icon: CreditCard, label: 'Transactions', path: '/admin/transactions' },
    { id: 'withdrawals', icon: DollarSign, label: 'Withdrawals', path: '/admin/withdrawals' },
    { id: 'affiliates', icon: TrendingUp, label: 'Affiliates', path: '/admin/affiliates' },
    { id: 'vendors', icon: BarChart3, label: 'Vendors', path: '/admin/vendors' },
  ];

  const preferences = [
    { id: 'settings', icon: Settings, label: 'Settings', path: '/admin/settings' },
    { id: 'integrations', icon: Link2, label: 'Integrations', path: '/admin/integrations' },
    { id: 'email', icon: Mail, label: 'Email', path: '/admin/email' },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">AffiliateHub</h1>
        <p className="text-xs text-gray-500 mt-1">Admin Panel</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">Dashboard</p>
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === 'affiliates';
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">Preferences</p>
          <div className="space-y-1">
            {preferences.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.path)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminAffiliatesPage() {
  const { user, hydrated } = useAuth();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    total_affiliates: 0,
    active_affiliates: 0,
    total_earnings: 0,
    total_referrals: 0,
  });

  useEffect(() => {
    if (hydrated && user && user.user_type?.toLowerCase() !== 'admin' && user.user_type?.toLowerCase() !== 'superadmin') {
      window.location.href = '/dashboard';
    }
  }, [hydrated, user]);

  useEffect(() => {
    if (!hydrated || !user) return;

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
          
          // Calculate stats
          const active = (data.data || []).filter((a: Affiliate) => {
            const s = (a.status || '').toLowerCase();
            return s === 'approved' || s === 'active';
          }).length;
          const totalEarnings = (data.data || []).reduce((sum: number, a: Affiliate) => {
            const earnings = parseFloat(a.total_earnings as any) || 0;
            return sum + earnings;
          }, 0);
          const totalReferrals = (data.data || []).reduce((sum: number, a: Affiliate) => sum + (a.total_referrals || 0), 0);
          
          setStats({
            total_affiliates: data.data?.length || 0,
            active_affiliates: active,
            total_earnings: totalEarnings,
            total_referrals: totalReferrals,
          });
        }
      } catch (err) {
        console.error('Failed to fetch affiliates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAffiliates();
  }, [hydrated, user]);

  const filteredAffiliates = affiliates.filter(
    (affiliate) =>
      affiliate.first_name.toLowerCase().includes(search.toLowerCase()) ||
      affiliate.last_name.toLowerCase().includes(search.toLowerCase()) ||
      affiliate.email.toLowerCase().includes(search.toLowerCase())
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="flex-1 p-8">
          <div className="h-screen flex items-center justify-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || (user.user_type?.toLowerCase() !== 'admin' && user.user_type?.toLowerCase() !== 'superadmin')) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="ml-60 flex-1 overflow-y-auto p-8">
        <div className="mb-8">
          <button 
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            <ChevronLeft size={16} />
            Back to admin dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Affiliates Management</h1>
          <p className="text-gray-600">Manage affiliate accounts and performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Affiliates</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total_affiliates}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Affiliates</p>
                <p className="text-3xl font-bold text-gray-900">{stats.active_affiliates}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                <p className="text-3xl font-bold text-gray-900">
                  ₦{stats.total_earnings >= 1000000 
                    ? `${(stats.total_earnings / 1000000).toFixed(1)}M` 
                    : stats.total_earnings.toLocaleString()}
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <DollarSign className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Referrals</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total_referrals}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <Eye className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">
              <Filter size={20} />
              Filter
            </button>
          </div>
        </div>

        {/* Affiliates Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">Loading affiliates...</p>
            </div>
          ) : filteredAffiliates.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">{search ? 'No affiliates found matching your search.' : 'No affiliates yet.'}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Referrals</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Earnings</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Clicks</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAffiliates.map((affiliate) => (
                  <tr key={affiliate.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                          {affiliate.first_name.charAt(0)}{affiliate.last_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {affiliate.first_name} {affiliate.last_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{affiliate.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        affiliate.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : affiliate.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {affiliate.status.charAt(0).toUpperCase() + affiliate.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{affiliate.total_referrals || 0}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ₦{(affiliate.total_earnings || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{affiliate.total_clicks || 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {affiliate.approval_date 
                        ? new Date(affiliate.approval_date).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="inline-flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical size={18} className="text-gray-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
