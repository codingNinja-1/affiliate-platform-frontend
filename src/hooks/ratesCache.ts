// Shared module-level cache for currency rates — single fetch regardless of how many hooks mount

let cache: Record<string, number> | null = null;
let promise: Promise<Record<string, number>> | null = null;

export async function fetchRates(token: string): Promise<Record<string, number>> {
  if (cache) return cache;
  if (promise) return promise;

  promise = fetch('/api/currency-rates', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  })
    .then((r) => r.json())
    .then((data) => {
      const map: Record<string, number> = {};
      const items: { from_currency: string; to_currency: string; rate: number; is_active: boolean }[] =
        Array.isArray(data) ? data : data?.data ?? [];
      items.forEach((r) => {
        if (r.is_active) map[`${r.from_currency}_${r.to_currency}`] = r.rate;
      });
      cache = map;
      promise = null;
      return map;
    })
    .catch(() => {
      promise = null;
      return {};
    });

  return promise;
}

export function getRatesCache(): Record<string, number> {
  return cache ?? {};
}
