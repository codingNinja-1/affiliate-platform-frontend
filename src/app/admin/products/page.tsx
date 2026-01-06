'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type Product = {
  id: number;
  name: string;
  vendor: string;
  price: number;
  commission_rate: number;
  approval_status: string;
  rejection_reason: string | null;
  created_at: string;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('pending');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadProducts = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/admin/products?status=${filter}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error('Failed to load products');

      const data = await res.json();
      setProducts(data.data || []);
    } catch (err) {
      setError('Unable to load products.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !['admin', 'superadmin'].includes(user.user_type)) {
      window.location.href = '/dashboard';
      return;
    }

    loadProducts();
  }, [loadProducts]);

  const handleApprove = async (id: number) => {
    const token = localStorage.getItem('auth_token');
    setMessage('');
    setError('');

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/admin/products/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to approve product');

      setMessage('Product approved successfully');
      loadProducts();
    } catch (err) {
      setError('Failed to approve product');
      console.error(err);
    }
  };

  const handleRejectSubmit = async (id: number) => {
    if (!rejectReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    const token = localStorage.getItem('auth_token');
    setMessage('');
    setError('');

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/admin/products/${id}/reject`, {
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
      loadProducts();
    } catch (err) {
      setError('Failed to reject product');
      console.error(err);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 bg-slate-950 px-6 py-10 text-white">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-blue-400 hover:text-blue-300">
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-semibold">Product approvals</h1>
          <p className="text-sm text-slate-400">Review and approve vendor products</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </header>

      {message && (
        <div className="rounded-md border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-100">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      )}

      {rejectingId !== null && (
        <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-6">
          <h3 className="mb-4 text-lg font-semibold">
            Reject Product #{rejectingId}
          </h3>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            className="mb-4 w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-slate-600"
            rows={4}
          />
          <div className="flex gap-3">
            <button
              onClick={() => handleRejectSubmit(rejectingId)}
              className="rounded-md bg-red-600 px-4 py-2 hover:bg-red-500"
            >
              Confirm Rejection
            </button>
            <button
              onClick={() => {
                setRejectingId(null);
                setRejectReason('');
              }}
              className="rounded-md border border-slate-700 px-4 py-2 hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-800" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p>No {filter} products</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800">
                <tr className="text-left text-slate-400">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Vendor</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Commission Rate</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Submitted</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-slate-800/50">
                    <td className="py-4 font-medium">{product.name}</td>
                    <td className="py-4">{product.vendor}</td>
                    <td className="py-4">₦{(typeof product.price === 'string' ? parseFloat(product.price) : product.price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td className="py-4">{product.commission_rate}%</td>
                    <td className="py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          product.approval_status === 'approved'
                            ? 'bg-green-500/20 text-green-300'
                            : product.approval_status === 'rejected'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-yellow-500/20 text-yellow-300'
                        }`}
                      >
                        {product.approval_status}
                      </span>
                    </td>
                    <td className="py-4">
                      {new Date(product.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right">
                      {product.approval_status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(product.id)}
                            className="rounded-md bg-green-600 px-3 py-1 text-sm hover:bg-green-500"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectingId(product.id)}
                            className="rounded-md bg-red-600 px-3 py-1 text-sm hover:bg-red-500"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {product.approval_status === 'rejected' && (
                        <div className="text-xs text-red-300">
                          <p>{product.rejection_reason}</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
