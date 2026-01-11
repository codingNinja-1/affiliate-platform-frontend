'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAdminWithdrawals, type AdminWithdrawal } from '@/hooks/useAdmin';
import { Home, Users, Package, CreditCard, DollarSign, Building2, TrendingUp, Settings, Mail, Plug, ChevronLeft, Menu, X } from 'lucide-react';

const API_BASE = '/api';

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
                const isActive = item.id === 'withdrawals';
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

export default function AdminWithdrawalsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const { data: withdrawals, isLoading, error, refetch } = useAdminWithdrawals();
  const [approving, setApproving] = useState<number | null>(null);
  const [denying, setDenying] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (hydrated && user && user.user_type?.toLowerCase() !== 'admin' && user.user_type?.toLowerCase() !== 'superadmin') {
      window.location.href = '/dashboard';
    }
  }, [hydrated, user]);

  // Don't render until hydrated on client
  if (!isMounted || !hydrated) {
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

  const approveWithdrawal = async (withdrawalId: number) => {
    setApproving(withdrawalId);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        return;
      }

      const url = `${API_BASE}/admin/withdrawals/${withdrawalId}/approve`;
      
      console.log('Attempting to approve withdrawal:', { url, withdrawalId, hasToken: !!token });
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('Response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('Success response:', data);
        alert(data.message || 'Withdrawal approved successfully');
        refetch();
      } else {
        const data = await res.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Error response:', { status: res.status, data });
        alert(data.message || `Failed to approve withdrawal (${res.status})`);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert(`Error approving withdrawal: ${error instanceof Error ? error.message : 'Network error'}. Make sure the backend server is running at http://127.0.0.1:8000`);
    } finally {
      setApproving(null);
    }
  };

  const denyWithdrawal = async (withdrawalId: number) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason || reason.trim() === '') {
      alert('Rejection reason is required.');
      return;
    }

    setDenying(withdrawalId);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        return;
      }

      const url = `${API_BASE}/admin/withdrawals/${withdrawalId}/reject`;
      
      console.log('Attempting to deny withdrawal:', { url, withdrawalId, hasToken: !!token });
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      console.log('Response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('Success response:', data);
        alert(data.message || 'Withdrawal denied successfully');
        refetch();
      } else {
        const data = await res.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Error response:', { status: res.status, data });
        alert(data.message || `Failed to deny withdrawal (${res.status})`);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert(`Error denying withdrawal: ${error instanceof Error ? error.message : 'Network error'}. Make sure the backend server is running at http://127.0.0.1:8000`);
    } finally {
      setDenying(null);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Withdrawals Management</h1>
          <p className="text-gray-600 mt-1">Approve and manage withdrawal requests</p>
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
          ) : withdrawals.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <DollarSign size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No withdrawals found</p>
              <p className="text-sm text-gray-400 mt-1">Withdrawal requests will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">User ID</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Method</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Requested</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w: AdminWithdrawal) => (
                    <tr key={w.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-900">#{w.user_id}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">₦{w.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{w.payment_method || 'bank_transfer'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          w.status === 'paid' || w.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          w.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(w.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {w.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => approveWithdrawal(w.id)}
                              disabled={approving === w.id || denying === w.id}
                              className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {approving === w.id ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => denyWithdrawal(w.id)}
                              disabled={approving === w.id || denying === w.id}
                              className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {denying === w.id ? 'Denying...' : 'Deny'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">{w.status}</span>
                        )}
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
