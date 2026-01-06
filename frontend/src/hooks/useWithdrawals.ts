import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

export type Withdrawal = {
  id: number | string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  processed_at?: string | null;
  [key: string]: unknown;
};

export type CreateWithdrawalPayload = {
  amount: number;
  bank_name: string;
  account_name: string;
  account_number: string;
};

function normalizeWithdrawal(item: unknown): Withdrawal {
  const data = item as Record<string, unknown>;
  return {
    id: (data?.id ?? Math.random().toString()) as string | number,
    amount: Number(data?.amount ?? 0),
    payment_method: (data?.payment_method ?? 'bank_transfer') as string,
    status: (data?.status ?? 'pending') as string,
    created_at: (data?.created_at ?? new Date().toISOString()) as string,
    processed_at: (data?.processed_at ?? null) as string | null | undefined,
  };
}

export function useWithdrawals(userType?: string) {
  const { token } = useAuth();
  const [data, setData] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const endpoint = useMemo(() => {
    const role = userType?.toLowerCase();

    if (role === 'vendor') return `${API_BASE}/api/vendor/withdrawals`;
    if (role === 'affiliate') return `${API_BASE}/api/affiliate/withdrawals`;

    return `${API_BASE}/api/withdrawals`;
  }, [userType]);

  const fetchWithdrawals = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to load withdrawals');
      }

      const json = await res.json();
      const items = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.withdrawals)
        ? json.withdrawals
        : [];
      setData(items.map(normalizeWithdrawal));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err : new Error('Unable to load withdrawals'));
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, token]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  return { data, isLoading, error, refetch: fetchWithdrawals };
}

export function useCreateWithdrawal(userType?: string) {
  const { token } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const endpoint = useMemo(() => {
    const role = userType?.toLowerCase();

    if (role === 'vendor') return `${API_BASE}/api/vendor/withdrawals`;
    if (role === 'affiliate') return `${API_BASE}/api/affiliate/withdrawals`;

    return `${API_BASE}/api/withdrawals`;
  }, [userType]);

  const mutateAsync = useCallback(
    async (payload: CreateWithdrawalPayload) => {
      if (!token) throw new Error('You must be signed in to request withdrawals');

      setIsPending(true);
      setError(null);

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const message = body?.message || 'Failed to create withdrawal';
          throw new Error(message);
        }

        const json = await res.json().catch(() => ({}));
        return json?.data ? normalizeWithdrawal(json.data) : null;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to create withdrawal'));
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [endpoint, token]
  );

  return { mutateAsync, isPending, error };
}
