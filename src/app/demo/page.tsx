'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
}

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  timestamp: string;
}

export default function DemoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  // loading state not needed currently
  const [results, setResults] = useState<TestResult[]>([]);
  const [testRunning, setTestRunning] = useState(false);
  const apiBase = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api')
    : 'http://127.0.0.1:8000/api';

  const addResult = (step: string, success: boolean, message: string) => {
    setResults((prev) => [
      ...prev,
      {
        step,
        success,
        message,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const loadProducts = async () => {
    try {
      console.log('Loading products from:', `${apiBase}/products`);
      const response = await fetch(
        `${apiBase}/products`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        console.error('Response status:', response.status);
        throw new Error(`HTTP ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Expected JSON, got: ${contentType}`);
      }
      
      const data = await response.json();
      console.log('Loaded products:', data);
      setProducts(data.data || data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
      addResult('Load Products', false, String(err));
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const testClickTracking = async (referralCode: string, productId: number) => {
    try {
      console.log(`Tracking click: ${apiBase}/track/${referralCode}/${productId}`);
      const response = await fetch(
        `${apiBase}/track/${referralCode}/${productId}`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text.slice(0, 100)}`);
      }

      const data = await response.json();
      addResult(
        'Click Tracking',
        data.success,
        `Tracked click for ${referralCode}/${productId}`
      );
      return data.success;
    } catch (err) {
      addResult(
        'Click Tracking',
        false,
        err instanceof Error ? err.message : 'Unknown error'
      );
      return false;
    }
  };

  const testPurchaseRecording = async (
    productId: number,
    referralCode: string
  ) => {
    try {
      console.log(`Recording purchase: ${apiBase}/purchases`);
      const response = await fetch(
        `${apiBase}/purchases`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            product_id: productId,
            customer_email: `customer-${Date.now()}@example.com`,
            customer_name: 'Test Customer',
            amount: 5000,
            ref: referralCode,
            payment_method: 'stripe',
            payment_reference: `TEST-${Date.now()}`,
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text.slice(0, 100)}`);
      }

      const data = await response.json();
      addResult(
        'Purchase Recording',
        data.success,
        `Recorded purchase with commission`
      );
      return data.success;
    } catch (err) {
      addResult(
        'Purchase Recording',
        false,
        err instanceof Error ? err.message : 'Unknown error'
      );
      return false;
    }
  };

  const runFullTest = async () => {
    setTestRunning(true);
    setResults([]);

    addResult('Test Started', true, 'Running complete affiliate flow test');

    if (products.length === 0) {
      addResult(
        'Load Products',
        false,
        `No products available (loaded ${products.length}). Cannot continue.`
      );
      setTestRunning(false);
      return;
    }

    const testProduct = products[0];
    const referralCode = 'AFFILIATE001'; // Default test referral code

    // Test 1: Click Tracking
    addResult('Step 1', true, 'Testing affiliate click tracking...');
    await testClickTracking(referralCode, testProduct.id);

    // Test 2: Purchase Recording
    addResult('Step 2', true, 'Testing purchase recording...');
    await testPurchaseRecording(testProduct.id, referralCode);

    addResult(
      'Test Complete',
      true,
      'Full affiliate flow test completed. Check database for records.'
    );
    setTestRunning(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Affiliate Platform Test & Demo
          </h1>
          <p className="text-gray-600 mb-6">
            Use this page to test the complete affiliate marketing flow without
            manual UI interaction.
          </p>

          {/* Quick Links */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/links"
              className="block bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition"
            >
              <h3 className="font-bold text-blue-900 mb-2">Affiliate Links</h3>
              <p className="text-sm text-blue-700">
                View your referral links and products
              </p>
            </Link>
            <Link
              href="/dashboard"
              className="block bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition"
            >
              <h3 className="font-bold text-green-900 mb-2">Dashboard</h3>
              <p className="text-sm text-green-700">
                View your affiliate stats and earnings
              </p>
            </Link>
            <Link
              href="/login"
              className="block bg-purple-50 border border-purple-200 rounded-lg p-4 hover:bg-purple-100 transition"
            >
              <h3 className="font-bold text-purple-900 mb-2">Login</h3>
              <p className="text-sm text-purple-700">
                Sign in with test credentials
              </p>
            </Link>
          </div>

          {/* Test Credentials */}
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-amber-900 mb-4">
              Test Credentials
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-amber-900">Affiliate Account</p>
                <p className="text-amber-700">affiliate@example.com</p>
                <p className="text-amber-700">Affiliate@123</p>
                <p className="text-amber-700 mt-1">
                  Code: <span className="font-mono">AFFILIATE001</span>
                </p>
              </div>
              <div>
                <p className="font-semibold text-amber-900">Admin Account</p>
                <p className="text-amber-700">admin@example.com</p>
                <p className="text-amber-700">Admin@123</p>
              </div>
            </div>
          </div>

          {/* Automated Testing */}
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-4">
              Automated Flow Test
            </h2>
            <p className="text-blue-700 mb-4">
              Click the button below to automatically run through the entire
              affiliate flow: click tracking → purchase recording → commission
              creation
            </p>
            <button
              onClick={runFullTest}
              disabled={testRunning || products.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              {testRunning ? 'Running Test...' : 'Run Full Test'}
            </button>
          </div>

          {/* Test Results */}
          {results.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Test Results
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded ${
                      result.success
                        ? 'bg-green-100 border border-green-300'
                        : 'bg-red-100 border border-red-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p
                          className={`font-semibold ${
                            result.success ? 'text-green-900' : 'text-red-900'
                          }`}
                        >
                          {result.step}
                        </p>
                        <p
                          className={`text-sm ${
                            result.success ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {result.message}
                        </p>
                      </div>
                      <span
                        className={`text-xs ${
                          result.success ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {result.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products Info */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Available Products
            </h2>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <p className="font-semibold text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600 font-mono">
                      ID: {product.id}
                    </p>
                    <p className="text-sm text-gray-600 font-mono">
                      Slug: {product.slug}
                    </p>
                    <p className="text-lg font-bold text-green-600 mt-2">
                      ₦{product.price.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">
                Loading products... If this takes too long, check if the backend
                API is running.
              </p>
            )}
          </div>
        </div>

        {/* API Documentation Quick Link */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            API Documentation
          </h2>
          <p className="text-gray-600 mb-4">
            See the TESTING_GUIDE.md file in the project root for complete API
            documentation and troubleshooting guides.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-sm">
            <p className="text-gray-600 mb-2"># Get all products</p>
            <p className="text-blue-600 mb-4">
              GET /api/products
            </p>

            <p className="text-gray-600 mb-2"># Track affiliate click</p>
            <p className="text-blue-600 mb-4">
              GET /api/track/AFFILIATE001/1
            </p>

            <p className="text-gray-600 mb-2"># Record purchase</p>
            <p className="text-blue-600">
              POST /api/purchases
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
