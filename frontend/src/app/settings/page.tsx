'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type BankDetails = {
  bank_name: string;
  account_name: string;
  account_number: string;
  bank_code?: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bank_name: '',
    account_name: '',
    account_number: '',
    bank_code: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');

    if (!storedUser || !token) {
      router.push('/login');
      return;
    }

    try {
      JSON.parse(storedUser);
    } catch (err) {
      console.error('Failed to parse stored user', err);
      router.push('/login');
      return;
    }

    loadSettings(token);
  }, [router]);

  const loadSettings = async (token: string) => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load settings');
      }

      const data = await res.json();

      if (data.success && data.data.bank_details) {
        setBankDetails({
          bank_name: data.data.bank_details.bank_name || '',
          account_name: data.data.bank_details.account_name || '',
          account_number: data.data.bank_details.account_number || '',
          bank_code: data.data.bank_details.bank_code || '',
        });
      }
    } catch (err) {
      console.error('Failed to load settings', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!bankDetails.bank_name || !bankDetails.account_name || !bankDetails.account_number) {
      setError('Please fill in all required fields');
      return;
    }

    if (bankDetails.account_number.length < 10) {
      setError('Account number must be at least 10 digits');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('http://127.0.0.1:8000/api/settings/bank-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bankDetails),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to save bank details');
      }

      setMessage('Bank details saved successfully!');
      
      // Redirect to dashboard after 1.5 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save bank details';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof BankDetails, value: string) => {
    setBankDetails((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center bg-slate-950 px-6 py-10 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-slate-950 px-6 py-10 text-white">
      <header>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">Manage your account and bank details</p>
      </header>

      {message && (
        <div className="rounded-md border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-100">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <h2 className="text-xl font-semibold">Bank Details</h2>
        <p className="mt-1 text-sm text-slate-400">
          These details will be used for processing your withdrawals
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="bank_name" className="block text-sm font-medium text-slate-300">
              Bank Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="bank_name"
              value={bankDetails.bank_name}
              onChange={(e) => handleChange('bank_name', e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., Access Bank, GTBank, First Bank"
              required
            />
          </div>

          <div>
            <label htmlFor="account_name" className="block text-sm font-medium text-slate-300">
              Account Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="account_name"
              value={bankDetails.account_name}
              onChange={(e) => handleChange('account_name', e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Account holder name"
              required
            />
          </div>

          <div>
            <label htmlFor="account_number" className="block text-sm font-medium text-slate-300">
              Account Number <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="account_number"
              value={bankDetails.account_number}
              onChange={(e) => handleChange('account_number', e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="10-digit account number"
              minLength={10}
              maxLength={20}
              required
            />
          </div>

          <div>
            <label htmlFor="bank_code" className="block text-sm font-medium text-slate-300">
              Bank Code <span className="text-slate-500">(Optional)</span>
            </label>
            <input
              type="text"
              id="bank_code"
              value={bankDetails.bank_code}
              onChange={(e) => handleChange('bank_code', e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., 044 for Access Bank"
              maxLength={20}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Bank Details'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="rounded-md border border-slate-700 px-6 py-2 text-sm font-medium text-slate-200 hover:border-slate-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
