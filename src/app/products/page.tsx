'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProducts, type Product } from '@/hooks/useProducts';
import { useCurrency } from '@/context/CurrencyContext';
import { Plus, Package, TrendingUp, ExternalLink, Pencil, Search, ImageOff } from 'lucide-react';

function normalizeImageUrl(src: string): string {
  // Replace local backend URLs for local dev
  if (src.startsWith('http://127.0.0.1:8000') || src.startsWith('http://localhost:8000')) {
    return src.replace(/http:\/\/(127\.0\.0\.1|localhost):8000/, 'http://localhost:8000');
  }
  // Relative path — prefix with Hostinger backend storage URL
  if (!src.startsWith('http')) {
    return `https://snow-mantis-616662.hostingersite.com/backend/public/storage/${src}`;
  }
  return src;
}

function ProductImage({ src, name }: { src?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const url = src ? normalizeImageUrl(src) : null;

  if (!url || failed) {
    return (
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0">
        <ImageOff size={20} className="text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      onError={() => setFailed(true)}
      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gray-100"
    />
  );
}

function StatusBadge({ status, approval }: { status?: string; approval?: string }) {
  if (approval === 'pending') return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">Pending review</span>;
  if (approval === 'rejected') return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">Rejected</span>;
  if (status === 'active') return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">Active</span>;
  if (status === 'inactive') return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">Inactive</span>;
  return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">{status ?? 'Draft'}</span>;
}

export default function ProductsPage() {
  const { user } = useAuth();
  const { data: products = [], isLoading, error: queryError } = useProducts(user?.user_type);
  const { formatAmount } = useCurrency();
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isAffiliate = mounted && user?.user_type === 'affiliate';
  const isVendor = mounted && user?.user_type === 'vendor';

  const filtered = products.filter((p: Product) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="bg-gray-50">
      <div className="max-w-6xl mr-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-2">
              ← Back to dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {isAffiliate ? 'Browse Products' : 'My Products'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isAffiliate ? 'Find products to promote and earn commissions' : 'Manage your product catalog'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isAffiliate && isVendor && (
              <Link
                href="/products/create"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition"
              >
                <Plus size={16} /> Add product
              </Link>
            )}
          </div>
        </div>

        {/* Search bar */}
        {products.length > 0 && (
          <div className="relative mb-6">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full sm:w-80 rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
        )}

        {queryError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {queryError instanceof Error ? queryError.message : 'Failed to load products'}
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm animate-pulse">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && products.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mr-auto mb-4">
              <Package size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">No products yet</h3>
            <p className="text-sm text-gray-500 mb-6">
              {isAffiliate ? 'Check back later for products to promote.' : 'Create your first product to start selling.'}
            </p>
            {isVendor && (
              <Link href="/products/create" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition">
                <Plus size={16} /> Create product
              </Link>
            )}
          </div>
        )}

        {/* Product grid */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product: Product) => (
              <div key={product.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all overflow-hidden flex flex-col">

                {/* Product thumbnail banner */}
                <div className="relative h-36 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
                  {product.image ? (
                    <img
                      src={normalizeImageUrl(product.image)}
                      alt={product.name}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center">
                        <Package size={24} className="text-blue-300" />
                      </div>
                    </div>
                  )}
                  {/* Status badge overlay */}
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={product.status} approval={product.approval_status} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{product.name}</h3>
                  </div>

                  {product.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{product.description}</p>
                  )}

                  {/* Price & Commission */}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatAmount(product.price)}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <TrendingUp size={12} className="text-green-500" />
                        <p className="text-xs text-green-600 font-medium">{product.commission_rate}% commission</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Stock</p>
                      <p className="text-sm font-medium text-gray-700">
                        {product.stock_quantity != null && product.stock_quantity > 0 ? product.stock_quantity : '∞'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    {isVendor && (
                      <Link
                        href={`/vendor/products/${product.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition"
                      >
                        <Pencil size={13} /> Edit
                      </Link>
                    )}
                    {product.sales_page_url && (
                      <a
                        href={product.sales_page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 transition"
                      >
                        <ExternalLink size={13} /> View
                      </a>
                    )}
                    {isAffiliate && (
                      <Link
                        href={`/links?product=${product.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-green-600 hover:bg-green-700 px-3 py-2 text-xs font-semibold text-white transition"
                      >
                        <TrendingUp size={13} /> Promote
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No search results */}
        {!isLoading && products.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500 text-sm">
            No products match "<span className="font-medium text-gray-700">{search}</span>"
          </div>
        )}
      </div>
    </main>
  );
}
