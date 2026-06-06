'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchRates, getRatesCache } from '@/hooks/ratesCache';

const STORAGE_KEY = 'preferred_currency';

interface CurrencyContextValue {
  currency: string;
  setCurrency: (c: string) => void;
  symbol: string;
  /** Converts from NGN (base) → selected currency, then formats with symbol */
  formatAmount: (amount: number) => string;
  rates: Record<string, number>;
}

const SYMBOLS: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' };

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: 'NGN',
  setCurrency: () => {},
  symbol: '₦',
  formatAmount: (n) => `₦${n.toFixed(2)}`,
  rates: {},
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>('NGN');
  const [rates, setRates] = useState<Record<string, number>>(getRatesCache());

  // Hydrate currency preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setCurrencyState(stored);
  }, []);

  // Load exchange rates once (shared module-level cache — single network request)
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    fetchRates(token).then(setRates).catch(console.error);
  }, []);

  const setCurrency = (c: string) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c);
  };

  const symbol = SYMBOLS[currency] ?? currency + ' ';

  /**
   * Converts an NGN amount to the selected display currency, then formats it.
   * All amounts stored in the DB are in NGN. Pass the raw NGN value here.
   */
  const formatAmount = (amount: number): string => {
    let converted = amount;
    if (currency !== 'NGN') {
      const rate = rates[`NGN_${currency}`] ?? null;
      if (rate) converted = amount * rate;
    }
    return `${symbol}${Number(converted).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, symbol, formatAmount, rates }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
