'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, Eye, EyeOff } from 'lucide-react';
import Sidebar from '@/app/components/Sidebar';

const API_BASE = '/api';

type PaymentSettings = {
  paystack_test_public_key: string;
  paystack_test_secret_key: string;
  paystack_live_public_key: string;
  paystack_live_secret_key: string;
  paystack_mode: 'test' | 'live';
  korapay_test_public_key: string;
  korapay_test_secret_key: string;
  korapay_live_public_key: string;
  korapay_live_secret_key: string;
  korapay_mode: 'test' | 'live';
  payout_provider: 'paystack' | 'korapay';
  enable_automatic_withdrawals: boolean;
};

export default function PaymentSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showTestSecret, setShowTestSecret] = useState(false);
  const [showLiveSecret, setShowLiveSecret] = useState(false);
  const [showKoraTestSecret, setShowKoraTestSecret] = useState(false);
  const [showKoraLiveSecret, setShowKoraLiveSecret] = useState(false);

  const [settings, setSettings] = useState<PaymentSettings>({
    paystack_test_public_key: '',
    paystack_test_secret_key: '',
    paystack_live_public_key: '',
    paystack_live_secret_key: '',
    paystack_mode: 'test',
    korapay_test_public_key: '',
    korapay_test_secret_key: '',
    korapay_live_public_key: '',
    korapay_live_secret_key: '',
    korapay_mode: 'test',
    payout_provider: 'paystack',
    enable_automatic_withdrawals: true,
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
      if (role !== 'admin' && role !== 'superadmin') {
        router.push('/dashboard');
        return;
      }
    } catch {
      router.push('/dashboard');
      return;
    }

    const loadSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/settings/payment`, {
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
            paystack_test_public_key: data.data.paystack_test_public_key || '',
            paystack_test_secret_key: data.data.paystack_test_secret_key || '',
            paystack_live_public_key: data.data.paystack_live_public_key || '',
            paystack_live_secret_key: data.data.paystack_live_secret_key || '',
            paystack_mode: data.data.paystack_mode || 'test',
            korapay_test_public_key: data.data.korapay_test_public_key || '',
            korapay_test_secret_key: data.data.korapay_test_secret_key || '',
            korapay_live_public_key: data.data.korapay_live_public_key || '',
            korapay_live_secret_key: data.data.korapay_live_secret_key || '',
            korapay_mode: data.data.korapay_mode || 'test',
            payout_provider: data.data.payout_provider || 'paystack',
            enable_automatic_withdrawals: data.data.enable_automatic_withdrawals !== undefined
              ? Boolean(data.data.enable_automatic_withdrawals)
              : true,
          });
        }
      } catch (err) {
        console.error('Failed to load settings', err);
        setError('Failed to load payment settings');
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
      const res = await fetch(`${API_BASE}/admin/settings/payment`, {
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

      setMessage('Payment settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save settings';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof PaymentSettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex bg-gray-100 text-gray-900">
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
    <div className="flex bg-gray-100 text-gray-900">
      <Sidebar userType="admin" />

      <main className="w-full md:ml-60 flex-1 p-8">
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-700">
            ← Back to admin dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Payment Settings</h1>
          <p className="text-gray-600">Configure Paystack payment gateway</p>
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
          {/* Payout Provider */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Payout Provider</h2>
            <p className="text-sm text-gray-600 mb-4">
              Which gateway sends withdrawal payouts to vendors and affiliates.
              Customer payments (checkout, subscriptions) always use Paystack.
            </p>

            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="paystack"
                  checked={settings.payout_provider === 'paystack'}
                  onChange={(e) => handleChange('payout_provider', e.target.value as 'paystack')}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium">Paystack</span>
                  <p className="text-xs text-gray-500">Requires Registered Business (CAC) for transfers</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="korapay"
                  checked={settings.payout_provider === 'korapay'}
                  onChange={(e) => handleChange('payout_provider', e.target.value as 'korapay')}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium">Korapay</span>
                  <p className="text-xs text-gray-500">Uses the Korapay keys configured below</p>
                </div>
              </label>
            </div>
          </div>

          {/* Instant Payouts toggle */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Instant Payouts</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Pay out withdrawals automatically the moment a user requests them.
                  When off, requests stay <span className="font-medium">pending</span> until you approve them on the Withdrawals page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('enable_automatic_withdrawals', !settings.enable_automatic_withdrawals)}
                className={`relative inline-flex h-7 w-13 min-w-[3.25rem] items-center rounded-full transition-colors ${
                  settings.enable_automatic_withdrawals ? 'bg-green-500' : 'bg-gray-300'
                }`}
                aria-pressed={settings.enable_automatic_withdrawals}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    settings.enable_automatic_withdrawals ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className={`mt-3 text-xs font-medium ${settings.enable_automatic_withdrawals ? 'text-green-600' : 'text-amber-600'}`}>
              {settings.enable_automatic_withdrawals
                ? '✓ ON — withdrawals are paid instantly via the selected provider'
                : '⏸ OFF — withdrawals require manual admin approval'}
            </p>
          </div>

          {/* Environment Mode */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Paystack Environment Mode</h2>
            <p className="text-sm text-gray-600 mb-4">
              Select which Paystack environment to use
            </p>

            <div className="flex gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="test"
                  checked={settings.paystack_mode === 'test'}
                  onChange={(e) => handleChange('paystack_mode', e.target.value as 'test')}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium">Test Mode</span>
                  <p className="text-xs text-gray-500">Use test API keys for development</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="live"
                  checked={settings.paystack_mode === 'live'}
                  onChange={(e) => handleChange('paystack_mode', e.target.value as 'live')}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium">Live Mode</span>
                  <p className="text-xs text-gray-500">Use live API keys for production</p>
                </div>
              </label>
            </div>
          </div>

          {/* Test Keys */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Test API Keys</h2>
            <p className="text-sm text-gray-600 mb-6">
              Get your test keys from{' '}
              <a
                href="https://dashboard.paystack.com/#/settings/developers"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                Paystack Dashboard → Settings → API Keys & Webhooks
              </a>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Test Public Key
                </label>
                <input
                  type="text"
                  value={settings.paystack_test_public_key}
                  onChange={(e) => handleChange('paystack_test_public_key', e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="pk_test_..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Test Secret Key
                </label>
                <div className="relative">
                  <input
                    type={showTestSecret ? 'text' : 'password'}
                    value={settings.paystack_test_secret_key}
                    onChange={(e) => handleChange('paystack_test_secret_key', e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 pr-12 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="sk_test_..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowTestSecret(!showTestSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showTestSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Live Keys */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Live API Keys</h2>
            <p className="text-sm text-gray-600 mb-6">
              ⚠️ Keep these keys secure! Never share them or commit them to version control.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Live Public Key
                </label>
                <input
                  type="text"
                  value={settings.paystack_live_public_key}
                  onChange={(e) => handleChange('paystack_live_public_key', e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="pk_live_..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Live Secret Key
                </label>
                <div className="relative">
                  <input
                    type={showLiveSecret ? 'text' : 'password'}
                    value={settings.paystack_live_secret_key}
                    onChange={(e) => handleChange('paystack_live_secret_key', e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 pr-12 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="sk_live_..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowLiveSecret(!showLiveSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showLiveSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Korapay */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Korapay Settings</h2>
            <p className="text-sm text-gray-600 mb-6">
              Get your keys from{' '}
              <a
                href="https://merchant.korapay.com/settings/api-configuration"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                Korapay Dashboard → Settings → API Configuration
              </a>
              . Used for withdrawal payouts when Korapay is the payout provider.
            </p>

            {/* Korapay mode */}
            <div className="flex gap-4 mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="test"
                  checked={settings.korapay_mode === 'test'}
                  onChange={(e) => handleChange('korapay_mode', e.target.value as 'test')}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium">Test Mode</span>
                  <p className="text-xs text-gray-500">Simulated payouts, no real money</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="live"
                  checked={settings.korapay_mode === 'live'}
                  onChange={(e) => handleChange('korapay_mode', e.target.value as 'live')}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium">Live Mode</span>
                  <p className="text-xs text-gray-500">Real bank transfers</p>
                </div>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Test Public Key
                </label>
                <input
                  type="text"
                  value={settings.korapay_test_public_key}
                  onChange={(e) => handleChange('korapay_test_public_key', e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="pk_test_..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Test Secret Key
                </label>
                <div className="relative">
                  <input
                    type={showKoraTestSecret ? 'text' : 'password'}
                    value={settings.korapay_test_secret_key}
                    onChange={(e) => handleChange('korapay_test_secret_key', e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 pr-12 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="sk_test_..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowKoraTestSecret(!showKoraTestSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showKoraTestSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Live Public Key
                </label>
                <input
                  type="text"
                  value={settings.korapay_live_public_key}
                  onChange={(e) => handleChange('korapay_live_public_key', e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="pk_live_..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Live Secret Key
                </label>
                <div className="relative">
                  <input
                    type={showKoraLiveSecret ? 'text' : 'password'}
                    value={settings.korapay_live_secret_key}
                    onChange={(e) => handleChange('korapay_live_secret_key', e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 pr-12 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="sk_live_..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowKoraLiveSecret(!showKoraLiveSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showKoraLiveSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
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
