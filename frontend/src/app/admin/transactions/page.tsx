'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAdminTransactions, type AdminTransaction } from '@/hooks/useAdmin';
import { Home, Users, Package, CreditCard, DollarSign, Building2, TrendingUp, Settings, Mail, Plug, ChevronLeft, Menu, X } from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (open: boolean) => void }) => {
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
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="fixed left-4 top-4 z-50 md:hidden rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      <div className={`w-60 bg-white h-screen flex flex-col border-r border-gray-200 fixed left-0 top-0 shadow-sm transition-transform duration-300 z-40 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
                const isActive = item.id === 'transactions';
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
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 md:hidden" 
          onClick={() => setIsOpen(false)} 
        />
      )}
    </>
  );
};

export default function AdminTransactionsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const { data: transactions, isLoading, error } = useAdminTransactions();

  useEffect(() => {
    if (hydrated && user && user.user_type?.toLowerCase() !== 'admin' && user.user_type?.toLowerCase() !== 'superadmin') {
      window.location.href = '/dashboard';
    }
  }, [hydrated, user]);

  if (!hydrated) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
        <div className="w-full md:ml-60 flex-1 flex items-center justify-center">
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
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      
      <main className="w-full md:ml-60 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="mb-8">
          <button 
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            <ChevronLeft size={16} />
            Back to admin dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Transactions Management</h1>
          <p className="text-gray-600 mt-1">View all platform transactions</p>
        </div>
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            {error.message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center">
              <CreditCard size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-900">No transactions found</p>
              <p className="text-sm text-gray-500 mt-1">Transactions will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Transaction Ref</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Payment Method</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t: AdminTransaction) => (
                    <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-gray-600">{t.transaction_ref}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">₦{t.amount.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          t.payment_method === 'paystack' ? 'bg-green-100 text-green-800' :
                          t.payment_method === 'credit_card' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {t.payment_method || 'credit_card'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          t.status === 'completed' ? 'bg-green-100 text-green-800' :
                          t.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          t.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
