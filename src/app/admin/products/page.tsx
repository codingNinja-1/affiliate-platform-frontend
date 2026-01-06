'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AdminSidebar from '@/app/components/AdminSidebar';

interface Product {
  id: number;
  name: string;
  price: number;
  commission_rate: number;
  approval_status: string;
  rejection_reason?: string;
  created_at: string;
}

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const statusParam = filter === 'all' ? '' : `?status=${filter}`;

      const res = await fetch(`${apiUrl}/api/admin/products${statusParam}`, {
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiUrl}/api/admin/products/${id}/approve`, {
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiUrl}/api/admin/products/${id}/reject`, {
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
    <div className="flex h-screen bg-slate-950">
      <AdminSidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Product Approvals</h1>
            <p className="text-gray-400 mt-2">Review and approve vendor products</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-4 mb-6">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status);
                  setMessage('');
                  setError('');
                }}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Success Message */}
          {message && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400">
              {message}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Rejection Modal */}
          {rejectingId !== null && (
            <div className="mb-6 bg-slate-900 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Reject Product</h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white mb-4 focus:outline-none focus:border-blue-500"
                rows={4}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => handleRejectSubmit(rejectingId)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Confirm Rejection
                </button>
                <button
                  onClick={() => {
                    setRejectingId(null);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Products Table */}
          <div className="bg-slate-900 rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-gray-400">Loading products...</div>
              </div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400">No {filter === 'all' ? '' : filter} products found</div>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Product Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Commission
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Submitted
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-slate-700 hover:bg-slate-800">
                      <td className="px-6 py-4 text-sm text-white font-medium">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        ${Number(product.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {Number(product.commission_rate).toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            product.approval_status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : product.approval_status === 'approved'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {product.approval_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {new Date(product.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {product.approval_status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(product.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectingId(product.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {product.approval_status === 'rejected' && (
                          <div className="text-xs text-red-400">
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
    </div>
  );
}
