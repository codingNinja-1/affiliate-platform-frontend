import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';

export type Product = {
  id: number | string;
  name: string;
  description?: string;
  price: number;
  commission_rate: number;
  stock_quantity?: number | null;
  status: string;
  slug?: string;
};

export type CreateProductPayload = {
  name: string;
  description?: string;
  price: number;
  commission_rate: number;
  stock_quantity?: number | null;
  status?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

export function normalizeProduct(item: unknown): Product {
  const data = item as Record<string, unknown>;
  return {
    id: (data?.id ?? data?.product_id ?? Math.random().toString()) as string | number,
    name: (data?.name ?? 'Untitled product') as string,
    description: (data?.description ?? '') as string,
    price: Number(data?.price ?? 0),
    commission_rate: Number(data?.commission_rate ?? 0),
    stock_quantity: (data?.stock_quantity ?? null) as number | null,
    status: (data?.status ?? data?.approval_status ?? 'draft') as string,
    slug: data?.slug as string | undefined,
  };
}

export function useProducts(userType?: string) {
  const { token } = useAuth();
  const [data, setData] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const endpoint = useMemo(() => {
    const role = userType?.toLowerCase();

    if (role === 'vendor') return `${API_BASE}/api/vendor/products`;
    if (role === 'affiliate') return `${API_BASE}/api/affiliate/products`;

    return `${API_BASE}/api/products`;
  }, [userType]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        throw new Error('Failed to load products');
      }

      const json = await res.json();
      const items = Array.isArray(json?.data) ? json.data : Array.isArray(json?.products) ? json.products : [];
      setData(items.map(normalizeProduct));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err : new Error('Unable to load products'));
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { data, isLoading, error, refetch: fetchProducts };
}

export function useCreateProduct() {
  const { token, user } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const endpoint = useMemo(() => {
    const role = user?.user_type?.toLowerCase();

    if (role === 'vendor') return `${API_BASE}/api/vendor/products`;
    if (role === 'affiliate') return `${API_BASE}/api/affiliate/products`;

    return `${API_BASE}/api/products`;
  }, [user?.user_type]);

  const mutateAsync = useCallback(
    async (payload: CreateProductPayload) => {
      if (!token) throw new Error('You must be signed in to create products');

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
          const message = body?.message || 'Failed to create product';
          throw new Error(message);
        }

        const json = await res.json().catch(() => ({}));
        return json?.data ? normalizeProduct(json.data) : null;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to create product'));
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [endpoint, token]
  );

  return { mutateAsync, isPending, error };
}
