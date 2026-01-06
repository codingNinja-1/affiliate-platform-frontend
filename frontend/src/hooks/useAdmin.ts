import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

export type AdminDashboardMetrics = {
  app_gross_revenue: number;
  total_transactions: number;
  active_vendors: number;
  vendor_earnings: number;
  affiliate_earnings: number;
  unpaid_affiliate_balance: number;
  unpaid_vendor_balance: number;
  active_affiliates: number;
  total_customers: number;
  approved_products: number;
  pending_withdrawals: number;
  total_paid_out: number;
};

export type AdminUser = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  user_type: string;
  status: string;
  created_at: string;
};

export type AdminTransaction = {
  id: number;
  uuid: string;
  transaction_ref: string;
  vendor_id: number;
  customer_id: number;
  affiliate_id?: number;
  product_id: number;
  amount: number;
  status: string;
  payment_method?: string | null;
  created_at: string;
};

export type AdminWithdrawal = {
  id: number;
  user_id: number;
  amount: number;
  status: string;
  payment_method?: string;
  created_at: string;
  processed_at?: string;
};

export function useAdminDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState<AdminDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to load dashboard metrics');

      const json = await res.json();
      setData(json?.data ?? null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err : new Error('Unable to load metrics'));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { data, isLoading, error, refetch: fetchMetrics };
}

export function useAdminUsers() {
  const { token } = useAuth();
  const [data, setData] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to load users');

      const json = await res.json();
      const items = Array.isArray(json?.data) ? json.data : [];
      setData(items);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err : new Error('Unable to load users'));
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { data, isLoading, error, refetch: fetchUsers };
}

export function useAdminTransactions() {
  const { token } = useAuth();
  const [data, setData] = useState<AdminTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/admin/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        let apiMessage = '';
        try {
          const body = await res.json();
          apiMessage = body?.message || body?.error || '';
        } catch (err) {
          // ignore body parse errors
        }

        const detail = apiMessage ? ` - ${apiMessage}` : '';
        throw new Error(`Failed to load transactions (${res.status} ${res.statusText})${detail}`);
      }

      const json = await res.json();
      const items = Array.isArray(json?.data) ? json.data : [];
      setData(items);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err : new Error('Unable to load transactions'));
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { data, isLoading, error, refetch: fetchTransactions };
}

export function useAdminWithdrawals() {
  const { token } = useAuth();
  const [data, setData] = useState<AdminWithdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWithdrawals = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/admin/withdrawals`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to load withdrawals');

      const json = await res.json();
      const items = Array.isArray(json?.data) ? json.data : [];
      setData(items);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err : new Error('Unable to load withdrawals'));
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  return { data, isLoading, error, refetch: fetchWithdrawals };
}
