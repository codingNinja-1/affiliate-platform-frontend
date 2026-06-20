'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAdminWithdrawals, type AdminWithdrawal } from '@/hooks/useAdmin';
import { DollarSign, ChevronLeft, X, CheckCircle, AlertTriangle, Banknote, HandCoins, Ban, RefreshCw } from 'lucide-react';
import Sidebar from '@/app/components/Sidebar';

const API_BASE = '/api';

type Tab = 'all' | 'vendor' | 'affiliate';
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type ModalState =
  | { type: 'autopay'; w: AdminWithdrawal }
  | { type: 'manual'; w: AdminWithdrawal }
  | { type: 'deny'; w: AdminWithdrawal }
  | null;

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-blue-100 text-blue-800',
  paid:     'bg-green-100 text-green-800',
  pending:  'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
};

const displayName = (w: AdminWithdrawal) =>
  (w.user?.first_name || w.user?.last_name)
    ? `${w.user?.first_name ?? ''} ${w.user?.last_name ?? ''}`.trim()
    : (w.user?.email ?? `#${w.user_id}`);

export default function AdminWithdrawalsPage() {
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const { data: withdrawals, isLoading, error, refetch } = useAdminWithdrawals();

  const [tab, setTab]                   = useState<Tab>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [modal, setModal]               = useState<ModalState>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busy, setBusy]                 = useState(false);
  const [notice, setNotice]             = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [isMounted, setIsMounted]       = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (hydrated && user &&
        user.user_type?.toLowerCase() !== 'admin' &&
        user.user_type?.toLowerCase() !== 'superadmin') {
      window.location.href = '/dashboard';
    }
  }, [hydrated, user]);

  // Auto-dismiss success notices
  useEffect(() => {
    if (notice?.kind !== 'success') return;
    const t = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  if (!isMounted || !hydrated) {
    return (
      <div className="flex bg-gray-50">
        <div className="flex-1 p-8 flex items-center justify-center h-screen">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.user_type?.toLowerCase() !== 'admin' && user.user_type?.toLowerCase() !== 'superadmin')) {
    return null;
  }

  // ── filtering ────────────────────────────────────────────────────────────
  const filtered = withdrawals.filter((w: AdminWithdrawal) => {
    const typeMatch = tab === 'all' || w.user_type === tab;
    const statusMatch = statusFilter === 'all' || w.status === statusFilter;
    return typeMatch && statusMatch;
  });

  const counts = {
    all:       withdrawals.length,
    vendor:    withdrawals.filter((w: AdminWithdrawal) => w.user_type === 'vendor').length,
    affiliate: withdrawals.filter((w: AdminWithdrawal) => w.user_type === 'affiliate').length,
  };

  const pendingCount = withdrawals.filter((w: AdminWithdrawal) =>
    w.status === 'pending' && (tab === 'all' || w.user_type === tab)
  ).length;

  // ── actions ──────────────────────────────────────────────────────────────
  const closeModal = () => {
    if (busy) return;
    setModal(null);
    setRejectReason('');
  };

  const runApprove = async (w: AdminWithdrawal, manual: boolean) => {
    setBusy(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/admin/withdrawals/${w.id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ manual }),
      });
      const data = await res.json().catch(() => ({ message: 'Unknown error' }));
      setNotice({
        kind: res.ok ? 'success' : 'error',
        text: data.message || (res.ok ? 'Withdrawal approved' : 'Failed to approve withdrawal'),
      });
      if (res.ok) refetch();
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Network error' });
    } finally {
      setBusy(false);
      setModal(null);
      setRejectReason('');
    }
  };

  const runDeny = async (w: AdminWithdrawal, reason: string) => {
    setBusy(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/admin/withdrawals/${w.id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => ({ message: 'Unknown error' }));
      setNotice({
        kind: res.ok ? 'success' : 'error',
        text: data.message || (res.ok ? 'Withdrawal rejected' : 'Failed to reject withdrawal'),
      });
      if (res.ok) refetch();
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Network error' });
    } finally {
      setBusy(false);
      setModal(null);
      setRejectReason('');
    }
  };

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex bg-gray-100 text-gray-900">
      <Sidebar userType="admin" />

      <main className="w-full md:ml-60 flex-1 min-h-screen overflow-y-auto p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <button onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-3">
            <ChevronLeft size={16} /> Back to admin dashboard
          </button>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Withdrawals Management</h1>
              <p className="text-gray-600 mt-1">Approve and manage withdrawal requests</p>
            </div>
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                {pendingCount} pending
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
            {error.message}
          </div>
        )}

        {/* Action result notice */}
        {notice && (
          <div className={`mb-6 flex items-start gap-3 rounded-lg border p-4 text-sm ${
            notice.kind === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}>
            {notice.kind === 'success'
              ? <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
              : <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />}
            <p className="flex-1">{notice.text}</p>
            <button onClick={() => setNotice(null)} className="flex-shrink-0 opacity-60 hover:opacity-100">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
            {(['all', 'vendor', 'affiliate'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2.5 text-sm font-medium transition-colors border-r border-gray-200 last:border-0
                  ${tab === t
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {t === 'all' ? 'All' : t === 'vendor' ? 'Vendors' : 'Affiliates'}
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === t ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {counts[t]}
                </span>
              </button>
            ))}
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <DollarSign size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No withdrawals found</p>
              <p className="text-sm text-gray-400 mt-1">
                {tab === 'all' ? 'No withdrawal requests yet' : `No ${tab} withdrawals${statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Account</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Requested</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((w: AdminWithdrawal) => {
                    const account = [w.account_name, w.bank_name, w.account_number].filter(Boolean).join(' • ');
                    return (
                      <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="text-sm font-medium text-gray-900">{displayName(w)}</p>
                          <p className="text-xs text-gray-400">ID: #{w.user_id}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                            ${w.user_type === 'vendor' ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'}`}>
                            {w.user_type ?? '—'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-sm text-gray-600 max-w-xs truncate">
                          {account || <span className="text-gray-400">No details</span>}
                        </td>
                        <td className="py-3.5 px-4 text-sm font-semibold text-gray-900">
                          ₦{Number(w.amount).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[w.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-sm text-gray-500">
                          {new Date(w.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          {w.status === 'pending' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setModal({ type: 'autopay', w })}
                                disabled={busy}
                                title="Send money automatically via the payout provider"
                                className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                              >
                                Auto Pay
                              </button>
                              <button
                                onClick={() => setModal({ type: 'manual', w })}
                                disabled={busy}
                                title="Mark approved — you transfer the money yourself"
                                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 transition-colors"
                              >
                                Manual
                              </button>
                              <button
                                onClick={() => { setRejectReason(''); setModal({ type: 'deny', w }); }}
                                disabled={busy}
                                className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                              >
                                Deny
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">{w.status}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── Modal ── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {modal.type === 'autopay' && <><Banknote size={20} className="text-green-600" /> Confirm Auto Payout</>}
                {modal.type === 'manual'  && <><HandCoins size={20} className="text-blue-600" /> Manual Approval</>}
                {modal.type === 'deny'    && <><Ban size={20} className="text-red-600" /> Reject Withdrawal</>}
              </h3>
              <button onClick={closeModal} disabled={busy} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5">
              {/* Withdrawal summary */}
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 mb-4 text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">User</span>
                  <span className="font-medium text-gray-900">{displayName(modal.w)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-bold text-gray-900">₦{Number(modal.w.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Bank</span>
                  <span className="text-gray-900">{modal.w.bank_name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account</span>
                  <span className="text-gray-900">{modal.w.account_number || '—'}</span>
                </div>
              </div>

              {modal.type === 'autopay' && (
                <p className="text-sm text-gray-600">
                  The money will be sent <span className="font-semibold">immediately</span> through your
                  configured payout provider. Continue?
                </p>
              )}

              {modal.type === 'manual' && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <p className="font-medium mb-1">No money will be sent automatically.</p>
                  <p>The withdrawal is marked approved — you must transfer
                    ₦{Number(modal.w.amount).toLocaleString()} to the user from your own bank.</p>
                </div>
              )}

              {modal.type === 'deny' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    rows={3}
                    autoFocus
                    placeholder="e.g. Bank details could not be verified"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 resize-none"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    The user sees this reason and their balance is refunded.
                  </p>
                </div>
              )}
            </div>

            {/* Modal actions */}
            <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={closeModal}
                disabled={busy}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>

              {modal.type === 'autopay' && (
                <button
                  onClick={() => runApprove(modal.w, false)}
                  disabled={busy}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {busy ? <><RefreshCw size={15} className="animate-spin" /> Paying…</> : <>Pay Now</>}
                </button>
              )}

              {modal.type === 'manual' && (
                <button
                  onClick={() => runApprove(modal.w, true)}
                  disabled={busy}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {busy ? <><RefreshCw size={15} className="animate-spin" /> Approving…</> : <>Mark as Approved</>}
                </button>
              )}

              {modal.type === 'deny' && (
                <button
                  onClick={() => runDeny(modal.w, rejectReason.trim())}
                  disabled={busy || !rejectReason.trim()}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {busy ? <><RefreshCw size={15} className="animate-spin" /> Rejecting…</> : <>Reject Withdrawal</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
