'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const STORAGE_KEY = 'preferred_currency';

interface CurrencyContextValue {
  currency: string;
  setCurrency: (c: string) => void;
  symbol: string;
  formatAmount: (amount: number) => string;
}

const SYMBOLS: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' };

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: 'NGN',
  setCurrency: () => {},
  symbol: '₦',
  formatAmount: (n) => `₦${n.toFixed(2)}`,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>('NGN');

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setCurrencyState(stored);
  }, []);

  const setCurrency = (c: string) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c);
  };

  const symbol = SYMBOLS[currency] ?? currency + ' ';

  const formatAmount = (amount: number) =>
    `${symbol}${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, symbol, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
