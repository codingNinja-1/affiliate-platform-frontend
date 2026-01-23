'use client';

import { useEffect, useState } from 'react';

interface ConvertedAmounts {
  currency: string;
  balance: number;
  total_earnings: number;
  total_withdrawn: number;
  pending_balance: number;
  conversion_rate: number;
  original_currency?: string;
}

export function useVendorCurrencyConversion(triggerRefresh?: number) {
  const [amounts, setAmounts] = useState<ConvertedAmounts | null>(null);
  const [loading, setLoading] = useState(true);

  const loadConvertedAmounts = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/vendor/converted-amounts', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setAmounts(data.data);
      }
    } catch (error) {
      console.error('Failed to load converted amounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConvertedAmounts();
  }, [triggerRefresh]);

  const refresh = () => {
    setLoading(true);
    loadConvertedAmounts();
  };

  const formatAmount = (amount: number, currency?: string) => {
    const curr = currency || amounts?.currency || 'NGN';
    const symbols: { [key: string]: string } = {
      NGN: '₦',
      USD: '$',
      GBP: '£',
      EUR: '€',
      JPY: '¥',
      CNY: '¥',
    };
    const symbol = symbols[curr] || curr + ' ';
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return {
    amounts,
    loading,
    refresh,
    formatAmount,
    currency: amounts?.currency || 'NGN',
    conversionRate: amounts?.conversion_rate || 1,
  };
}
