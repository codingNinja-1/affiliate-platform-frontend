'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  commission_rate: number;
  status: string;
  stock_quantity?: number;
  created_at: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    commission_rate: '',
    stock_quantity: '',
    status: 'draft',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = async () => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');
    
    try {
      let url = 'http://127.0.0.1:8000/api/vendor/products';
      
      // For affiliates and customers, use the affiliate products endpoint
      if (userStr) {
        try {
          const user = JSON.parse(userStr as string);
          if (user.user_type === 'affiliate') {
            url = 'http://127.0.0.1:8000/api/affiliate/products';
          } else if (user.user_type === 'customer') {
            url = 'http://127.0.0.1:8000/api/products';
          }
        } catch (e) {
          console.warn('Invalid user data in storage', e);
        }
      }
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to load products');

      const data = await res.json();
      setProducts(data.data || []);
    } catch (err) {
      setError('Unable to load products. Endpoint may not be ready yet.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // Check if user is affiliate
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr as string);
        setIsAffiliate(user.user_type === 'affiliate');
      } catch (e) {
        console.warn('Invalid user data in storage', e);
        setIsAffiliate(false);
      }
    } else {
      setIsAffiliate(false);
    }

    loadProducts();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch('http://127.0.0.1:8000/api/vendor/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          commission_rate: parseFloat(formData.commission_rate),
          stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : 0,
          status: formData.status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create product');
      }

      setFormData({
        name: '',
        description: '',
        price: '',
        commission_rate: '',
        stock_quantity: '',
        status: 'draft',
      });
      setShowForm(false);
      loadProducts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create product';
      setError(errorMessage);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 bg-slate-950 px-6 py-10 text-white">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-blue-400 hover:text-blue-300">
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-semibold">Products</h1>
          <p className="text-sm text-slate-400">Manage your product catalog</p>
        </div>
        {isAffiliate === false && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
          >
            {showForm ? 'Cancel' : 'Add product'}
          </button>
        )}
      </header>

      {error && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {showForm && isAffiliate === false && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-semibold">Create new product</h2>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Product name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-white"
                placeholder="e.g., Premium Widget"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-white"
                placeholder="Product description"
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Price (₦)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-white"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Commission rate (%)</label>
                <input
                  type="number"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-white"
                  placeholder="5"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Stock quantity</label>
                <input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  min="0"
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create product'}
            </button>
          </form>
        </section>
      )}

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-800" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p>No products yet</p>
            <p className="mt-2 text-sm">Create your first product to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800">
                <tr className="text-left text-slate-400">
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Commission</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Stock</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-slate-800/50">
                    <td className="py-4 font-medium">{product.name}</td>
                    <td className="py-4">₦{product.price.toLocaleString()}</td>
                    <td className="py-4">{product.commission_rate}%</td>
                    <td className="py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          product.status === 'active'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="py-4">{product.stock_quantity ?? 'N/A'}</td>
                    <td className="py-4 text-right">
                      <button className="text-blue-400 hover:text-blue-300">Edit</button>
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
