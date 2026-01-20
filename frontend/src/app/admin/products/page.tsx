'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Home, Users, Package, CreditCard, DollarSign, Building2, TrendingUp, Settings, Mail, Plug, ChevronLeft, Menu, X } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  commission_rate: number;
  approval_status: string;
  is_active?: boolean;
  rejection_reason?: string;
  created_at: string;
  // Vendor details
  vendor_id?: number;
  vendor?: {
    id: number;
    user_id: number;
    user?: {
      first_name?: string;
      last_name?: string;
      email: string;
    };
  };
  // Bank/account details
  bank_name?: string;
  account_name?: string;
  account_number?: string;
}

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
              const isActive = item.id === 'products';
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

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.user_type !== 'admin' && user?.user_type !== 'superadmin') {
      router.push('/dashboard');
      return;
    }

    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, router, filter]);

  const loadProducts = async () => {
    setLoading(true);
    setError('');

    try {
      const API_BASE = '/api';
      const statusParam = filter === 'all' ? '' : `?status=${filter}`;

      const res = await fetch(`${API_BASE}/admin/products${statusParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to load products');

      const data = await res.json();
      setProducts(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setMessage('');
    setError('');

    try {
      const API_BASE = '/api';
      const res = await fetch(`${API_BASE}/admin/products/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to approve product');

      setMessage('Product approved successfully');
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve product');
    }
  };

  const handleToggleActive = async (id: number, nextActive: boolean) => {
    setMessage('');
    setError('');

    try {
      const API_BASE = '/api';
      const res = await fetch(`${API_BASE}/admin/products/${id}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: nextActive }),
      });

      if (!res.ok) throw new Error('Failed to update visibility');

      setMessage(nextActive ? 'Product activated' : 'Product deactivated');
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update visibility');
    }
  };

  const handleRejectSubmit = async (id: number) => {
    if (!rejectReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    setMessage('');
    setError('');

    try {
      const API_BASE = '/api';
      const res = await fetch(`${API_BASE}/admin/products/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (!res.ok) throw new Error('Failed to reject product');

      setMessage('Product rejected successfully');
      setRejectingId(null);
      setRejectReason('');
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject product');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="w-full md:ml-60 flex-1 overflow-auto p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            <ChevronLeft size={16} />
            Back to admin dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Product Approvals</h1>
          <p className="text-gray-600 mt-2">Review and approve vendor products</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 mb-6">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilter(status);
                setMessage('');
                setError('');
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Success Message */}
        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {message}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Rejection Modal */}
        {rejectingId !== null && (
          <div className="mb-6 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Product</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleRejectSubmit(rejectingId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Loading products...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <Package size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-900">No {filter === 'all' ? '' : filter} products found</p>
              <p className="text-sm text-gray-500 mt-1">Product submissions will appear here</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Visibility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const vendorName = (product.vendor?.user?.first_name || product.vendor?.user?.last_name)
                    ? `${product.vendor?.user?.first_name ?? ''} ${product.vendor?.user?.last_name ?? ''}`.trim()
                    : (product.vendor?.user?.email ?? `Vendor #${product.vendor_id}`);
                  const accountText = [product.account_name, product.bank_name, product.account_number]
                    .filter(Boolean)
                    .join(' • ');
                  return (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span className="font-medium">{vendorName}</span>
                        <span className="text-xs text-gray-500">ID: #{product.vendor_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {accountText || <span className="text-gray-400">No account details</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      ₦{Number(product.price).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {Number(product.commission_rate).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.approval_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : product.approval_status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.approval_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {product.approval_status === 'approved' ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.is_active ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {product.is_active ? 'active' : 'inactive'}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {product.approval_status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(product.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs font-medium transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectingId(product.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs font-medium transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {product.approval_status === 'rejected' && (
                        <div className="text-xs text-red-600">
                          <p className="truncate max-w-xs">{product.rejection_reason || 'No reason provided'}</p>
                        </div>
                      )}
                      {product.approval_status === 'approved' && (
                        <div className="flex gap-2">
                          {product.is_active ? (
                            <button
                              onClick={() => handleToggleActive(product.id, false)}
                              className="px-3 py-1 bg-gray-700 text-white rounded-md hover:bg-gray-800 text-xs font-medium transition-colors"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleActive(product.id, true)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs font-medium transition-colors"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
