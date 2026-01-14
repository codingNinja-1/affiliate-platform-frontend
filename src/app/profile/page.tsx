'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  user_type: string;
  status: string;
  avatar?: string;
  created_at: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const loadProfile = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to load profile');

        const data = await res.json();
        setUser(data.data);
        setFormData({
          first_name: data.data.first_name || '',
          last_name: data.data.last_name || '',
          phone: data.data.phone || '',
        });
      } catch (err) {
        setError('Unable to load profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Update failed');

      const data = await res.json();
      setUser(data.data);
      setEditing(false);
      setMessage('Profile updated successfully');
      localStorage.setItem('user', JSON.stringify(data.data));
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 bg-slate-950 px-6 py-10 text-white">
        <div className="h-8 w-32 animate-pulse rounded bg-slate-800" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-900" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 bg-slate-950 px-6 py-10 text-white">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-blue-400 hover:text-blue-300">
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-semibold">Profile</h1>
        </div>
      </header>

      {message && (
        <div className="rounded-md border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-100">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Personal information</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-300">First name</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Last name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-white"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium hover:border-slate-500"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 text-sm">
            <InfoRow label="Name" value={`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Not set'} />
            <InfoRow label="Email" value={user?.email || ''} />
            <InfoRow label="Phone" value={user?.phone || 'Not set'} />
            <InfoRow label="User type" value={user?.user_type || ''} />
            <InfoRow label="Status" value={user?.status || ''} />
            <InfoRow label="Member since" value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''} />
          </div>
        )}
      </section>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-800 pb-2">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}
