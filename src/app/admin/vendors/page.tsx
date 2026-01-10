'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Home, Users, Package, CreditCard, DollarSign, Building2, TrendingUp, Settings, Mail, Plug, ChevronLeft } from 'lucide-react';

const Sidebar = () => {
  const router = useRouter();
  
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', path: '/admin' },
    { id: 'users', icon: Users, label: 'Users', path: '/admin/users' },
    { id: 'products', icon: Package, label: 'Products', path: '/admin/products' },
    { id: 'transactions', icon: CreditCard, label: 'Transactions', path: '/admin/transactions' },
    { id: 'withdrawals', icon: DollarSign, label: 'Withdrawals', path: '/admin/withdrawals' },
    { id: 'affiliates', icon: TrendingUp, label: 'Affiliates', path: '/admin/affiliates' },
    { id: 'vendors', icon: Building2, label: 'Vendors', path: '/admin/vendors' },
  ];

  const preferences = [
    { id: 'settings', icon: Settings, label: 'Settings', path: '/admin/settings' },
    { id: 'integrations', icon: Plug, label: 'Integrations', path: '/admin/integrations' },
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
              const isActive = item.id === 'vendors';
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

export default function AdminVendorsPage() {
  const router = useRouter();
  const { user, hydrated } = useAuth();

  useEffect(() => {
    if (hydrated && user && user.user_type?.toLowerCase() !== 'admin' && user.user_type?.toLowerCase() !== 'superadmin') {
      window.location.href = '/dashboard';
    }
  }, [hydrated, user]);

  if (!hydrated) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="ml-60 flex-1 flex items-center justify-center">
          <p className="text-gray-400">Loading...</p>
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
      
      <main className="ml-60 flex-1 overflow-y-auto p-8">
        <div className="mb-8">
          <button 
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            <ChevronLeft size={16} />
            Back to admin dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Vendors Management</h1>
          <p className="text-gray-600">Manage vendor accounts and performance</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm text-center">
          <p className="text-gray-600 mb-4">Vendors management page</p>
          <p className="text-gray-500 text-sm">Coming soon - Advanced vendor management tools</p>
        </div>
      </main>
    </div>
  );
}
