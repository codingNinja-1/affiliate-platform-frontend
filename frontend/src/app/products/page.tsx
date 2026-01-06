'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useProducts, useCreateProduct, type Product } from '@/hooks/useProducts';

export default function ProductsPage() {
  const { user } = useAuth();
  const { data: products = [], isLoading, error: queryError } = useProducts(user?.user_type);
  const createProduct = useCreateProduct();
  
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    commission_rate: '',
    stock_quantity: '',
    status: 'draft',
  });

  const isAffiliate = user?.user_type === 'affiliate';
  const isCustomer = user?.user_type === 'customer';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await createProduct.mutateAsync({
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        commission_rate: parseFloat(formData.commission_rate),
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : 0,
        status: formData.status,
      });

      setFormData({
        name: '',
        description: '',
        price: '',
        commission_rate: '',
        stock_quantity: '',
        status: 'draft',
      });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
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
          <p className="text-sm text-slate-400">
            {isAffiliate ? 'Browse products to promote' : 'Manage your product catalog'}
          </p>
        </div>
        {!isAffiliate && !isCustomer && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
          >
            {showForm ? 'Cancel' : 'Add product'}
          </button>
        )}
      </header>

      {(error || queryError) && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error || (queryError instanceof Error ? queryError.message : 'Failed to load products')}
        </div>
      )}

      {showForm && !isAffiliate && !isCustomer && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-semibold">Create new product</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Product name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={createProduct.isPending}
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-white disabled:opacity-50"
                placeholder="e.g., Premium Widget"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={createProduct.isPending}
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-white disabled:opacity-50"
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
                  disabled={createProduct.isPending}
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-white disabled:opacity-50"
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
                  disabled={createProduct.isPending}
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-white disabled:opacity-50"
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
                  disabled={createProduct.isPending}
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-white disabled:opacity-50"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={createProduct.isPending}
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-white disabled:opacity-50"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={createProduct.isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
            >
              {createProduct.isPending ? 'Creating...' : 'Create product'}
            </button>
          </form>
        </section>
      )}

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-800" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p>No products yet</p>
            <p className="mt-2 text-sm">
              {isAffiliate ? 'Check back later for products to promote' : 'Create your first product to get started'}
            </p>
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
                </tr>
              </thead>
              <tbody>
                {products.map((product: Product) => (
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