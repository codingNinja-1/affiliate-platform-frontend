'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Payout = {
  id: number;
  user_name: string;
  user_type: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
};

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !['admin', 'superadmin'].includes(user.user_type)) {
      window.location.href = '/dashboard';
      return;
    }

    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    const token = localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    try {
      const res = await fetch(`${apiUrl}/api/admin/withdrawals?status=pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to load payouts');

      const data = await res.json();
      setPayouts(data.data || []);
    } catch (err) {
      setError('Unable to load payout requests. Admin API endpoint may not be ready yet.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    const token = localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    setMessage('');
    setError('');

    try {
      const res = await fetch(`${apiUrl}/api/admin/withdrawals/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed to ${action} payout`);

      setMessage(`Payout ${action}d successfully`);
      loadPayouts();
    } catch (err) {
      setError(`Failed to ${action} payout`);
      console.error(err);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 bg-gray-50 px-6 py-10">
      <header>
        <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900">Payout approvals</h1>
        <p className="text-sm text-gray-600">Review and approve withdrawal requests</p>
      </header>

      {message && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Pending requests</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : payouts.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p>No pending payout requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr className="text-left text-gray-600">
                  <th className="pb-3">User</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Requested</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout.id} className="border-b border-gray-100">
                    <td className="py-4 font-medium text-gray-900">{payout.user_name}</td>
                    <td className="py-4">
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700 font-medium">
                        {payout.user_type}
                      </span>
                    </td>
                    <td className="py-4 font-semibold text-gray-900">₦{payout.amount.toLocaleString()}</td>
                    <td className="py-4 text-gray-700">{payout.payment_method}</td>
                    <td className="py-4 text-gray-700">{new Date(payout.created_at).toLocaleDateString()}</td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleAction(payout.id, 'approve')}
                          className="rounded-md bg-green-600 px-3 py-1 text-sm hover:bg-green-500"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(payout.id, 'reject')}
                          className="rounded-md bg-red-600 px-3 py-1 text-sm hover:bg-red-500"
                        >
                          Reject
                        </button>
                      </div>
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
