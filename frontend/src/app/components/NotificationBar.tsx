"use client";

import { useCallback, useEffect, useState } from 'react';
import { X, Bell } from 'lucide-react';
import { PushNotificationManager } from './PushNotificationManager';

type NotificationItem = {
  id: number;
  title: string;
  body: string;
  level: 'info' | 'success' | 'warning' | 'error';
  created_at?: string;
};

const levelStyles: Record<NotificationItem['level'], string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-900',
  success: 'bg-green-50 border-green-200 text-green-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  error: 'bg-red-50 border-red-200 text-red-900',
};

export default function NotificationBar() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/notifications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setNotifications(data.data as NotificationItem[]);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const dismiss = async (id: number) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error('Failed to dismiss notification', err);
    } finally {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    }
  };

  if (loading || notifications.length === 0) {
    return null;
  }

  const [current, ...remaining] = notifications;

  return (
    <>
      <PushNotificationManager />
      <div className={`border-b px-4 py-3 ${levelStyles[current.level]}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Bell size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">{current.title}</p>
              <p className="text-sm text-current/80">{current.body}</p>
              {remaining.length > 0 && (
                <p className="mt-1 text-xs text-current/70">
                  {remaining.length} more notification{remaining.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => dismiss(current.id)}
            className="rounded-md p-1 text-current/70 hover:text-current"
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
