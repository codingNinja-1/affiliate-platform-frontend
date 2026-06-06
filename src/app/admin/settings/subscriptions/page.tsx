'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, DollarSign } from 'lucide-react';
import Sidebar from '@/app/components/Sidebar';

const API_BASE = '/api';

export default function SubscriptionSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [userType, setUserType] = useState<string>('admin');

  const [settings, setSettings] = useState({
    vendor_monthly: '',
    affiliate_monthly: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      router.push('/login');
      return;
    }

    try {
      const parsed = JSON.parse(user);
      const role = parsed?.user_type?.toLowerCase();
      setUserType(role);
      if (role !== 'admin' && role !== 'superadmin') {
        router.push('/dashboard');
        return;
      }
    } catch {
      router.push('/dashboard');
      return;
    }

    fetch(`${API_BASE}/admin/settings/subscriptions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setSettings({
            vendor_monthly: data.data.vendor_monthly ?? '',
            affiliate_monthly: data.data.affiliate_monthly ?? '',
          });
        }
      })
      .catch(() => setError('Failed to load subscription settings.'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch(`${API_BASE}/admin/settings/subscriptions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendor_monthly: parseFloat(settings.vendor_monthly) || 0,
          affiliate_monthly: parseFloat(settings.affiliate_monthly) || 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage('Subscription settings saved.');
      } else {
        setError(data.message || 'Failed to save settings.');
      }
    } catch {
      setError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar userType={userType} />

      <div className="flex-1 md:ml-60 pt-14 md:pt-0">
        <div className="max-w-xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Settings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Set the monthly subscription price for vendors and affiliates. Set to 0 for a free plan.
            </p>
          </div>

          {message && (
            <div className="mb-5 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4 text-sm text-green-800 dark:text-green-300">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center text-gray-400">
              Loading…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-6">

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vendor Monthly Price (₦)
                </label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.vendor_monthly}
                    onChange={(e) => setSettings({ ...settings, vendor_monthly: e.target.value })}
                    placeholder="e.g. 5000"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Annual price will be this × 12 = ₦{((parseFloat(settings.vendor_monthly) || 0) * 12).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Affiliate Monthly Price (₦)
                </label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.affiliate_monthly}
                    onChange={(e) => setSettings({ ...settings, affiliate_monthly: e.target.value })}
                    placeholder="e.g. 2000"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Annual price will be this × 12 = ₦{((parseFloat(settings.affiliate_monthly) || 0) * 12).toLocaleString()}
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
