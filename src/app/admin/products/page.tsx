'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Home, Users, Package, CreditCard, DollarSign, Building2, TrendingUp, Settings, Mail, Plug, ChevronLeft } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  commission_rate: number;
  approval_status: string;
  rejection_reason?: string;
  created_at: string;
}

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
  );
};

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuth();
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
      const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.134:8000/api').replace(/\/$/, '');
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
      const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.134:8000/api').replace(/\/$/, '');
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

  const handleRejectSubmit = async (id: number) => {
    if (!rejectReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    setMessage('');
    setError('');

    try {
      const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.134:8000/api').replace(/\/$/, '');
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
      <Sidebar />

      <div className="ml-60 flex-1 overflow-auto p-8">
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
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
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
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(product.created_at).toLocaleDateString()}
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
