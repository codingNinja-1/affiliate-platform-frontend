'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';
import { useRates } from '@/hooks/useRates';
import { ArrowLeft, Save, ImageIcon, DollarSign, Percent, Package, Link2, Truck, ToggleLeft } from 'lucide-react';

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
  image?: string | null;
};

export default function VendorEditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { currency, symbol } = useCurrency();
  const { rates } = useRates();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);

  const normalizeImage = (src: string | null) =>
    src ? src.replace('http://127.0.0.1:8000', 'http://localhost:8000') : null;

  // Convert NGN price to selected currency for display
  const displayRate = currency === 'NGN' ? 1 : (rates[`NGN_${currency}`] ?? 1);
  const ngnPrice = parseFloat(form.price) || 0;
  const displayPrice = (ngnPrice * displayRate).toFixed(2);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) { window.location.href = '/login'; return; }

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user?.user_type?.toLowerCase() !== 'vendor') {
        window.location.href = '/dashboard';
        return;
      }
    } catch {
      window.location.href = '/dashboard';
      return;
    }

    // Check subscription status
    fetch('/api/subscriptions', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.status && data.data.status !== 'active') {
          setSubscriptionRequired(true);
        }
      })
      .catch(() => {});

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
        setCurrentImage(p.image || null);
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
      } catch (err) {
        setError('Unable to load product');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const updateField = (k: keyof typeof form, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const save = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) { router.push('/login'); return; }
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const formData = new FormData();
      formData.append('_method', 'PUT'); // Laravel method spoofing — send as POST
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', String(parseFloat(form.price) || 0));
      formData.append('commission_rate', String(parseFloat(form.commission_rate) || 0));
      formData.append('stock_quantity', String(parseInt(form.stock_quantity) || 0));
      formData.append('status', form.status);
      formData.append('sales_page_url', form.sales_page_url || '');
      formData.append('delivery_link', form.delivery_link || '');
      if (imageFile) formData.append('image', imageFile);

      const res = await fetch(`/api/vendor/products/${id}`, {
        method: 'POST', // POST + _method=PUT so the proxy passes it through unchanged
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Save failed (${res.status})`);

      setCurrentImage(data.data.image || null);
      setImageFile(null);
      setImagePreview(null);
      setSuccessMsg('Product saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (subscriptionRequired) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 100 20A10 10 0 0012 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Subscription Required</h2>
          <p className="text-gray-600 mb-6 text-sm">
            You need an active subscription to edit products. Subscribe to unlock full access to your vendor account.
          </p>
          <a
            href="/subscriptions"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            View Subscription Plans
          </a>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/products" className="text-blue-600 hover:underline">← Back to products</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mr-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft size={16} /> Back to products
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-sm text-gray-500 mt-1">Update your product details</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              form.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {form.status}
            </span>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="mb-6 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 font-medium">
            ✓ {successMsg}
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-6">

          {/* Image Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon size={18} className="text-gray-400" />
              <h2 className="font-semibold text-gray-800">Product Image</h2>
            </div>
            <div className="flex items-start gap-5">
              <div className="w-28 h-28 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
                {imagePreview || currentImage ? (
                  <img src={imagePreview || normalizeImage(currentImage)!} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={32} className="text-gray-300" />
                )}
              </div>
              <div className="flex-1">
                <label className="block">
                  <span className="sr-only">Choose image</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </label>
                <p className="mt-2 text-xs text-gray-400">JPEG, PNG or GIF · Max 4MB</p>
                {imageFile && <p className="mt-1 text-xs text-green-600">✓ {imageFile.name} selected</p>}
              </div>
            </div>
          </div>

          {/* Basic Info Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-gray-800">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name <span className="text-red-400">*</span></label>
              <input
                value={form.name}
                onChange={e => updateField('name', e.target.value)}
                placeholder="e.g. Premium Website Template"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={e => updateField('description', e.target.value)}
                rows={4}
                placeholder="Describe what your product does..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
              />
            </div>
          </div>

          {/* Pricing Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <DollarSign size={18} className="text-gray-400" />
              <h2 className="font-semibold text-gray-800">Pricing & Commission</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Price <span className="text-gray-400 font-normal">(stored in ₦)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₦</span>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => updateField('price', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                {currency !== 'NGN' && ngnPrice > 0 && (
                  <p className="mt-1.5 text-xs text-blue-600 font-medium">
                    ≈ {symbol}{displayPrice} in {currency}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Commission Rate <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.commission_rate}
                    onChange={e => updateField('commission_rate', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-4 pr-10 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Percent size={15} />
                  </span>
                </div>
                {form.price && form.commission_rate && (
                  <p className="mt-1.5 text-xs text-gray-500">
                    Affiliate earns ₦{((parseFloat(form.price) * parseFloat(form.commission_rate)) / 100).toLocaleString()} per sale
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Inventory & Status Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Package size={18} className="text-gray-400" />
              <h2 className="font-semibold text-gray-800">Inventory & Status</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock_quantity}
                  onChange={e => updateField('stock_quantity', e.target.value)}
                  placeholder="0 = unlimited"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <p className="mt-1 text-xs text-gray-400">Leave 0 for unlimited digital products</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><ToggleLeft size={15} /> Status</span>
                </label>
                <select
                  value={form.status}
                  onChange={e => updateField('status', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="active">Active — visible to affiliates</option>
                  <option value="inactive">Inactive — hidden</option>
                  <option value="draft">Draft — not published</option>
                </select>
              </div>
            </div>
          </div>

          {/* Links Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Link2 size={18} className="text-gray-400" />
              <h2 className="font-semibold text-gray-800">Links</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sales Page URL</label>
              <input
                type="url"
                value={form.sales_page_url}
                onChange={e => updateField('sales_page_url', e.target.value)}
                placeholder="https://yoursite.com/product"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5"><Truck size={14} /> Delivery Link</span>
              </label>
              <input
                type="url"
                value={form.delivery_link}
                onChange={e => updateField('delivery_link', e.target.value)}
                placeholder="https://yoursite.com/download or delivery URL"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <p className="mt-1 text-xs text-gray-400">Sent to customers after purchase</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 pb-8">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/products"
              className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
