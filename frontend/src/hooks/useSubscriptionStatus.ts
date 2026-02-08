import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';

type SubscriptionStatus = {
  status?: string;
  expires_at?: string | null;
};

type UseSubscriptionStatusOptions = {
  enabled?: boolean;
};

const API_BASE = '/api';

function isActiveSubscription(status?: string, expiresAt?: string | null): boolean {
  if (status !== 'active') return false;
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() > Date.now();
}

export function useSubscriptionStatus(options: UseSubscriptionStatusOptions = {}) {
  const { token } = useAuth();
  const [data, setData] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const enabled = options.enabled ?? true;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    if (!token) {
      setLoading(false);
      setError('Missing authentication token');
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(`${API_BASE}/subscriptions`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const payload = await res.json().catch(() => ({}));
        if (!res.ok || !payload?.success) {
          throw new Error(payload?.message || 'Failed to load subscription');
        }

        if (active) {
          setData({
            status: payload.data?.status,
            expires_at: payload.data?.expires_at ?? null,
          });
        }
      } catch (err) {
        if (active) {
          const message = err instanceof Error ? err.message : 'Failed to load subscription';
          setError(message);
          setData(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [enabled, token]);

  const isActive = useMemo(() => {
    if (!enabled) return true;
    if (!data) return false;
    return isActiveSubscription(data.status, data.expires_at);
  }, [data, enabled]);

  return { data, loading, error, isActive };
}
