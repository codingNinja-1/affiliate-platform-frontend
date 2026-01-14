'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAdminUsers, type AdminUser } from '@/hooks/useAdmin';
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
      <button onClick={() => setIsOpen(!isOpen)} className="fixed left-4 top-4 z-50 md:hidden rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 shadow-lg">
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
              const isActive = item.id === 'users';
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
    {isOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, token, hydrated } = useAuth();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending'>('all');
  const { data: users, isLoading, error, refetch } = useAdminUsers(
    statusFilter === 'pending' ? { status: 'pending' } : undefined
  );
  const [actionError, setActionError] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleUpdateStatus = async (id: number, status: 'active' | 'suspended') => {
    if (!token) return;

    setActionError('');
    setActionSuccess('');
    setBusyId(id);

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.message || 'Failed to update user';
        throw new Error(msg);
      }

      setActionSuccess(status === 'active' ? 'User approved' : 'User denied');
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setBusyId(null);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600">Manage all platform users</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-4 text-red-700">
            {error.message}
          </div>
        )}

        {actionError && (
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-red-700 text-sm">
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div className="mb-4 rounded-lg border border-green-100 bg-green-50 p-3 text-green-700 text-sm">
            {actionSuccess}
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-gray-600">Filter:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-full px-3 py-1 text-sm font-medium border ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`rounded-full px-3 py-1 text-sm font-medium border ${
                statusFilter === 'pending'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Pending
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p>No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead className="border-b border-gray-200">
                  <tr className="text-left text-gray-500">
                    <th className="pb-3 px-4">Email</th>
                    <th className="pb-3 px-4">Name</th>
                    <th className="pb-3 px-4">Type</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 px-4">Joined</th>
                    <th className="pb-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: AdminUser) => (
                    <tr key={u.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{u.email}</td>
                      <td className="py-3 px-4 text-gray-800">
                        {u.first_name || u.last_name ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                          u.user_type === 'admin' ? 'bg-red-100 text-red-700' :
                          u.user_type === 'vendor' ? 'bg-blue-100 text-blue-700' :
                          u.user_type === 'affiliate' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {u.user_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                          u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {u.status === 'pending' ? (
                          <>
                            <button
                              disabled={busyId === u.id}
                              onClick={() => handleUpdateStatus(u.id, 'active')}
                              className={`rounded-md px-3 py-1 text-sm font-medium text-white transition-colors ${
                                busyId === u.id ? 'bg-green-300' : 'bg-green-600 hover:bg-green-700'
                              }`}
                            >
                              {busyId === u.id ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                              disabled={busyId === u.id}
                              onClick={() => handleUpdateStatus(u.id, 'suspended')}
                              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                                busyId === u.id ? 'bg-red-200 text-red-600' : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                            >
                              {busyId === u.id ? 'Denying...' : 'Deny'}
                            </button>
                          </>
                        ) : u.status === 'active' ? (
                          <button
                            disabled={busyId === u.id}
                            onClick={() => handleUpdateStatus(u.id, 'suspended')}
                            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                              busyId === u.id ? 'bg-red-200 text-red-600' : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {busyId === u.id ? 'Suspending...' : 'Suspend'}
                          </button>
                        ) : u.status === 'suspended' ? (
                          <button
                            disabled={busyId === u.id}
                            onClick={() => handleUpdateStatus(u.id, 'active')}
                            className={`rounded-md px-3 py-1 text-sm font-medium text-white transition-colors ${
                              busyId === u.id ? 'bg-green-300' : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {busyId === u.id ? 'Reactivating...' : 'Reactivate'}
                          </button>
                        ) : (
                          <button
                            disabled={busyId === u.id}
                            onClick={() => handleUpdateStatus(u.id, 'active')}
                            className={`rounded-md px-3 py-1 text-sm font-medium text-white transition-colors ${
                              busyId === u.id ? 'bg-green-300' : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {busyId === u.id ? 'Activating...' : 'Activate'}
                          </button>
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
