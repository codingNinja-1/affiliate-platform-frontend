'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { africanBanks, countries, banksByCountry } from '@/data/africanBanks';

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
  const [selectedCountry, setSelectedCountry] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [verificationError, setVerificationError] = useState('');

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
      const res = await fetch('/api/settings', {
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

    if (!bankDetails.bank_code) {
      setError('Please select a bank from the list');
      return;
    }

    if (bankDetails.account_number.length < 10) {
      setError('Account number must be at least 10 digits');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/settings/bank-details', {
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
    if (field === 'account_name') {
      setVerificationMessage('');
      setVerificationError('');
    }
  };

  const handleBankSelect = (bankName: string, bankCode: string) => {
    setBankDetails((prev) => ({
      ...prev,
      bank_name: bankName,
      bank_code: bankCode,
      account_name: '',
    }));
    setVerificationMessage('');
    setVerificationError('');
  };

  // Filter banks based on selected country
  const filteredBanks = (selectedCountry
    ? banksByCountry[selectedCountry] || []
    : africanBanks
  ).slice().sort((a, b) => a.name.localeCompare(b.name));

  const verifyAccountName = async () => {
    setVerificationMessage('');
    setVerificationError('');

    if (!bankDetails.bank_code) {
      setVerificationError('Select a bank first.');
      return;
    }

    if (!bankDetails.account_number || bankDetails.account_number.length < 10) {
      setVerificationError('Enter a valid account number (min 10 digits).');
      return;
    }

    setVerifying(true);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/settings/resolve-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bank_code: bankDetails.bank_code,
          account_number: bankDetails.account_number,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Unable to verify account');
      }

      const resolvedName = data.data?.account_name || '';
      setBankDetails((prev) => ({ ...prev, account_name: resolvedName }));
      setVerificationMessage(`Account verified: ${resolvedName}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to verify account';
      setVerificationError(msg);
    } finally {
      setVerifying(false);
    }
  };

  // Clear verification state when bank or account number changes
  useEffect(() => {
    setVerificationMessage('');
    setVerificationError('');
    setBankDetails((prev) => ({ ...prev, account_name: '' }));
  }, [bankDetails.bank_code, bankDetails.account_number]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center bg-gray-50 px-6 py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-gray-50 px-6 py-10">
      <header>
        <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your account and bank details</p>
      </header>

      {message && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Bank Details</h2>
        <p className="mt-1 text-sm text-gray-600">
          These details will be used for processing your withdrawals
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700">
              Country
            </label>
            <select
              id="country"
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setBankDetails(prev => ({ ...prev, bank_name: '', bank_code: '' }));
              }}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All African Countries</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700">
              Bank Name <span className="text-red-500">*</span>
            </label>
            <select
              id="bank_name"
              value={bankDetails.bank_name}
              onChange={(e) => {
                const bank = filteredBanks.find(b => b.name === e.target.value);
                if (bank) {
                  handleBankSelect(bank.name, bank.code);
                } else {
                  handleBankSelect('', '');
                }
              }}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">Select your bank</option>
              {filteredBanks.map((bank) => (
                <option key={`${bank.country}-${bank.code}`} value={bank.name}>
                  {bank.name} ({bank.country})
                </option>
              ))}
            </select>
            {bankDetails.bank_code && (
              <p className="mt-1 text-xs text-gray-500">Bank code: {bankDetails.bank_code}</p>
            )}
          </div>

          <div>
            <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700">
              Bank Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="bank_name"
              value={bankDetails.bank_name}
              onChange={(e) => handleChange('bank_name', e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., Access Bank, GTBank, First Bank"
              required
            />
          </div>

          <div>
            <label htmlFor="account_number" className="block text-sm font-medium text-gray-700">
              Account Number <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex gap-3">
              <input
                type="text"
                id="account_number"
                value={bankDetails.account_number}
                onChange={(e) => handleChange('account_number', e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="10-digit account number"
                minLength={10}
                maxLength={20}
                required
              />
              <button
                type="button"
                onClick={verifyAccountName}
                disabled={verifying}
                className="whitespace-nowrap rounded-md border border-blue-600 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {verifying ? 'Verifying...' : 'Verify name'}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Verification works for Nigerian banks (numeric bank codes) and auto-fills the account name.
            </p>
          </div>

          <div>
            <label htmlFor="account_name" className="block text-sm font-medium text-gray-700">
              Account Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="account_name"
              value={bankDetails.account_name}
              onChange={(e) => handleChange('account_name', e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Will auto-fill after verification"
              required
            />
            {verificationMessage && (
              <p className="mt-1 text-xs text-green-700">{verificationMessage}</p>
            )}
            {verificationError && (
              <p className="mt-1 text-xs text-red-600">{verificationError}</p>
            )}
          </div>

          <div>
            <label htmlFor="bank_code" className="block text-sm font-medium text-gray-700">
              Bank Code <span className="text-gray-500">(Auto-filled)</span>
            </label>
            <input
              type="text"
              id="bank_code"
              value={bankDetails.bank_code}
              onChange={(e) => handleChange('bank_code', e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-900 placeholder-gray-400"
              placeholder="Automatically filled when you select a bank"
              readOnly
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
              className="rounded-md border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
