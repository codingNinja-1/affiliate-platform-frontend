'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProducts, type Product } from '@/hooks/useProducts';
import CurrencySelector from '../components/CurrencySelector';
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';

export default function ProductsPage() {
  const { user } = useAuth();
  const { data: products = [], isLoading, error: queryError } = useProducts(user?.user_type);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { amounts, formatAmount } = useCurrencyConversion(refreshTrigger);

  const isAffiliate = user?.user_type === 'affiliate';
  const isCustomer = user?.user_type === 'customer';
  const isVendor = user?.user_type === 'vendor';

  const handleCurrencyChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const displayCurrency = amounts?.currency || 'NGN';
  const currencySymbol = displayCurrency === 'NGN' ? '₦' : 
                        displayCurrency === 'USD' ? '$' :
                        displayCurrency === 'GBP' ? '£' :
                        displayCurrency === 'EUR' ? '€' :
                        displayCurrency + ' ';
  const conversionRate = amounts?.conversion_rate || 1;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 bg-gray-50 px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">Products</h1>
          <p className="text-sm text-gray-600">
            {isAffiliate ? 'Browse products to promote' : 'Manage your product catalog'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isAffiliate && (
            <CurrencySelector 
              onCurrencyChange={handleCurrencyChange}
              showLabel={false}
            />
          )}
          {!isAffiliate && !isCustomer && (
            <Link
              href="/products/create"
              className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
            >
              Add product
            </Link>
          )}
        </div>
      </header>

      {queryError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {queryError instanceof Error ? queryError.message : 'Failed to load products'}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p>No products yet</p>
            <p className="mt-2 text-sm">
              {isAffiliate ? 'Check back later for products to promote' : 'Create your first product to get started'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr className="text-left text-gray-600">
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
                  <tr key={product.id} className="border-b border-gray-100">
                    <td className="py-4 font-medium text-gray-900">{product.name}</td>
                    <td className="py-4 text-gray-700">
                      {isAffiliate && amounts
                        ? `${currencySymbol}${((product.price * conversionRate) as unknown as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `₦${product.price.toLocaleString()}`
                      }
                    </td>
                    <td className="py-4 text-gray-700">{product.commission_rate}%</td>
                    <td className="py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          product.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="py-4 text-gray-700">{product.stock_quantity ?? 'N/A'}</td>
                    <td className="py-4">
                      <div className="flex flex-col gap-1 text-xs text-gray-500">
                        {product.sales_page_url && <span>📄 Sales page</span>}
                        {product.delivery_link && <span>📦 Delivery</span>}
                        {product.buy_now_config?.redirect_url && <span>🛒 Buy button</span>}
                        {!product.sales_page_url && !product.delivery_link && !product.buy_now_config?.redirect_url && (
                          <span className="text-gray-400">-</span>
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