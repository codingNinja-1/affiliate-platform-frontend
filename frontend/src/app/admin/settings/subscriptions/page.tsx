'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/app/components/NoPrefetchLink';
import { Save } from 'lucide-react';
import Sidebar from '@/app/components/Sidebar';

const API_BASE = '/api';

type SubscriptionSettings = {
  vendor_monthly: string;
  affiliate_monthly: string;
  currency: string;
};

export default function SubscriptionSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [settings, setSettings] = useState<SubscriptionSettings>({
    vendor_monthly: '',
    affiliate_monthly: '',
    currency: 'NGN',
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      router.push('/login');
      return;
    }

    const loadSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/settings/subscriptions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to load settings');
        }

        const data = await res.json();
        if (data.success && data.data) {
          setSettings({
            vendor_monthly: data.data.vendor_monthly ?? '',
            affiliate_monthly: data.data.affiliate_monthly ?? '',
            currency: data.data.currency ?? 'NGN',
          });
        }
      } catch (err) {
        console.error('Failed to load subscription settings', err);
        setError('Failed to load subscription settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/admin/settings/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to save settings');
      }

      setMessage('Subscription settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const annualVendor = settings.vendor_monthly ? Number(settings.vendor_monthly) * 12 : 0;
  const annualAffiliate = settings.affiliate_monthly ? Number(settings.affiliate_monthly) * 12 : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100 text-gray-900">
        <Sidebar userType="admin" />
        <main className="w-full md:ml-60 flex-1 p-8">
          <div className="h-screen flex items-center justify-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      <Sidebar userType="admin" />

      <main className="w-full md:ml-60 flex-1 p-8">
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-700">
            ← Back to admin dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Subscription Settings</h1>
          <p className="text-gray-600">Set monthly subscription pricing for vendors and affiliates</p>
        </div>

        {message && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Pricing</h2>
            <p className="text-sm text-gray-600 mb-6">
              Monthly subscription is collected yearly from the user balance.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor Monthly Amount ({settings.currency || 'NGN'})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.vendor_monthly}
                  onChange={(e) => setSettings((prev) => ({ ...prev, vendor_monthly: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="0.00"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Annual charge: {annualVendor.toFixed(2)} {settings.currency || 'NGN'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Affiliate Monthly Amount ({settings.currency || 'NGN'})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.affiliate_monthly}
                  onChange={(e) => setSettings((prev) => ({ ...prev, affiliate_monthly: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="0.00"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Annual charge: {annualAffiliate.toFixed(2)} {settings.currency || 'NGN'}
                </p>
              </div>
            </div>

            <div className="mt-6 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency Code
              </label>
              <input
                type="text"
                value={settings.currency}
                onChange={(e) => setSettings((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="NGN"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="rounded-md border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:border-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

