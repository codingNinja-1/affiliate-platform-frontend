import { useEffect, useMemo, useState } from 'react';
import { fetchRates, getRatesCache } from './ratesCache';

const CURRENCY_SYMBOLS: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' };

interface BaseAmounts {
  balance: number;
  pending_balance: number;
  total_earnings: number;
  total_withdrawn: number;
}

interface ConvertedAmounts extends BaseAmounts {
  currency: string;
  original_currency: string;
  conversion_rate: number;
}

export function useVendorCurrencyConversion(refreshTrigger = 0, selectedCurrency = 'NGN') {
  const [baseAmounts, setBaseAmounts] = useState<BaseAmounts | null>(null);
  const [rates, setRates] = useState<Record<string, number>>(getRatesCache());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) { setLoading(false); return; }

    setLoading(true);
    Promise.all([
      fetch('/api/vendor/dashboard/converted', {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      }).then((r) => r.json()),
      fetchRates(token),
    ])
      .then(([data, rateMap]) => {
        if (data?.success && data.data) {
          setBaseAmounts({
            balance:         Number(data.data.balance ?? 0),
            pending_balance: Number(data.data.pending_balance ?? 0),
            total_earnings:  Number(data.data.total_earnings ?? 0),
            total_withdrawn: Number(data.data.total_withdrawn ?? 0),
          });
        }
        setRates(rateMap);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  const amounts = useMemo((): ConvertedAmounts | null => {
    if (!baseAmounts) return null;
    const currency = selectedCurrency || 'NGN';
    if (currency === 'NGN') return { ...baseAmounts, currency, original_currency: 'NGN', conversion_rate: 1 };
    const rate = rates[`NGN_${currency}`] ?? null;
    if (!rate) return { ...baseAmounts, currency: 'NGN', original_currency: 'NGN', conversion_rate: 1 };
    return {
      balance:         baseAmounts.balance * rate,
      pending_balance: baseAmounts.pending_balance * rate,
      total_earnings:  baseAmounts.total_earnings * rate,
      total_withdrawn: baseAmounts.total_withdrawn * rate,
      currency, original_currency: 'NGN', conversion_rate: rate,
    };
  }, [baseAmounts, rates, selectedCurrency]);

  const formatAmount = (amount: number, currency?: string) => {
    const curr = currency || amounts?.currency || 'NGN';
    const symbol = CURRENCY_SYMBOLS[curr] ?? curr + ' ';
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return { amounts, loading, formatAmount };
}
