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
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [affiliateId, setAffiliateId] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paystackKey, setPaystackKey] = useState('');
  // Use Next.js API proxy base
  const apiBase = '/api';

  useEffect(() => {
    if (!slug) {
      setError('Missing product identifier');
      setLoading(false);
      return;
    }

    // Get affiliate tracking info from URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('ref') || '';
    const affId = urlParams.get('a') || '';
    const pid = urlParams.get('pid') || '';
    
    setReferralCode(code);
    setAffiliateId(affId);

    // Track click if we have affiliate ID and product ID
    if (affId && pid) {
      fetch(`${apiBase}/tracking/click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          affiliate_id: affId,
          product_id: pid,
        }),
      }).catch(err => console.error('Error tracking click:', err));
    }

    // Fetch Paystack public key
    const fetchPaystackKey = async () => {
      try {
        const response = await fetch(`${apiBase}/payment/public-key`);
        if (response.ok) {
          const data = await response.json();
          setPaystackKey(data.public_key);
        }
      } catch (err) {
        console.error('Error fetching Paystack key:', err);
      }
    };

    fetchPaystackKey();

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

    if (!customerEmail || !customerName) {
      alert('Please enter your email and name');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      alert('Please enter a valid email address');
      return;
    }

    setPurchasing(true);

    try {
      // Check if Paystack is configured
      if (!paystackKey) {
        // Fallback to demo mode
        await handleDemoPurchase();
        return;
      }

      // Initialize payment with backend
      const response = await fetch(`${apiBase}/payment/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          product_id: product.id,
          customer_email: customerEmail,
          customer_name: customerName,
          affiliate_id: affiliateId || null,
          ref: referralCode || null,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Payment initialization failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = result.data.authorization_url;
      } else {
        throw new Error('Failed to get payment URL');
      }
    } catch (err) {
      console.error('Error processing purchase:', err);
      alert(err instanceof Error ? err.message : 'Failed to process purchase');
      setPurchasing(false);
    }
  };

  const handleDemoPurchase = async () => {
    if (!product) return;

    try {
      // Create a demo purchase request
      const purchaseData = {
        product_id: product.id,
        customer_email: customerEmail,
        customer_name: customerName,
        amount: product.price,
        affiliate_id: affiliateId || null,
        ref: referralCode || null,
        payment_method: 'demo',
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
        throw new Error(`Purchase failed: ${response.status}`);
      }

      const result = await response.json();
      alert('Purchase recorded successfully!');
      console.log('Purchase result:', result);
    } catch (err) {
      console.error('Error processing purchase:', err);
      alert(err instanceof Error ? err.message : 'Failed to process purchase');
    } finally {
      setPurchasing(false);
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
          {(referralCode || affiliateId) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-gray-600 mb-2">Affiliate Tracking</p>
              {referralCode && (
                <p className="text-lg font-mono font-bold text-blue-600">
                  Code: {referralCode}
                </p>
              )}
              {affiliateId && (
                <p className="text-sm font-mono text-blue-600">
                  ID: {affiliateId}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                This purchase will be attributed to your affiliate account
              </p>
            </div>
          )}

          {/* Customer Information Form */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Customer Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
          </div>

          {/* Purchase Button */}
          <button
            onClick={handlePurchase}
            disabled={purchasing || !customerEmail || !customerName}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition duration-200"
          >
            {purchasing ? 'Processing...' : `Buy Now - ${product.price.toLocaleString()} ${product.currency || 'NGN'}`}
          </button>

          {/* Payment Method Notice */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              {paystackKey ? (
                <>
                  <strong>Secure Payment:</strong> You will be redirected to Paystack to complete your payment securely.
                </>
              ) : (
                <>
                  <strong>Demo Mode:</strong> Paystack is not configured. This will create a demo purchase for testing purposes.
                </>
              )}
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
