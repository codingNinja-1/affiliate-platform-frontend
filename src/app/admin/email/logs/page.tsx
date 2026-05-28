'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle, Search, RefreshCw, FileText, CheckCircle, XCircle } from 'lucide-react';

const API_BASE = '/api';

type EmailLog = {
  id: number;
  to_email: string;
  subject?: string | null;
  template_key?: string | null;
  status: string;
  error_message?: string | null;
  meta?: Record<string, unknown> | null;
  created_at: string;
};

type Pagination = {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
};

const templateOptions = [
  { value: '', label: 'All templates' },
  { value: 'withdrawal_processing', label: 'Withdrawal processing' },
  { value: 'withdrawal_approved', label: 'Withdrawal approved' },
  { value: 'withdrawal_rejected', label: 'Withdrawal rejected' },
  { value: 'sale_affiliate', label: 'Sale (affiliate)' },
  { value: 'sale_vendor', label: 'Sale (vendor)' },
  { value: 'purchase_confirmation', label: 'Purchase confirmation' },
];

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
];

export default function EmailLogsPage() {
  const router = useRouter();
  const { user, hydrated } = useAuth();

  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, per_page: 20, current_page: 1, last_page: 1 });
  const [status, setStatus] = useState('');
  const [templateKey, setTemplateKey] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = useMemo(() => {
    const type = user?.user_type?.toLowerCase();
    return type === 'admin' || type === 'superadmin';
  }, [user]);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Authentication token missing. Please log in again.');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        per_page: pagination.per_page.toString(),
      });

      if (status) params.append('status', status);
      if (templateKey) params.append('template_key', templateKey);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`${API_BASE}/admin/email/logs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to load email logs');
      }

      const data = await res.json();
      setLogs(data.data ?? []);
      setPagination(data.pagination ?? pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load email logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!hydrated) return;
    if (!user) return;

    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }

    fetchLogs(pagination.current_page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, user, isAdmin, status, templateKey]);

  const onSearch = () => {
    setPagination((prev) => ({ ...prev, current_page: 1 }));
    fetchLogs(1);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs(pagination.current_page);
  };

  const goToPage = (page: number) => {
    setPagination((prev) => ({ ...prev, current_page: page }));
    fetchLogs(page);
  };

  const statusBadge = (value: string) => {
    const base = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold capitalize';
    if (value === 'sent') return <span className={`${base} bg-green-100 text-green-700`}><CheckCircle size={14} />Sent</span>;
    if (value === 'failed') return <span className={`${base} bg-red-100 text-red-700`}><XCircle size={14} />Failed</span>;
    return <span className={`${base} bg-gray-100 text-gray-700`}>{value}</span>;
  };

  const startCount = logs.length ? (pagination.current_page - 1) * pagination.per_page + 1 : 0;
  const endCount = logs.length ? startCount - 1 + logs.length : 0;

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">Loading...</div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userType="admin" />

      <main className="flex-1 md:ml-60">
        <div className="p-4 sm:p-6 md:p-8">
          <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-500">Email Operations</p>
              <h1 className="text-3xl font-bold text-gray-900">Email Logs</h1>
              <p className="text-sm text-gray-600">Track sent and failed emails with quick filters.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onRefresh}
                disabled={loading || refreshing}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </header>

          <div className="mb-4 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-4">
            <div className="sm:col-span-2 flex items-center gap-2">
              <div className="relative w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                  placeholder="Search recipient or subject"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-blue-400 focus:bg-white focus:outline-none"
                />
              </div>
              <button
                onClick={onSearch}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Search
              </button>
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-400 focus:bg-white focus:outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select
              value={templateKey}
              onChange={(e) => setTemplateKey(e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-400 focus:bg-white focus:outline-none"
            >
              {templateOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center text-gray-500">
                <FileText size={32} className="text-gray-300" />
                <p className="text-lg font-semibold">No email logs yet</p>
                <p className="text-sm text-gray-400">Emails you send will appear here with their delivery status.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Recipient</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Subject</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Template</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{log.to_email}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{log.subject || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 capitalize">{log.template_key || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm">{statusBadge(log.status)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-red-600">{log.error_message || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Showing {startCount} - {endCount} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(Math.max(1, pagination.current_page - 1))}
                disabled={pagination.current_page <= 1 || loading}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {pagination.current_page} of {pagination.last_page}</span>
              <button
                onClick={() => goToPage(Math.min(pagination.last_page, pagination.current_page + 1))}
                disabled={pagination.current_page >= pagination.last_page || loading}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
