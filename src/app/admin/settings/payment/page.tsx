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
};

export default function PaymentSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showTestSecret, setShowTestSecret] = useState(false);
  const [showLiveSecret, setShowLiveSecret] = useState(false);

  const [settings, setSettings] = useState<PaymentSettings>({
    paystack_test_public_key: '',
    paystack_test_secret_key: '',
    paystack_live_public_key: '',
    paystack_live_secret_key: '',
    paystack_mode: 'test',
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

  const handleChange = (field: keyof PaymentSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

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
          {/* Environment Mode */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Environment Mode</h2>
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
