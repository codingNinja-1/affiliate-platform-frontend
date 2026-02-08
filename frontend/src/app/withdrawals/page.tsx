'use client';

import { useEffect, useState } from 'react';
import Link from '@/app/components/NoPrefetchLink';
import { useAuth } from '@/hooks/useAuth';
import { useWithdrawals, useCreateWithdrawal, type Withdrawal } from '@/hooks/useWithdrawals';
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';
import { useVendorCurrencyConversion } from '@/hooks/useVendorCurrencyConversion';
import OtpModal from '@/app/components/OtpModal';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import SubscriptionRequiredModal from '@/app/components/SubscriptionRequiredModal';

const API_BASE = '/api'; // Always use relative path for client-side requests

type BankDetails = {
  bank_name: string;
  account_name: string;
  account_number: string;
  bank_code?: string;
};

export default function WithdrawalsPage() {
  const { user, token } = useAuth();
  const userType = user?.user_type || 'customer';

  const isRestrictedUser = userType === 'vendor' || userType === 'affiliate';
  const { isActive: isSubscribed, loading: subscriptionLoading, error: subscriptionError } = useSubscriptionStatus({
    enabled: isRestrictedUser,
  });
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const { data: withdrawals = [], isLoading, refetch } = useWithdrawals(userType, {
    enabled: !isRestrictedUser || isSubscribed,
  });
  const createWithdrawal = useCreateWithdrawal(userType);
  
  const [selectedCurrency, setSelectedCurrency] = useState<string>('NGN');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { amounts, formatAmount } = useCurrencyConversion(refreshTrigger, selectedCurrency);
  const { amounts: vendorAmounts, formatAmount: vendorFormatAmount } = useVendorCurrencyConversion(refreshTrigger, selectedCurrency);
  
  // Load saved currency preference on mount
  useEffect(() => {
    const loadUserCurrencyPreference = async () => {
      if (!token) return;
      try {
        const endpoint = userType === 'vendor' ? '/api/vendor/settings' : '/api/affiliate/settings';
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const preferredCurrency = data.data?.preferred_currency;
          if (preferredCurrency) {
            setSelectedCurrency(preferredCurrency);
          }
        }
      } catch (error) {
        console.error('Failed to load currency preference:', error);
      }
    };
    loadUserCurrencyPreference();
  }, [token, userType]);
  
  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    setTimeout(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 100);
  };
  
  const displayCurrency = userType === 'vendor' ? (vendorAmounts?.currency || selectedCurrency || 'NGN') : (amounts?.currency || selectedCurrency || 'NGN');
  const conversionRate = userType === 'vendor' ? vendorAmounts?.conversion_rate : amounts?.conversion_rate;
  const currencySymbol = displayCurrency === 'NGN' ? '₦' : 
                        displayCurrency === 'USD' ? '$' :
                        displayCurrency === 'GBP' ? '£' :
                        displayCurrency === 'EUR' ? '€' :
                        displayCurrency + ' ';
  
  const convertAmount = (amount: number) => {
    if (!displayCurrency || displayCurrency === 'NGN' || !conversionRate) {
      return amount;
    }
    return amount * conversionRate;
  };
  
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankLoading, setBankLoading] = useState(true);
  const [bankError, setBankError] = useState('');
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [pendingWithdrawal, setPendingWithdrawal] = useState<{
    amount: number;
    bank_name: string;
    account_name: string;
    account_number: string;
  } | null>(null);

  useEffect(() => {
    if (isRestrictedUser && !subscriptionLoading && !isSubscribed) {
      setShowSubscriptionModal(true);
    }
  }, [isRestrictedUser, subscriptionLoading, isSubscribed]);

  useEffect(() => {
    if (!token) {
      setBankLoading(false);
      return;
    }

    const fetchBankDetails = async () => {
      try {
        setBankError('');
        const res = await fetch(`${API_BASE}/settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Could not load bank details');
        }

        const data = await res.json();
        const details =
          data?.data?.bank_details || data?.bank_details || data?.bankDetails || null;

        if (details) {
          const normalized: BankDetails = {
            bank_name: details.bank_name || '',
            account_name: details.account_name || '',
            account_number: details.account_number || '',
            bank_code: details.bank_code || '',
          };

          setBankDetails(normalized);
          setBankName(normalized.bank_name);
          setAccountName(normalized.account_name);
          setAccountNumber(normalized.account_number);
        } else {
          setBankDetails(null);
          setBankError('Add your bank details in Settings to request withdrawals.');
        }
      } catch (err) {
        setBankDetails(null);
        setBankError(
          err instanceof Error ? err.message : 'Unable to load bank details, please retry.'
        );
      } finally {
        setBankLoading(false);
      }
    };

    fetchBankDetails();
  }, [token]);

  const requestOtp = async () => {
    setOtpError('');
    setOtpLoading(true);

    try {
      const res = await fetch('/api/otp/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ purpose: 'withdrawal_request' }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || 'Failed to send verification code');
        return false;
      }

      setOtpOpen(true);
      return true;
    } catch (err) {
      setError('Failed to send verification code');
      console.error(err);
      return false;
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!bankName || !accountName || !accountNumber) {
      setError('Please add your bank details in Settings before requesting a withdrawal.');
      return;
    }

    const payload = {
      amount: parseFloat(amount),
      bank_name: bankName,
      account_name: accountName,
      account_number: accountNumber,
    };

    setPendingWithdrawal(payload);
    const sent = await requestOtp();
    if (!sent) {
      setPendingWithdrawal(null);
    }
  };

  const handleVerifyOtp = async () => {
    if (!pendingWithdrawal) return;

    setOtpError('');
    setOtpLoading(true);

    try {
      await createWithdrawal.mutateAsync({
        ...pendingWithdrawal,
        otp_code: otpCode,
      });

      setAmount('');
      setBankName('');
      setAccountName('');
      setAccountNumber(accountNumber);
      setShowForm(false);
      setOtpOpen(false);
      setOtpCode('');
      setPendingWithdrawal(null);
      refetch();
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col gap-6 bg-gray-50 px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">Withdrawals</h1>
          <p className="text-sm text-gray-600">Request and track your withdrawals</p>
        </div>
        <div className="flex gap-3 items-center">
          <select 
            value={selectedCurrency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            aria-label="Select currency"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="NGN">₦ NGN</option>
            <option value="USD">$ USD</option>
            <option value="GBP">£ GBP</option>
            <option value="EUR">€ EUR</option>
          </select>
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={isRestrictedUser && !isSubscribed}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {showForm ? 'Cancel' : 'New withdrawal'}
          </button>
        </div>
      </header>

      {(error || bankError) && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error || bankError}
        </div>
      )}

      {subscriptionError && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {subscriptionError}
        </div>
      )}

      {!isRestrictedUser || isSubscribed ? null : (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your subscription is inactive. Subscribe to request withdrawals.
        </div>
      )}

      {showForm && (!isRestrictedUser || isSubscribed) && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Request withdrawal</h2>
          {bankLoading ? (
            <div className="space-y-3 text-sm text-gray-600">
              <div className="h-10 animate-pulse rounded-md bg-gray-100" />
              <div className="h-10 animate-pulse rounded-md bg-gray-100" />
              <div className="h-10 animate-pulse rounded-md bg-gray-100" />
            </div>
          ) : !bankDetails ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No bank details found. Please add them in <Link href="/settings" className="text-blue-600 underline">Settings</Link>.
            </div>
          ) : null}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-gray-700 font-medium">Amount ({displayCurrency})</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1000"
                step="0.01"
                disabled={createWithdrawal.isPending}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 disabled:opacity-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter amount"
              />
              <p className="mt-1 text-xs text-gray-500">Minimum withdrawal: 1000 {displayCurrency}</p>
            </div>

            {bankDetails && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
                <p className="text-gray-600">Payout destination</p>
                <p className="mt-1 font-semibold text-gray-900">{bankName}</p>
                <p className="text-gray-700">{accountName}</p>
                <p className="text-gray-700">Acct: {accountNumber}</p>
                <div className="mt-2 text-xs text-gray-500">
                  Need to change this? Update in <Link href="/settings" className="text-blue-600 underline">Settings</Link>.
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={createWithdrawal.isPending || bankLoading || !bankDetails}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
            >
              {createWithdrawal.isPending ? 'Submitting...' : 'Submit request'}
            </button>
          </form>
        </section>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Withdrawal history</h2>
        {subscriptionLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : isRestrictedUser && !isSubscribed ? (
          <div className="py-12 text-center text-gray-500">
            <p>Subscribe to access withdrawals.</p>
            <p className="mt-2 text-sm">Manage your plan in the subscription page.</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p>No withdrawals yet</p>
            <p className="mt-2 text-sm">Request your first withdrawal to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr className="text-left text-gray-600">
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Requested</th>
                  <th className="pb-3">Processed</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((withdrawal: Withdrawal) => {
                  const convertedAmount = convertAmount(withdrawal.amount);
                  return (
                  <tr key={withdrawal.id} className="border-b border-gray-100">
                    <td className="py-4 font-medium text-gray-900">{userType === 'vendor' ? (vendorFormatAmount ? vendorFormatAmount(convertedAmount, displayCurrency) : (currencySymbol + convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))) : (formatAmount ? formatAmount(convertedAmount, displayCurrency) : (currencySymbol + convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })))}</td>
                    <td className="py-4 text-gray-700">{withdrawal.payment_method}</td>
                    <td className="py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          withdrawal.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : withdrawal.status === 'approved'
                            ? 'bg-blue-100 text-blue-700'
                            : withdrawal.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="py-4 text-gray-700">{new Date(withdrawal.created_at).toLocaleDateString()}</td>
                    <td className="py-4 text-gray-700">
                      {withdrawal.processed_at
                        ? new Date(withdrawal.processed_at).toLocaleDateString()
                        : '-'}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <OtpModal
        open={otpOpen}
        title="Verify withdrawal"
        description="Enter the 6-digit code sent to your email to submit this withdrawal."
        code={otpCode}
        onCodeChange={setOtpCode}
        onVerify={handleVerifyOtp}
        onResend={requestOtp}
        onClose={() => {
          setOtpOpen(false);
          setOtpCode('');
        }}
        isLoading={otpLoading}
        error={otpError}
      />
      <SubscriptionRequiredModal
        open={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        title="Subscribe to access withdrawals"
        description="Your subscription is inactive. Please subscribe to request withdrawals."
        actionHref="/subscriptions"
        actionLabel="View subscription"
      />
    </main>
  );
}
