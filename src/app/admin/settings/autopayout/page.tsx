'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, Play, RefreshCw, Clock, Calendar, DollarSign, Users, ToggleLeft, ToggleRight } from 'lucide-react';
import Sidebar from '@/app/components/Sidebar';

type AutopayoutSettings = {
  autopayout_enabled: boolean;
  autopayout_minimum_amount: number;
  autopayout_schedule: 'daily' | 'weekly' | 'monthly';
  autopayout_day_of_week: number;
  autopayout_day_of_month: number;
  autopayout_time: string;
  autopayout_include_vendors: boolean;
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AutopayoutSettingsPage() {
  const router = useRouter();
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [running,  setRunning]  = useState(false);
  const [message,  setMessage]  = useState('');
  const [error,    setError]    = useState('');
  const [runOutput, setRunOutput] = useState('');

  const [settings, setSettings] = useState<AutopayoutSettings>({
    autopayout_enabled:        false,
    autopayout_minimum_amount: 5000,
    autopayout_schedule:       'weekly',
    autopayout_day_of_week:    1,
    autopayout_day_of_month:   1,
    autopayout_time:           '02:00',
    autopayout_include_vendors: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user  = localStorage.getItem('user');
    if (!token || !user) { router.push('/login'); return; }
    try {
      const p = JSON.parse(user);
      if (!['admin','superadmin'].includes(p?.user_type?.toLowerCase())) { router.push('/dashboard'); return; }
    } catch { router.push('/dashboard'); return; }

    const load = async () => {
      try {
        const res  = await fetch('/api/admin/settings/autopayout', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success && data.data) {
          setSettings({
            autopayout_enabled:         !!data.data.autopayout_enabled,
            autopayout_minimum_amount:  Number(data.data.autopayout_minimum_amount ?? 5000),
            autopayout_schedule:        data.data.autopayout_schedule ?? 'weekly',
            autopayout_day_of_week:     Number(data.data.autopayout_day_of_week ?? 1),
            autopayout_day_of_month:    Number(data.data.autopayout_day_of_month ?? 1),
            autopayout_time:            data.data.autopayout_time ?? '02:00',
            autopayout_include_vendors: data.data.autopayout_include_vendors !== false,
          });
        }
      } catch { setError('Failed to load auto-payout settings.'); }
      finally  { setLoading(false); }
    };
    load();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage(''); setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res   = await fetch('/api/admin/settings/autopayout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');
      setMessage('Auto-payout settings saved!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally { setSaving(false); }
  };

  const handleRunNow = async () => {
    setRunOutput(''); setError(''); setRunning(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res   = await fetch('/api/admin/settings/autopayout/trigger', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Trigger failed');
      setRunOutput(data.output || 'Auto-payout triggered successfully.');
      setMessage('Auto-payout run complete!');
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trigger failed');
    } finally { setRunning(false); }
  };

  const set = <K extends keyof AutopayoutSettings>(k: K, v: AutopayoutSettings[K]) =>
    setSettings(prev => ({ ...prev, [k]: v }));

  if (loading) {
    return (
      <div className="flex bg-gray-100 text-gray-900">
        <Sidebar userType="admin" />
        <main className="w-full md:ml-60 flex-1 p-8 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-100 text-gray-900 min-h-screen">
      <Sidebar userType="admin" />

      <main className="w-full md:ml-60 flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-700">← Back to dashboard</Link>
          <h1 className="mt-2 text-3xl font-bold flex items-center gap-3">
            <RefreshCw className="text-blue-600" size={28} />
            Auto-Payout Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Automatically pay out eligible affiliates and vendors on a schedule.
          </p>
        </div>

        {/* Alerts */}
        {message && <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</div>}
        {error   && <div className="mb-6 rounded-lg border border-red-200   bg-red-50   px-4 py-3 text-sm text-red-800">{error}</div>}

        <form onSubmit={handleSave} className="space-y-6">

          {/* ── Global toggle ── */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.autopayout_enabled
                  ? <ToggleRight size={28} className="text-green-500" />
                  : <ToggleLeft  size={28} className="text-gray-400" />}
                <div>
                  <h2 className="text-lg font-semibold">Auto-Payout</h2>
                  <p className="text-sm text-gray-500">
                    {settings.autopayout_enabled ? 'Enabled — payouts run automatically' : 'Disabled — no payouts will run'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => set('autopayout_enabled', !settings.autopayout_enabled)}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none
                  ${settings.autopayout_enabled ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform
                  ${settings.autopayout_enabled ? 'translate-x-8' : 'translate-x-1'}`}/>
              </button>
            </div>

            {!settings.autopayout_enabled && (
              <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
                Auto-payout is currently <strong>OFF</strong>. Users will need to manually request withdrawals.
              </div>
            )}
          </div>

          {/* ── Minimum amount ── */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold">Minimum Payout Amount</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Only users whose balance meets or exceeds this amount will receive an auto-payout.
            </p>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-gray-700">₦</span>
              <input
                type="number"
                min={500}
                step={500}
                value={settings.autopayout_minimum_amount}
                onChange={e => set('autopayout_minimum_amount', Number(e.target.value))}
                className="w-48 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500">minimum balance required</span>
            </div>
          </div>

          {/* ── Schedule ── */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold">Payout Schedule</h2>
            </div>

            {/* Frequency */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
              <div className="flex gap-4 flex-wrap">
                {(['daily', 'weekly', 'monthly'] as const).map(s => (
                  <label key={s} className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border-2 transition
                    ${settings.autopayout_schedule === s
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="schedule"
                      value={s}
                      checked={settings.autopayout_schedule === s}
                      onChange={() => set('autopayout_schedule', s)}
                      className="sr-only"
                    />
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            {/* Day selector — weekly */}
            {settings.autopayout_schedule === 'weekly' && (
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map((day, i) => (
                    <button
                      type="button"
                      key={day}
                      onClick={() => set('autopayout_day_of_week', i)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition
                        ${settings.autopayout_day_of_week === i
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
                    >
                      {day.slice(0,3)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Pays out every <strong>{DAYS[settings.autopayout_day_of_week]}</strong>
                </p>
              </div>
            )}

            {/* Day selector — monthly */}
            {settings.autopayout_schedule === 'monthly' && (
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Day of Month</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={settings.autopayout_day_of_month}
                    onChange={e => set('autopayout_day_of_month', Math.min(28, Math.max(1, Number(e.target.value))))}
                    className="w-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-sm text-gray-500">of every month (1–28 to avoid month-end issues)</span>
                </div>
              </div>
            )}

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Clock size={14} /> Time (server timezone)
              </label>
              <input
                type="time"
                value={settings.autopayout_time}
                onChange={e => set('autopayout_time', e.target.value)}
                className="w-40 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: run at off-peak hours like 02:00</p>
            </div>
          </div>

          {/* ── User types ── */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Users size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold">Who Gets Paid</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Affiliates are always included. Toggle vendors below.
              Users must individually opt in from their profile settings.
            </p>

            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.autopayout_include_vendors}
                  onChange={e => set('autopayout_include_vendors', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${settings.autopayout_include_vendors ? 'bg-blue-500' : 'bg-gray-300'}`} />
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform
                  ${settings.autopayout_include_vendors ? 'translate-x-5' : ''}`} />
              </div>
              <span className="font-medium text-gray-800">Include Vendors</span>
            </label>
          </div>

          {/* ── How it works ── */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-6">
            <h3 className="font-semibold text-blue-900 mb-3">How Auto-Payout Works</h3>
            <ol className="space-y-2 text-sm text-blue-800 list-decimal list-inside">
              <li>The system runs automatically on the configured schedule.</li>
              <li>It finds all users who have <strong>opted in</strong> from their profile settings.</li>
              <li>Only users with <strong>bank details saved</strong> and an <strong>active subscription</strong> are included.</li>
              <li>Each eligible user must have a balance <strong>≥ ₦{settings.autopayout_minimum_amount.toLocaleString()}</strong>.</li>
              <li>Their <strong>full available balance</strong> is paid out via Paystack bank transfer.</li>
              <li>They receive an email notification once the transfer is initiated.</li>
            </ol>
          </div>

          {/* ── Buttons ── */}
          <div className="flex gap-3 flex-wrap">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {saving ? 'Saving…' : 'Save Settings'}
            </button>

            <button
              type="button"
              onClick={handleRunNow}
              disabled={running}
              className="flex items-center gap-2 rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={18} />
              {running ? 'Running…' : 'Run Now (Force)'}
            </button>

            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="rounded-md border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:border-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Run output */}
        {runOutput && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-900 p-5">
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Run Output</p>
            <pre className="text-sm text-green-400 whitespace-pre-wrap font-mono">{runOutput}</pre>
          </div>
        )}
      </main>
    </div>
  );
}
