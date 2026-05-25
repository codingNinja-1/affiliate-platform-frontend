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

  const buildPixelScript = (productId: number) => {
    const FRONTEND_BASE = process.env.NEXT_PUBLIC_FRONTEND_URL ?? (typeof window !== 'undefined' ? window.location.origin : 'https://affiliatehub.tech');
    const API_BASE = '/api'; // Adjust if backend is on different domain
    return [
      '<script>',
      '  (function () {',
      '    // CONFIG: set your API + frontend base URLs and product ID',
      `    var API_BASE = '${API_BASE}';`,
      `    var FRONTEND_BASE = '${FRONTEND_BASE}';`,
      `    var PRODUCT_ID = '${productId}'; // e.g. 123`,
      '',
      '    var params = new URLSearchParams(location.search);',
      '    var affiliateId = params.get(\'a\');       // preferred if present',
      '    var referralCode = params.get(\'ref\') || params.get(\'r\'); // fallback',
      '',
      '    // Track the page view/click for analytics (non-blocking)',
      '    if (referralCode) {',
      '      // Tracks a click against an affiliate referral code for this product',
      '      fetch(API_BASE + \'/track/\' + encodeURIComponent(referralCode) + \'/\' + PRODUCT_ID)',
      '        .catch(function(){ /* ignore */ });',
      '    }',
      '',
      '    // Expose a helper for your Buy Now button',
      '    window.startCheckout = function () {',
      '      var checkoutUrl = FRONTEND_BASE + \'/checkout?p=\' + PRODUCT_ID;',
      '      if (affiliateId) {',
      '        checkoutUrl += \'&a=\' + encodeURIComponent(affiliateId);',
      '      } else if (referralCode) {',
      '        // Our checkout now accepts \'r\' (referral code) and passes it through to Paystack metadata',
      '        checkoutUrl += \'&r=\' + encodeURIComponent(referralCode);',
      '      }',
      '      location.href = checkoutUrl;',
      '      return false; // prevent default if used on <a href="#">',
      '    };',
      '  })();',
      '</script>'
    ].join('\n');
  };

  const buildButtonCode = (productId: number) => {
    return [
      '<!-- Image-style button -->',
      '<a href="#" onclick="return startCheckout()">',
      '  <img src="https://path-to-your-button-image.png" alt="Buy Now">',
      '</a>',
      '',
      '<!-- Or a styled button -->',
      '<button style="background:#fbbf24;color:#1f2937;padding:10px 20px;border-radius:6px;font-weight:bold;border:none;cursor:pointer"',
      '        onclick="return startCheckout()">',
      '  Buy Now',
      '</button>'
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
                    <Link href={`/vendor/products/${p.id}`} className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">Edit</Link>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-700 uppercase">1. Pixel Code (Header Script)</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(buildPixelScript(p.id));
                          alert('Pixel script copied!');
                        }}
                        className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">
                      Kindly copy this pixel code below and insert it in your sales page header as a custom script.
                    </p>
                    <textarea
                      readOnly
                      value={buildPixelScript(p.id)}
                      className="w-full min-h-30 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-700 uppercase">2. Pay Button (CTA)</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(buildButtonCode(p.id));
                          alert('Button code copied!');
                        }}
                        className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">
                      Select from the button options below that best suits your Website/sales page and then copy the code generated and insert in your website
                    </p>
                    <textarea
                      readOnly
                      value={buildButtonCode(p.id)}
                      className="w-full min-h-45 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
