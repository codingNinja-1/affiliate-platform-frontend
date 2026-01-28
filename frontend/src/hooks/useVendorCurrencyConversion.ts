import { useEffect, useState } from 'react';

interface ConvertedAmounts {
  balance: number;
  pending_balance: number;
  total_earnings: number;
  total_withdrawn: number;
  currency: string;
  original_currency?: string;
  conversion_rate?: number;
}

export function useVendorCurrencyConversion(refreshTrigger = 0, selectedCurrency?: string) {
  const [amounts, setAmounts] = useState<ConvertedAmounts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConvertedAmounts = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        let url = '/api/vendor/dashboard/converted';
        if (selectedCurrency) {
          url += `?currency=${selectedCurrency}`;
        }
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setAmounts(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to load converted amounts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConvertedAmounts();
  }, [refreshTrigger, selectedCurrency]);

  const formatAmount = (amount: number, currency?: string) => {
    const curr = currency || amounts?.currency || 'NGN';
    const symbol = curr === 'NGN' ? '₦' : 
                   curr === 'USD' ? '$' :
                   curr === 'GBP' ? '£' :
                   curr === 'EUR' ? '€' :
                   curr + ' ';
    
    return `${symbol}${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  return { amounts, loading, formatAmount };
}