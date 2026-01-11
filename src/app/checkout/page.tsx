'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
  commission_rate: number;
}

interface Affiliate {
  id: string;
  referral_code: string;
  user?: {
    first_name: string;
    last_name: string;
  };
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('p');
  const affiliateId = searchParams.get('a');
  const referralCodeParam = searchParams.get('r') || searchParams.get('ref');

  const [product, setProduct] = useState<Product | null>(null);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCountry, setCustomerCountry] = useState('NG');
  const [paystackKey, setPaystackKey] = useState('');

  const apiBase = '/api';

  useEffect(() => {
    if (!productId) {
      setError('Missing product ID');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch product
        const productRes = await fetch(
          `${apiBase}/products`,
          { headers: { Accept: 'application/json' } }
        );

        if (!productRes.ok) {
          throw new Error('Product not found');
        }

        const productData = await productRes.json();
        const prod = productData.data?.find((p: Product) => p.id.toString() === productId) || productData.data?.[0];
        
        if (!prod) {
          throw new Error('Product not found');
        }

        setProduct(prod);

        // Fetch Paystack public key
        try {
          const keyRes = await fetch(`${apiBase}/payment/public-key`);
          if (keyRes.ok) {
            const keyData = await keyRes.json();
            setPaystackKey(keyData.public_key);
          }
        } catch (err) {
          console.error('Error fetching Paystack key:', err);
        }

        // Fetch affiliate info if provided
        if (affiliateId) {
          try {
            const affRes = await fetch(
              `${apiBase}/affiliates/${encodeURIComponent(affiliateId)}`,
              { headers: { Accept: 'application/json' } }
            );
            if (affRes.ok) {
              const affData = await affRes.json();
              setAffiliate(affData.data);
            }
          } catch (err) {
            console.error('Error fetching affiliate:', err);
          }
        }

        setError('');
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load checkout');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, affiliateId, apiBase]);

  const handleCheckout = async () => {
    if (!product) return;

    if (!customerEmail || !customerName || !customerPhone) {
      alert('Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      alert('Please enter a valid email address');
      return;
    }

    setProcessing(true);

    try {
      if (!paystackKey) {
        alert('Payment system not configured');
        return;
      }

      const response = await fetch(`${apiBase}/checkout/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          product_id: product.id,
          affiliate_id: affiliateId || null,
          ref: referralCodeParam || null,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          customer_country: customerCountry,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Checkout failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data.authorization_url) {
        window.location.href = result.data.authorization_url;
      } else {
        throw new Error(result.message || 'Failed to initialize payment');
      }
    } catch (err) {
      console.error('Error processing checkout:', err);
      alert(err instanceof Error ? err.message : 'Failed to process checkout');
      setProcessing(false);
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
          <div className="text-red-600 mb-4 text-3xl">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Back to home
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
          <Link href="/" className="text-blue-600 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const commissionAmount = (product.price * product.commission_rate) / 100;
  const vendorAmount = product.price - commissionAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Checkout</h1>
            {affiliate && (
              <p className="text-blue-100 text-sm mt-2">
                Referred by: {affiliate.user?.first_name} {affiliate.user?.last_name}
              </p>
            )}
          </div>

          <div className="p-8">
            {/* Product Summary */}
            <div className="mb-8 pb-8 border-b">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">{product.name}</span>
                  <span className="font-semibold text-gray-900">
                    ₦{product.price.toLocaleString()}
                  </span>
                </div>
                
                {affiliate && (
                  <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                    <p className="text-green-800">
                      <strong>Affiliate Commission:</strong> ₦{commissionAmount.toLocaleString()} ({product.commission_rate}%)
                    </p>
                  </div>
                )}

                <div className="flex justify-between pt-3 font-bold text-lg border-t">
                  <span>Total Amount</span>
                  <span className="text-green-600">₦{product.price.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Customer Information Form */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+234..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    value={customerCountry}
                    onChange={(e) => setCustomerCountry(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="NG">Nigeria</option>
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                    <option value="ZA">South Africa</option>
                    <option value="KE">Kenya</option>
                    <option value="GH">Ghana</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={processing || !customerEmail || !customerName || !customerPhone}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition duration-200 text-lg"
            >
              {processing ? 'Processing...' : `Pay ₦${product.price.toLocaleString()} with Paystack`}
            </button>

            {/* Security Notice */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>🔒 Secure Payment:</strong> You will be redirected to Paystack to complete your payment securely. Your information is encrypted.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Questions? <Link href="/" className="text-blue-600 hover:underline">Contact support</Link></p>
        </div>
      </div>
    </div>
  );
}
