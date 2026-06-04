import { useEffect, useState } from 'react';

let cache: Record<string, number> | null = null;

export function useRates() {
  const [rates, setRates] = useState<Record<string, number>>(cache ?? {});

  useEffect(() => {
    if (cache) { setRates(cache); return; }
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    fetch('/api/currency-rates', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, number> = {};
        const items = Array.isArray(data) ? data : data?.data ?? [];
        items.forEach((r: { from_currency: string; to_currency: string; rate: number; is_active: boolean }) => {
          if (r.is_active) map[`${r.from_currency}_${r.to_currency}`] = Number(r.rate);
        });
        cache = map;
        setRates(map);
      })
      .catch(console.error);
  }, []);

  return { rates };
}
