'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type BankDetails = {
  bank_name: string;
  account_name: string;
  account_number: string;
  bank_code?: string;
};

export default function BankDetailsSetupPage() {
  const router = useRouter();
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bank_name: '',
    account_name: '',
    account_number: '',
    bank_code: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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

      // Mark as completed and redirect to dashboard
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save bank details';
      setError(message);
      setSaving(false);
    }
  };

  const handleChange = (field: keyof BankDetails, value: string) => {
    setBankDetails((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
              <svg
                className="h-8 w-8 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold">Set Up Bank Details</h1>
            <p className="mt-2 text-sm text-slate-400">
              Complete your profile by adding your bank account information. This is required to
              process withdrawals.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                autoFocus
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

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Continue to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
