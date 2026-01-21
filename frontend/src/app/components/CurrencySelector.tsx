'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Check, RefreshCw } from 'lucide-react';

interface CurrencySelectorProps {
  onCurrencyChange?: (currency: string) => void;
  showLabel?: boolean;
}

export default function CurrencySelector({ onCurrencyChange, showLabel = true }: CurrencySelectorProps) {
  const [currencies, setCurrencies] = useState<string[]>(['NGN']);
  const [currentCurrency, setCurrentCurrency] = useState('NGN');
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const res = await fetch('/api/affiliate/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const availableCurrencies = data.data?.available_currencies || ['NGN'];
        // Ensure NGN is always available
        if (!availableCurrencies.includes('NGN')) {
          availableCurrencies.unshift('NGN');
        }
        setCurrencies(availableCurrencies);
        setCurrentCurrency(data.data?.preferred_currency || 'NGN');
      }
    } catch (error) {
      console.error('Failed to load currency settings:', error);
    }
  };

  const handleCurrencyChange = async (currency: string) => {
    setLoading(true);
    setShowDropdown(false);
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/affiliate/settings/currency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currency }),
      });

      if (res.ok) {
        setCurrentCurrency(currency);
        if (onCurrencyChange) {
          onCurrencyChange(currency);
        }
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update currency');
      }
    } catch (error) {
      console.error('Failed to update currency:', error);
      alert('Failed to update currency. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      NGN: '₦',
      USD: '$',
      GBP: '£',
      EUR: '€',
      JPY: '¥',
      CNY: '¥',
    };
    return symbols[currency] || currency;
  };

  return (
    <div className="relative">
      {showLabel && (
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
          Display Currency
        </label>
      )}
      
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={loading}
        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        <DollarSign size={16} />
        <span>{currentCurrency}</span>
        <span className="text-gray-400">({getCurrencySymbol(currentCurrency)})</span>
        {loading && <RefreshCw size={14} className="animate-spin ml-1" />}
      </button>

      {showDropdown && !loading && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute z-20 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <div className="py-1">
              {currencies.map((currency) => (
                <button
                  key={currency}
                  onClick={() => handleCurrencyChange(currency)}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    currentCurrency === currency
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{getCurrencySymbol(currency)}</span>
                    <span>{currency}</span>
                  </span>
                  {currentCurrency === currency && <Check size={16} />}
                </button>
              ))}
            </div>
            {currencies.length === 1 && (
              <div className="px-4 py-3 text-xs text-gray-500 border-t border-gray-200">
                More currencies available soon
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
