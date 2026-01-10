'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  commission_rate: number;
};

type AffiliateLink = {
  product_id: number;
  product_name: string;
  referral_link: string;
  clicks: number;
  sales: number;
};

export default function LinksPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem('auth_token');

    try {
      const [productsRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/affiliate/products', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!productsRes.ok) {
        const errorText = await productsRes.text();
        console.error('Products API error:', productsRes.status, errorText);
        
        // If unauthorized, redirect to login
        if (productsRes.status === 401 || productsRes.status === 500) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        
        throw new Error(`Failed to load data: ${productsRes.status}`);
      }

      const productsData = await productsRes.json();
      setProducts(productsData.data || []);

      // Get affiliate data to get referral code
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const referralCode = user?.referral_code || user?.affiliate?.referral_code || 'YOURCODE';

      // Generate affiliate links using the referral code
      const affiliateLinks = (productsData.data || []).map((product: Product) => ({
        product_id: product.id,
        product_name: product.name,
        referral_link: `${window.location.origin}/products/${product.slug}?ref=${referralCode}`,
        clicks: 0,
        sales: 0,
      }));
      setLinks(affiliateLinks);
    } catch (err) {
      setError('Unable to load affiliate links. The products API may not be ready yet.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (link: string) => {
    try {
      // Check if clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link);
        setCopiedLink(link);
        setTimeout(() => setCopiedLink(''), 2000);
      } else {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          setCopiedLink(link);
          setTimeout(() => setCopiedLink(''), 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
          alert('Failed to copy link. Please copy manually: ' + link);
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy link. Please copy manually: ' + link);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 bg-slate-950 px-6 py-10 text-white">
      <header>
        <Link href="/dashboard" className="text-sm text-blue-400 hover:text-blue-300">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-3xl font-semibold">Referral links</h1>
        <p className="text-sm text-slate-400">Generate and manage your affiliate links</p>
      </header>

      {error && (
        <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold">Your affiliate links</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-800" />
            ))}
          </div>
        ) : links.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p>No products available yet</p>
            <p className="mt-2 text-sm">Check back later for products to promote</p>
          </div>
        ) : (
          <div className="space-y-4">
            {links.map((link) => (
              <div
                key={link.product_id}
                className="rounded-lg border border-slate-800 bg-slate-900/40 p-4"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{link.product_name}</h3>
                    <div className="mt-1 flex gap-4 text-sm text-slate-400">
                      <span>{link.clicks} clicks</span>
                      <span>{link.sales} sales</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={link.referral_link}
                    readOnly
                    className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300"
                  />
                  <button
                    onClick={() => copyToClipboard(link.referral_link)}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
                  >
                    {copiedLink === link.referral_link ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold">Available products</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-800" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <p>No products available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800">
                <tr className="text-left text-slate-400">
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Commission</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-slate-800/50">
                    <td className="py-4 font-medium">{product.name}</td>
                    <td className="py-4">₦{product.price.toLocaleString()}</td>
                    <td className="py-4">{product.commission_rate}%</td>
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
