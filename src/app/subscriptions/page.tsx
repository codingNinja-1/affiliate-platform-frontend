'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, CheckCircle, AlertTriangle, Wallet, RefreshCw, Clock, Star } from 'lucide-react';
import Sidebar from '@/app/components/Sidebar';

const API_BASE = '/api';

type SubscriptionData = {
  status: 'active' | 'past_due' | 'suspended';
  expires_at: string | null;
  last_charged_at: string | null;
  annual_amount: number;
  monthly_amount: number;
  balance: number;
  can_pay: boolean;
  can_pay_with_balance_monthly: boolean;
  can_pay_with_balance_yearly: boolean;
};

function SubscriptionPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<{ user_type: string; email: string } | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('yearly');

  const fetchSubscription = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSubscription(data.data);
      } else {
        setError(data.message || 'Failed to load subscription status.');
      }
    } catch {
      setError('Failed to load subscription status.');
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyPaystackPayment = useCallback(async (reference: string, token: string) => {
    setVerifying(true);
    try {
      const res = await fetch(`${API_BASE}/subscriptions/verify/${reference}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message || 'Payment confirmed! Your subscription is now active.');
      } else {
        setError(data.message || 'Payment verification failed. Please contact support.');
      }
    } catch {
      setError('Failed to verify payment. Please contact support.');
    } finally {
      setVerifying(false);
      fetchSubscription(token);
    }
  }, [fetchSubscription]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');

    if (!storedUser || !token) {
      router.push('/login');
      return;
    }

    let parsedUser: { user_type: string; email: string };
    try {
      parsedUser = JSON.parse(storedUser);
    } catch {
      router.push('/login');
      return;
    }

    if (!['vendor', 'affiliate'].includes(parsedUser.user_type)) {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);

    const reference = searchParams.get('reference') || searchParams.get('trxref');
    if (reference) {
      verifyPaystackPayment(reference, token);
    } else {
      fetchSubscription(token);
    }
  }, [router, searchParams, fetchSubscription, verifyPaystackPayment]);

  const handlePay = async (method: 'balance' | 'paystack') => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setPaying(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/subscriptions/pay`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ period: selectedPeriod, payment_method: method }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.data?.authorization_url) {
          window.location.href = data.data.authorization_url;
          return;
        }
        setMessage(data.message || 'Subscription activated!');
        fetchSubscription(token);
      } else {
        setError(data.message || 'Payment failed. Please try again.');
      }
    } catch {
      setError('Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const fmt = (amount: number) => `₦${Number(amount).toLocaleString()}`;

  const isActive = subscription?.status === 'active';
  const selectedAmount = selectedPeriod === 'monthly' ? subscription?.monthly_amount ?? 0 : subscription?.annual_amount ?? 0;
  const canPayWithBalance = selectedPeriod === 'monthly'
    ? subscription?.can_pay_with_balance_monthly
    : subscription?.can_pay_with_balance_yearly;

  if (loading || verifying) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar userType={user?.user_type} />
        <div className="flex-1 md:ml-60 flex items-center justify-center pt-14 md:pt-0">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              {verifying ? 'Verifying your payment…' : 'Loading…'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar userType={user?.user_type} />

      <div className="flex-1 md:ml-60 pt-14 md:pt-0">
        <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your {user?.user_type} subscription
            </p>
          </div>

          {/* Alerts */}
          {message && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4 text-green-800 dark:text-green-300">
              <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
              <span className="text-sm">{message}</span>
            </div>
          )}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-300">
              <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Status card */}
          <div className={`rounded-xl border-2 p-5 mb-5 ${
            isActive
              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
              : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {isActive
                  ? <CheckCircle className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" size={24} />
                  : <AlertTriangle className="text-amber-500 mt-0.5 flex-shrink-0" size={24} />
                }
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {isActive ? 'Subscription Active' : 'Subscription Required'}
                  </p>
                  {isActive && subscription?.expires_at && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      Renews / expires on <strong>{formatDate(subscription.expires_at)}</strong>
                    </p>
                  )}
                  {!isActive && (
                    <p className="text-sm text-amber-800 dark:text-amber-300 mt-0.5">
                      Subscribe to unlock withdrawals{user?.user_type === 'vendor' ? ' and product management' : ''}.
                    </p>
                  )}
                </div>
              </div>
              <span className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                isActive
                  ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-200'
              }`}>
                {isActive ? 'Active' : subscription?.status === 'past_due' ? 'Expired' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Features */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <Star size={16} className="text-blue-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">What&apos;s included</h2>
            </div>
            <ul className="space-y-2.5">
              {[
                'Place withdrawal requests at any time',
                ...(user?.user_type === 'vendor'
                  ? ['Create and edit your products', 'Full product analytics']
                  : ['Promote unlimited products', 'Track all your referral clicks']),
                'Full earnings dashboard',
                'Priority customer support',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Payment section */}
          {subscription?.can_pay ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
                {isActive ? 'Renew Subscription' : 'Subscribe Now'}
              </h2>

              {/* Period toggle */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  onClick={() => setSelectedPeriod('monthly')}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    selectedPeriod === 'monthly'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Monthly</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                    {fmt(subscription.monthly_amount)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">billed monthly</p>
                </button>

                <button
                  onClick={() => setSelectedPeriod('yearly')}
                  className={`rounded-xl border-2 p-4 text-left transition-all relative ${
                    selectedPeriod === 'yearly'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="absolute top-2 right-2 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                    Best Value
                  </span>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Yearly</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                    {fmt(subscription.annual_amount)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">billed annually</p>
                </button>
              </div>

              {/* Balance info */}
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <Wallet size={15} />
                <span>Account balance: <strong className="text-gray-900 dark:text-white">{fmt(subscription.balance)}</strong></span>
              </div>

              {/* Pay buttons */}
              <div className="space-y-3">
                {canPayWithBalance && (
                  <button
                    onClick={() => handlePay('balance')}
                    disabled={paying}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
                  >
                    <Wallet size={17} />
                    {paying ? 'Processing…' : `Pay ${fmt(selectedAmount)} from Balance`}
                  </button>
                )}
                <button
                  onClick={() => handlePay('paystack')}
                  disabled={paying}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  <CreditCard size={17} />
                  {paying ? 'Redirecting…' : `Pay ${fmt(selectedAmount)} with Card`}
                </button>
              </div>

              <p className="mt-3 text-center text-xs text-gray-400">
                Card payments are secured via Paystack
              </p>
            </div>
          ) : isActive ? (
            <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-5 text-center">
              <Clock className="mx-auto text-blue-500 mb-2" size={22} />
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Your subscription is active. Renewal opens 7 days before your expiry date.
              </p>
            </div>
          ) : null}

          <div className="mt-6 text-center">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <SubscriptionPageInner />
    </Suspense>
  );
}
