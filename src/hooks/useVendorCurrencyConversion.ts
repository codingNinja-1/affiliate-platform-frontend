import { useEffect, useState } from 'react';

interface VendorConvertedAmounts {
  balance: number;
  pending_balance: number;
  total_earnings: number;
  total_withdrawn: number;
  currency: string;
  original_currency?: string;
  conversion_rate?: number;
}

export function useVendorCurrencyConversion(refreshTrigger = 0) {
  const [amounts, setAmounts] = useState<VendorConvertedAmounts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConvertedAmounts = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/vendor/dashboard/converted', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setAmounts(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to load vendor converted amounts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConvertedAmounts();
  }, [refreshTrigger]);

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