'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  commission_rate: number;
  stock_quantity?: number;
  is_active: boolean;
  sales_page_url?: string | null;
  delivery_link?: string | null;
};

export default function VendorEditProductPage() {
  const params = useParams();
  const id = Number(params.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    commission_rate: '',
    stock_quantity: '',
    status: 'active',
    sales_page_url: '',
    delivery_link: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/vendor/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        const p: Product = data.data;
        setProduct(p);
        setForm({
          name: p.name || '',
          description: p.description || '',
          price: String(p.price ?? ''),
          commission_rate: String(p.commission_rate ?? ''),
          stock_quantity: String(p.stock_quantity ?? ''),
          status: p.is_active ? 'active' : 'inactive',
          sales_page_url: p.sales_page_url || '',
          delivery_link: p.delivery_link || '',
        });
        setError('');
      } catch (err) {
        setError('Unable to load product');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const updateField = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) { window.location.href = '/login'; return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/vendor/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: Number(form.price),
          commission_rate: Number(form.commission_rate),
          stock_quantity: Number(form.stock_quantity) || 0,
          status: form.status,
          sales_page_url: form.sales_page_url || null,
          delivery_link: form.delivery_link || null,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Save failed: ${res.status} ${t}`);
      }
      alert('Saved');
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error || !product) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-red-600">{error || 'Product not found'}</p>
        <Link href="/vendor/products" className="text-blue-600">← Back</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/vendor/products" className="text-sm text-blue-600">← Back to products</Link>
      <h1 className="mt-2 text-2xl font-semibold">Edit Product</h1>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input value={form.name} onChange={e=>updateField('name', e.target.value)} className="w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={e=>updateField('description', e.target.value)} className="w-full rounded-md border px-3 py-2 min-h-[120px]" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
            <input type="number" value={form.price} onChange={e=>updateField('price', e.target.value)} className="w-full rounded-md border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commission (%)</label>
            <input type="number" value={form.commission_rate} onChange={e=>updateField('commission_rate', e.target.value)} className="w-full rounded-md border px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
            <input type="number" value={form.stock_quantity} onChange={e=>updateField('stock_quantity', e.target.value)} className="w-full rounded-md border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={e=>updateField('status', e.target.value)} className="w-full rounded-md border px-3 py-2">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sales Page URL</label>
          <input value={form.sales_page_url} onChange={e=>updateField('sales_page_url', e.target.value)} className="w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Link</label>
          <input value={form.delivery_link} onChange={e=>updateField('delivery_link', e.target.value)} className="w-full rounded-md border px-3 py-2" />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={save} disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:bg-gray-400">{saving ? 'Saving...' : 'Save Changes'}</button>
        <Link href="/vendor/products" className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300">Cancel</Link>
      </div>
    </main>
  );
}
