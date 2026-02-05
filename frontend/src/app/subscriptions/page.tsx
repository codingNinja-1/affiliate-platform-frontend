'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type SubscriptionData = {
  status: string;
  expires_at?: string;
  last_charged_at?: string;
  annual_amount: number;
  monthly_amount: number;
  balance: number;
  can_pay: boolean;
  can_pay_with_balance_monthly: boolean;
  can_pay_with_balance_yearly: boolean;
};

function SubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      router.push('/login');
      return;
    }

    // Check if returning from Paystack
    const reference = searchParams.get('reference');
    if (reference) {
      verifyPaystackPayment(reference, token);
    }

    const loadSubscription = async () => {
      try {
        const res = await fetch('/api/subscriptions', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = await res.json();
        if (payload.success) {
          // Ensure numeric values are parsed as numbers
          const rawData = payload.data;
          setData({
            ...rawData,
            balance: parseFloat(rawData.balance) || 0,
            annual_amount: parseFloat(rawData.annual_amount) || 0,
            monthly_amount: parseFloat(rawData.monthly_amount) || 0,
          });
        } else {
          setError(payload.message || 'Failed to load subscription');
        }
      } catch (err) {
        console.error('Failed to load subscription', err);
        setError('Failed to load subscription');
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, [router, searchParams]);

  const verifyPaystackPayment = async (reference: string, token: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/subscriptions/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await res.json();
      if (payload.success) {
        setMessage('Payment verified and subscription activated successfully!');
        // Reload subscription data
        window.location.href = '/subscriptions';
      } else {
        setError(payload.message || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      setError('Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  const payWithBalance = async () => {
    if (!data?.can_pay) return;

    setPaying(true);
    setError('');
    setMessage('');
    setShowPaymentModal(false);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/subscriptions/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          period: selectedPeriod,
          payment_method: 'balance',
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.message || 'Payment failed');
      }

      setMessage('Subscription paid successfully from balance.');
      setData((prev) => prev ? {
        ...prev,
        status: payload.data?.status || prev.status,
        expires_at: payload.data?.expires_at || prev.expires_at,
        can_pay: false,
        balance: parseFloat(payload.data?.balance) || prev.balance,
      } : prev);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed';
      setError(msg);
    } finally {
      setPaying(false);
    }
  };

  const payWithPaystack = async () => {
    if (!data?.can_pay) return;

    setPaying(true);
    setError('');
    setMessage('');
    setShowPaymentModal(false);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/subscriptions/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          period: selectedPeriod,
          payment_method: 'paystack',
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.message || 'Payment initialization failed');
      }

      // Redirect to Paystack
      if (payload.data?.authorization_url) {
        window.location.href = payload.data.authorization_url;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment initialization failed';
      setError(msg);
      setPaying(false);
    }
  };

  const paySubscription = () => {
    setShowPaymentModal(true);
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading subscription...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Subscription details unavailable.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
        <p className="mt-2 text-gray-600">Manage your subscription</p>

        {message && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-lg font-semibold text-gray-900">{data.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Balance</p>
              <p className="text-lg font-semibold text-gray-900">{data.balance.toFixed(2)}</p>
            </div>
          </div>

          {data.expires_at && (
            <p className="mt-4 text-sm text-gray-600">
              {new Date(data.expires_at) > new Date() ? 'Expires' : 'Expired'}: {new Date(data.expires_at).toLocaleDateString()}
            </p>
          )}

          {data.can_pay && (
            <>
              <div className="mt-6 border-t border-gray-200 pt-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Choose payment period</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedPeriod('monthly')}
                    className={`flex-1 rounded-lg border-2 p-4 text-left transition-all ${
                      selectedPeriod === 'monthly'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">Monthly</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{data.monthly_amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-500 mt-1">Billed monthly</p>
                  </button>
                  <button
                    onClick={() => setSelectedPeriod('yearly')}
                    className={`flex-1 rounded-lg border-2 p-4 text-left transition-all ${
                      selectedPeriod === 'yearly'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">Yearly</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{data.annual_amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-500 mt-1">Billed yearly</p>
                  </button>
                </div>
              </div>

              <button
                onClick={paySubscription}
                disabled={paying}
                className="mt-6 w-full rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {paying ? 'Processing...' : 'Pay subscription'}
              </button>
            </>
          )}

          {!data.can_pay && data.status === 'active' && (
            <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
              Your subscription is active. You can renew it within 1 week before expiration.
            </div>
          )}
        </div>
      </div>

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Choose Payment Method</h2>
              <p className="text-gray-600 mb-6">
                Amount to pay: <span className="font-semibold">
                  {selectedPeriod === 'monthly' ? data.monthly_amount.toFixed(2) : data.annual_amount.toFixed(2)}
                </span>
              </p>

              <div className="space-y-3">
                <button
                  onClick={payWithBalance}
                  disabled={
                    selectedPeriod === 'monthly'
                      ? !data.can_pay_with_balance_monthly
                      : !data.can_pay_with_balance_yearly
                  }
                  className="w-full rounded-md bg-green-600 px-5 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pay from Balance
                  {(selectedPeriod === 'monthly' ? !data.can_pay_with_balance_monthly : !data.can_pay_with_balance_yearly) && (
                    <span className="text-xs">(Insufficient)</span>
                  )}
                </button>

                <button
                  onClick={payWithPaystack}
                  className="w-full rounded-md bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Pay with Paystack
                </button>
              </div>

              <button
                onClick={() => setShowPaymentModal(false)}
                className="mt-4 w-full rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="p-8"><p className="text-gray-500">Loading...</p></div>}>
      <SubscriptionContent />
    </Suspense>
  );
}
