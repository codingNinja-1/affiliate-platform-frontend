'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  vendor: {
    id: string;
    business_name: string;
  };
  approval_status: string;
  is_active: boolean;
}

export default function ProductSalesPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    if (!slug) {
      setError('Missing product identifier');
      setLoading(false);
      return;
    }

    // Get referral code from URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('ref') || '';
    setReferralCode(code);

    // Fetch product details
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiBase}/products/${encodeURIComponent(slug)}`, {
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            `Failed to load product: ${response.status} ${response.statusText} ${text?.slice(0, 120)}`
          );
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const text = await response.text();
          throw new Error(`Unexpected response format: ${text?.slice(0, 120)}`);
        }

        const data = await response.json();
        setProduct(data.data || data);
        setError('');
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load product'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug, apiBase]);

  const handlePurchase = async () => {
    if (!product) return;

    try {
      // Create a purchase request
      const purchaseData = {
        product_id: product.id,
        customer_email: 'customer@example.com', // In real app, get from checkout form
        customer_name: 'Customer Name', // In real app, get from checkout form
        amount: product.price,
        ref: referralCode || null,
        payment_method: 'credit_card', // In real app, use actual payment method
      };

      const response = await fetch(`${apiBase}/purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Purchase failed: ${response.status} ${response.statusText} ${text?.slice(0, 120)}`
        );
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Unexpected response format: ${text?.slice(0, 120)}`);
      }

      const result = await response.json();
      alert('Purchase recorded successfully!');
      console.log('Purchase result:', result);
    } catch (err) {
      console.error('Error processing purchase:', err);
      alert(err instanceof Error ? err.message : 'Failed to process purchase');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/links" className="text-blue-600 hover:underline">
            Back to Affiliate Links
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Product not found</p>
          <Link href="/links" className="text-blue-600 hover:underline">
            Back to Affiliate Links
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Product Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="mb-6">
            <Link href="/links" className="text-blue-600 hover:underline mb-4">
              ← Back to Affiliate Links
            </Link>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {product.name}
          </h1>

          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-gray-600 text-sm mb-2">By</p>
              <p className="text-lg font-semibold text-gray-700">
                {product.vendor?.business_name || 'Vendor'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-600 text-sm mb-2">Price</p>
              <p className="text-4xl font-bold text-green-600">
                {product.price.toLocaleString()} {product.currency || 'NGN'}
              </p>
            </div>
          </div>

          {/* Product Image */}
          {product.image && (
            <div className="relative mb-8 h-96 w-full overflow-hidden rounded-lg">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 800px, 100vw"
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Product Description */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              About this product
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          {/* Referral Code Display */}
          {referralCode && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-gray-600 mb-2">Referral Code</p>
              <p className="text-lg font-mono font-bold text-blue-600">
                {referralCode}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                This purchase will be attributed to your affiliate account
              </p>
            </div>
          )}

          {/* Purchase Button */}
          <button
            onClick={handlePurchase}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition duration-200"
          >
            Buy Now - {product.price.toLocaleString()} {product.currency || 'NGN'}
          </button>

          {/* Demo Notice */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Demo Mode:</strong> This is a demo purchase. In production,
              this would connect to a real payment gateway. The affiliate
              commission will be recorded for this sale.
            </p>
          </div>
        </div>

        {/* Affiliate Info Box */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Why Buy Through Affiliates?
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-green-600 font-bold mr-3">✓</span>
              <span>Direct support from experienced affiliates</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 font-bold mr-3">✓</span>
              <span>Affiliate commissions help fund their content</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 font-bold mr-3">✓</span>
              <span>Same price as buying direct - we just track the referral</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 font-bold mr-3">✓</span>
              <span>Support independent creators</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
