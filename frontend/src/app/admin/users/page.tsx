'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  user_type: string;
  status: string;
  created_at: string;
};

type Status = 'pending' | 'active' | 'suspended' | 'rejected' | 'inactive';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !['admin', 'superadmin'].includes(user.user_type)) {
      window.location.href = '/dashboard';
      return;
    }

    const loadUsers = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/admin/users?filter=${filter}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to load users');

        const data = await res.json();
        setUsers(data.data || []);
      } catch (err) {
        setError('Unable to load users. Admin API endpoint may not be ready yet.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [filter]);

  const updateStatus = async (userId: number, status: Status) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setSavingId(userId);
    setError('');

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Failed to update user');

      const data = await res.json();
      const updated: User = data.data;
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err) {
      setError('Unable to update user status.');
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 bg-slate-950 px-6 py-10 text-white">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-blue-400 hover:text-blue-300">
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-semibold">User management</h1>
          <p className="text-sm text-slate-400">Manage platform users and permissions</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white"
        >
          <option value="all">All users</option>
          <option value="vendor">Vendors</option>
          <option value="affiliate">Affiliates</option>
          <option value="customer">Customers</option>
        </select>
      </header>

      {error && (
        <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-800" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800">
                <tr className="text-left text-slate-400">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Joined</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-800/50">
                    <td className="py-4 font-medium">
                      {`${user.first_name} ${user.last_name}`.trim() || 'N/A'}
                    </td>
                    <td className="py-4">{user.email}</td>
                    <td className="py-4">
                      <span className="rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-300">
                        {user.user_type}
                      </span>
                    </td>
                    <td className="py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          user.status === 'active'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="py-4 text-right space-x-2">
                      {user.status === 'pending' ? (
                        <>
                          <button
                            className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium hover:bg-green-500 disabled:opacity-50"
                            disabled={savingId === user.id}
                            onClick={() => updateStatus(user.id, 'active')}
                          >
                            {savingId === user.id ? 'Saving...' : 'Approve'}
                          </button>
                          <button
                            className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium hover:bg-red-500 disabled:opacity-50"
                            disabled={savingId === user.id}
                            onClick={() => updateStatus(user.id, 'rejected')}
                          >
                            {savingId === user.id ? 'Saving...' : 'Deny'}
                          </button>
                        </>
                      ) : (
                        <span className="text-slate-400 text-xs">{user.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
