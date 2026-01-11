'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Product = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  commission_rate: number;
  is_active: boolean;
  sales_page_url?: string | null;
  delivery_link?: string | null;
};

export default function VendorProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/vendor/products', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error(`Failed to load products: ${res.status}`);
        }
        const data = await res.json();
        setProducts(data.data || []);
      } catch (err) {
        setError('Unable to load your products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const buildSnippet = (productId: number) => {
    const FRONTEND_BASE = typeof window !== 'undefined' ? window.location.origin : 'https://your-frontend-domain.com';
    return [
      '<!-- Stakecut-style pixel + checkout helper -->',
      '<script>',
      '(function(){',
      `  var API_BASE = ${JSON.stringify(FRONTEND_BASE.replace(/\/$/, ''))} + '/api';`,
      `  var FRONTEND_BASE = ${JSON.stringify(FRONTEND_BASE)};`,
      `  var PRODUCT_ID = ${JSON.stringify(String(productId))};`,
      '  var params = new URLSearchParams(location.search);',
      '  var affiliateId = params.get("a");',
      '  var referralCode = params.get("ref") || params.get("r");',
      '  if (referralCode) {',
      '    fetch(API_BASE + "/track/" + encodeURIComponent(referralCode) + "/" + PRODUCT_ID).catch(function(){});',
      '  }',
      '  window.startCheckout = function(){',
      '    var url = FRONTEND_BASE + "/checkout?p=" + PRODUCT_ID;',
      '    if (affiliateId) url += "&a=" + encodeURIComponent(affiliateId);',
      '    else if (referralCode) url += "&r=" + encodeURIComponent(referralCode);',
      '    location.href = url; return false;',
      '  };',
      '})();',
      '</script>',
      '',
      '<!-- Buy button example -->',
      '<a href="#" onclick="return startCheckout()" style="display:inline-block;background:#10b981;color:#fff;padding:12px 18px;border-radius:8px;font-weight:600;text-decoration:none">',
      '  Buy Now',
      '</a>'
    ].join('\n');
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 bg-slate-50 px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-500">← Back to dashboard</Link>
          <h1 className="mt-2 text-2xl font-semibold">Your Products</h1>
          <p className="text-sm text-slate-600">Edit details and copy your sales page snippet</p>
        </div>
        <Link href="/products/create" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">New product</Link>
      </header>

      {error && (
        <div className="rounded-md border border-amber-500/50 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-200" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-slate-500">No products yet</div>
        ) : (
          <div className="space-y-6">
            {products.map((p) => (
              <div key={p.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-medium">{p.name}</h3>
                    <p className="text-sm text-slate-600">₦{p.price.toLocaleString()} · {p.commission_rate}% commission</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/vendor/products/${p.id}`} className="rounded-md bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700">Edit</Link>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Sales Page Snippet</p>
                  <textarea
                    readOnly
                    value={buildSnippet(p.id)}
                    className="mt-2 w-full min-h-[180px] rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
