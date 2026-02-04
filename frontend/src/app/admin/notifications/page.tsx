'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { Send } from 'lucide-react';

const API_BASE = '/api';

type NotificationPayload = {
  title: string;
  body: string;
  level: 'info' | 'success' | 'warning' | 'error';
  target_type: 'all' | 'role' | 'user';
  target_role?: string;
  target_user_id?: string;
  starts_at?: string;
  ends_at?: string;
  is_active?: boolean;
};

type NotificationItem = {
  id: number;
  title: string;
  body: string;
  level: string;
  target_type: string;
  target_role?: string;
  target_user_id?: number;
  created_at?: string;
};

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [items, setItems] = useState<NotificationItem[]>([]);

  const [form, setForm] = useState<NotificationPayload>({
    title: '',
    body: '',
    level: 'info',
    target_type: 'all',
    target_role: 'vendor',
    target_user_id: '',
    starts_at: '',
    ends_at: '',
    is_active: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      router.push('/login');
      return;
    }

    const loadNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setItems(data.data);
        }
      } catch (err) {
        console.error('Failed to load notifications', err);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      const token = localStorage.getItem('auth_token');
      const payload: NotificationPayload = {
        title: form.title,
        body: form.body,
        level: form.level,
        target_type: form.target_type,
        is_active: form.is_active,
      };

      if (form.target_type === 'role') {
        payload.target_role = form.target_role;
      }

      if (form.target_type === 'user' && form.target_user_id) {
        payload.target_user_id = form.target_user_id;
      }

      if (form.starts_at) payload.starts_at = form.starts_at;
      if (form.ends_at) payload.ends_at = form.ends_at;

      const res = await fetch(`${API_BASE}/admin/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send notification');
      }

      setMessage('Notification sent successfully.');
      setForm((prev) => ({
        ...prev,
        title: '',
        body: '',
      }));

      if (data.data) {
        setItems((prev) => [data.data as NotificationItem, ...prev]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send notification';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100 text-gray-900">
        <Sidebar userType="admin" />
        <main className="w-full md:ml-60 flex-1 p-8">
          <div className="h-screen flex items-center justify-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      <Sidebar userType="admin" />

      <main className="w-full md:ml-60 flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-gray-600">Send in-app notifications to users</p>
        </div>

        {message && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-10 space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Notification title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
              <select
                value={form.level}
                onChange={(e) => setForm((prev) => ({ ...prev, level: e.target.value as NotificationPayload['level'] }))}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={4}
              placeholder="Notification message"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Audience</label>
              <select
                value={form.target_type}
                onChange={(e) => setForm((prev) => ({ ...prev, target_type: e.target.value as NotificationPayload['target_type'] }))}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All users</option>
                <option value="role">By role</option>
                <option value="user">Specific user</option>
              </select>
            </div>

            {form.target_type === 'role' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={form.target_role}
                  onChange={(e) => setForm((prev) => ({ ...prev, target_role: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="vendor">Vendors</option>
                  <option value="affiliate">Affiliates</option>
                  <option value="customer">Customers</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            )}

            {form.target_type === 'user' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                <input
                  type="number"
                  value={form.target_user_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, target_user_id: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter user id"
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start time (optional)</label>
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm((prev) => ({ ...prev, starts_at: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End time (optional)</label>
              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm((prev) => ({ ...prev, ends_at: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={18} />
            {saving ? 'Sending...' : 'Send notification'}
          </button>
        </form>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Recent notifications</h2>
          {items.length === 0 ? (
            <p className="text-sm text-gray-500">No notifications sent yet.</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-600">{item.body}</p>
                    </div>
                    <span className="text-xs text-gray-500">{item.level}</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Target: {item.target_type}{item.target_role ? ` (${item.target_role})` : ''}{item.target_user_id ? ` (user ${item.target_user_id})` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
