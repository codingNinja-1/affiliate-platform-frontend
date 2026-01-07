'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useWithdrawals, useCreateWithdrawal, type Withdrawal } from '@/hooks/useWithdrawals';

export default function WithdrawalsPage() {
  const { user } = useAuth();
  const userType = user?.user_type || 'customer';
  
  const { data: withdrawals = [], isLoading, refetch } = useWithdrawals(userType);
  const createWithdrawal = useCreateWithdrawal(userType);
  
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await createWithdrawal.mutateAsync({
        amount: parseFloat(amount),
        bank_name: bankName,
        account_name: accountName,
        account_number: accountNumber,
      });

      setAmount('');
      setBankName('');
      setAccountName('');
      setAccountNumber('');
      setShowForm(false);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit withdrawal request');
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 bg-slate-950 px-6 py-10 text-white">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-blue-400 hover:text-blue-300">
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-semibold">Withdrawals</h1>
          <p className="text-sm text-slate-400">Request and track your withdrawals</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
        >
          {showForm ? 'Cancel' : 'New withdrawal'}
        </button>
      </header>

      {error && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {showForm && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-semibold">Request withdrawal</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Amount (₦)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1000"
                step="0.01"
                disabled={createWithdrawal.isPending}
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-white disabled:opacity-50"
                placeholder="Enter amount"
              />
              <p className="mt-1 text-xs text-slate-400">Minimum withdrawal: ₦1,000</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Bank name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  required
                  disabled={createWithdrawal.isPending}
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-white disabled:opacity-50"
                  placeholder="e.g., GTBank, Access Bank"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Account name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                  disabled={createWithdrawal.isPending}
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-white disabled:opacity-50"
                  placeholder="Full name on account"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Account number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                disabled={createWithdrawal.isPending}
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-white disabled:opacity-50"
                placeholder="10-digit account number"
              />
            </div>

            <button
              type="submit"
              disabled={createWithdrawal.isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
            >
              {createWithdrawal.isPending ? 'Submitting...' : 'Submit request'}
            </button>
          </form>
        </section>
      )}

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold">Withdrawal history</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-800" />
            ))}
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p>No withdrawals yet</p>
            <p className="mt-2 text-sm">Request your first withdrawal to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800">
                <tr className="text-left text-slate-400">
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Requested</th>
                  <th className="pb-3">Processed</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((withdrawal: Withdrawal) => (
                  <tr key={withdrawal.id} className="border-b border-slate-800/50">
                    <td className="py-4 font-medium">₦{withdrawal.amount.toLocaleString()}</td>
                    <td className="py-4">{withdrawal.payment_method}</td>
                    <td className="py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          withdrawal.status === 'paid'
                            ? 'bg-green-500/20 text-green-300'
                            : withdrawal.status === 'approved'
                            ? 'bg-blue-500/20 text-blue-300'
                            : withdrawal.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="py-4">{new Date(withdrawal.created_at).toLocaleDateString()}</td>
                    <td className="py-4">
                      {withdrawal.processed_at
                        ? new Date(withdrawal.processed_at).toLocaleDateString()
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}