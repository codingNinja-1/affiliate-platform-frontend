'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useWithdrawals, type Withdrawal } from '@/hooks/useWithdrawals';
import { useCurrency } from '@/context/CurrencyContext';
import { CheckCircle, AlertTriangle, Landmark, RefreshCw, Mail } from 'lucide-react';

const API_BASE = '/api';

type BankDetails = {
  bank_name: string;
  account_name: string;
  account_number: string;
  bank_code?: string;
};

type Step = 'form' | 'otp';

export default function WithdrawalsPage() {
  const { user, token } = useAuth();
  const { formatAmount, symbol } = useCurrency();
  const userType = user?.user_type || 'customer';

  const { data: withdrawals = [], isLoading, refetch } = useWithdrawals(userType);

  // Bank details
  const [bankDetails, setBankDetails]   = useState<BankDetails | null>(null);
  const [bankLoading, setBankLoading]   = useState(true);
  const [bankError, setBankError]       = useState('');

  // Form state
  const [showForm, setShowForm]         = useState(false);
  const [step, setStep]                 = useState<Step>('form');
  const [amount, setAmount]             = useState('');
  const [formError, setFormError]       = useState('');
  const [formSuccess, setFormSuccess]   = useState('');
  const [submitting, setSubmitting]     = useState(false);

  // OTP state
  const [otpCode, setOtpCode]           = useState('');
  const [otpSent, setOtpSent]           = useState(false);
  const [otpSending, setOtpSending]     = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpError, setOtpError]         = useState('');

  // Countdown timer
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setTimeout(() => setOtpCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCountdown]);

  // Load bank details
  useEffect(() => {
    if (!token) { setBankLoading(false); return; }
    (async () => {
      try {
        const res  = await fetch(`${API_BASE}/settings`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        const det  = data?.data?.bank_details || data?.bank_details || null;
        if (det?.account_number) {
          setBankDetails({
            bank_name: det.bank_name || '',
            account_name: det.account_name || '',
            account_number: det.account_number || '',
            bank_code: det.bank_code || '',
          });
        } else {
          setBankError('Add your bank details in Settings to request withdrawals.');
        }
      } catch {
        setBankError('Unable to load bank details. Please retry.');
      } finally {
        setBankLoading(false);
      }
    })();
  }, [token]);

  // ── Step 1: validate form, then request OTP ──────────────────────────────
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!bankDetails) { setFormError('No bank details found. Add them in Settings.'); return; }
    if (!amount || parseFloat(amount) < 1000) { setFormError('Minimum withdrawal amount is ₦1,000.'); return; }

    setOtpSending(true); setOtpError('');
    try {
      const res  = await fetch(`${API_BASE}/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ purpose: 'withdrawal_request' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      setOtpSent(true);
      setOtpCountdown(60);
      setStep('otp');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to send OTP. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  // ── Step 2: submit withdrawal with OTP ───────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    if (otpCode.length < 6) { setOtpError('Enter the 6-digit OTP from your email.'); return; }

    setSubmitting(true);
    const endpoint = userType === 'vendor'
      ? `${API_BASE}/vendor/withdrawals`
      : `${API_BASE}/affiliate/withdrawals`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: parseFloat(amount),
          bank_name: bankDetails!.bank_name,
          account_name: bankDetails!.account_name,
          account_number: bankDetails!.account_number,
          bank_code: bankDetails!.bank_code || '',
          payment_method: 'bank_transfer',
          otp_code: otpCode,
        }),
      });

      const data = await res.json().catch(() => ({ success: false, message: 'Server error' }));

      if (!res.ok || !data.success) {
        setOtpError(data.message || 'Withdrawal failed. Please try again.');
        return;
      }

      // ── success ──
      setFormSuccess(data.message || 'Withdrawal submitted successfully!');
      setShowForm(false);
      setStep('form');
      setAmount('');
      setOtpCode('');
      setOtpSent(false);
      refetch();
      setTimeout(() => setFormSuccess(''), 6000);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Failed to submit withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (otpCountdown > 0) return;
    setOtpSending(true); setOtpError('');
    try {
      const res  = await fetch(`${API_BASE}/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ purpose: 'withdrawal_request' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to resend');
      setOtpCountdown(60);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setOtpSending(false);
    }
  };

  const resetForm = () => {
    setShowForm(false); setStep('form'); setFormError(''); setOtpError('');
    setAmount(''); setOtpCode(''); setOtpSent(false);
  };

  return (
    <main className="mr-auto flex max-w-4xl flex-col gap-6 px-4 sm:px-6 py-8">

      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Withdrawals</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Request and track your withdrawals</p>
        </div>
        {!showForm ? (
          <button
            onClick={() => { setShowForm(true); setFormError(''); setOtpError(''); }}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-semibold transition"
          >
            + New Withdrawal
          </button>
        ) : (
          <button
            onClick={resetForm}
            className="rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </button>
        )}
      </header>

      {/* Global success */}
      {formSuccess && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-5 py-4 text-sm text-green-700 dark:text-green-300">
          <CheckCircle size={18} className="flex-shrink-0" />{formSuccess}
        </div>
      )}

      {/* ── Withdrawal form ── */}
      {showForm && (
        <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <Landmark size={18} className="text-blue-500" />
            Request Withdrawal
          </h2>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6">
            {(['form', 'otp'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                  ${step === s ? 'bg-blue-600 text-white' : i < (['form','otp']).indexOf(step) ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                  {i < (['form','otp']).indexOf(step) ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium ${step === s ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                  {s === 'form' ? 'Amount' : 'Verify OTP'}
                </span>
                {i < 1 && <div className="w-8 h-px bg-gray-200 dark:bg-gray-700" />}
              </div>
            ))}
          </div>

          {/* ── STEP 1: Amount ── */}
          {step === 'form' && (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              {formError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                  <AlertTriangle size={15} className="flex-shrink-0" />{formError}
                </div>
              )}

              {bankLoading ? (
                <div className="space-y-3">
                  {[1,2].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />)}
                </div>
              ) : !bankDetails ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                  {bankError || 'No bank details found.'}{' '}
                  <Link href="/settings" className="font-semibold underline">Add them in Settings →</Link>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount ({symbol})
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      required
                      min="1000"
                      step="1"
                      placeholder="Enter amount"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Minimum withdrawal: {symbol}1,000</p>
                  </div>

                  {/* Payout destination */}
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Payout destination</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{bankDetails.bank_name}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{bankDetails.account_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Acct: {bankDetails.account_number}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      Need to change this?{' '}
                      <Link href="/settings" className="text-blue-500 hover:underline">Update in Settings</Link>
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={otpSending || !amount || parseFloat(amount) < 1}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 transition"
                  >
                    {otpSending
                      ? <><RefreshCw size={16} className="animate-spin" /> Sending OTP…</>
                      : <><Mail size={16} /> Continue — Get OTP</>}
                  </button>
                </>
              )}
            </form>
          )}

          {/* ── STEP 2: OTP verification ── */}
          {step === 'otp' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="rounded-lg border border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium">Check your email for a 6-digit OTP.</p>
                <p className="text-xs mt-1 opacity-80">
                  We sent a verification code to confirm your withdrawal of <strong>{symbol}{parseFloat(amount).toLocaleString()}</strong> to{' '}
                  <strong>{bankDetails?.bank_name}</strong>.
                </p>
              </div>

              {otpError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                  <AlertTriangle size={15} className="flex-shrink-0" />{otpError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">6-Digit OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-center text-2xl font-mono tracking-widest text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">Enter the code from your email</span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={otpCountdown > 0 || otpSending}
                    className="text-xs text-blue-500 hover:underline disabled:text-gray-400 disabled:no-underline"
                  >
                    {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : 'Resend OTP'}
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 text-sm space-y-1">
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-semibold">{symbol}{parseFloat(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span className="text-gray-500">Bank</span>
                  <span>{bankDetails?.bank_name}</span>
                </div>
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span className="text-gray-500">Account</span>
                  <span>{bankDetails?.account_number}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting || otpCode.length < 6}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 transition"
                >
                  {submitting
                    ? <><RefreshCw size={16} className="animate-spin" /> Processing…</>
                    : <><CheckCircle size={16} /> Confirm Withdrawal</>}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('form'); setOtpCode(''); setOtpError(''); }}
                  className="px-5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm transition"
                >
                  Back
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* ── Withdrawal history ── */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Withdrawal history</h2>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />)}
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            <Landmark size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No withdrawals yet</p>
            <p className="mt-1 text-sm">Your withdrawal history will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Requested</th>
                  <th className="pb-3">Processed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {withdrawals.map((w: Withdrawal) => (
                  <tr key={w.id}>
                    <td className="py-3.5 font-semibold text-gray-900 dark:text-white">{formatAmount(w.amount)}</td>
                    <td className="py-3.5 text-gray-600 dark:text-gray-400">{w.payment_method}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${w.status === 'paid'     ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          w.status === 'approved' ? 'bg-blue-100  text-blue-700  dark:bg-blue-900/30  dark:text-blue-400'  :
                          w.status === 'pending'  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                    'bg-red-100   text-red-700   dark:bg-red-900/30   dark:text-red-400'}`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-gray-500 dark:text-gray-400">{new Date(w.created_at).toLocaleDateString()}</td>
                    <td className="py-3.5 text-gray-500 dark:text-gray-400">
                      {w.processed_at ? new Date(w.processed_at as string).toLocaleDateString() : '—'}
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
