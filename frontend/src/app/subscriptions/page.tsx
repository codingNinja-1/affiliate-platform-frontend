'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type SubscriptionData = {
  status: string;
  expires_at?: string;
  last_charged_at?: string;
  annual_amount: number;
  monthly_amount: number;
  balance: number;
  can_pay: boolean;
};

export default function SubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      router.push('/login');
      return;
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
  }, [router]);

  const paySubscription = async () => {
    if (!data?.can_pay) return;

    setPaying(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/subscriptions/pay', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.message || 'Payment failed');
      }

      setMessage('Subscription paid successfully.');
      setData((prev) => prev ? {
        ...prev,
        status: payload.data?.status || prev.status,
        expires_at: payload.data?.expires_at || prev.expires_at,
        can_pay: false,
        balance: prev.balance - prev.annual_amount,
      } : prev);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment failed';
      setError(msg);
    } finally {
      setPaying(false);
    }
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
        <p className="mt-2 text-gray-600">Manage your yearly subscription</p>

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
            <div>
              <p className="text-sm text-gray-500">Annual amount</p>
              <p className="text-lg font-semibold text-gray-900">{data.annual_amount.toFixed(2)}</p>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Monthly rate: {data.monthly_amount.toFixed(2)}
          </div>

          {data.expires_at && (
            <p className="mt-2 text-sm text-gray-600">Expires: {new Date(data.expires_at).toLocaleDateString()}</p>
          )}

          <button
            onClick={paySubscription}
            disabled={!data.can_pay || paying}
            className="mt-6 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {paying ? 'Processing...' : 'Pay yearly subscription'}
          </button>
        </div>
      </div>
    </div>
  );
}
