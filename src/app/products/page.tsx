'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useProducts, type Product } from '@/hooks/useProducts';

export default function ProductsPage() {
  const { user } = useAuth();
  const { data: products = [], isLoading, error: queryError } = useProducts(user?.user_type);

  const isAffiliate = user?.user_type === 'affiliate';
  const isCustomer = user?.user_type === 'customer';
  const isVendor = user?.user_type === 'vendor';

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
          <Link
            href="/products/create"
            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
          >
            Add product
          </Link>
        )}
      </header>

      {queryError && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {queryError instanceof Error ? queryError.message : 'Failed to load products'}
        </div>
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
                  <th className="pb-3">Config</th>
                  {isVendor && <th className="pb-3">Actions</th>}
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
                    <td className="py-4">
                      <div className="flex flex-col gap-1 text-xs text-slate-400">
                        {product.sales_page_url && <span>📄 Sales page</span>}
                        {product.delivery_link && <span>📦 Delivery</span>}
                        {product.buy_now_config?.redirect_url && <span>🛒 Buy button</span>}
                        {!product.sales_page_url && !product.delivery_link && !product.buy_now_config?.redirect_url && (
                          <span className="text-slate-600">-</span>
                        )}
                      </div>
                    </td>
                    {isVendor && (
                      <td className="py-4">
                        <Link
                          href={`/vendor/products/${product.id}`}
                          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
                        >
                          Edit
                        </Link>
                      </td>
                    )}
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