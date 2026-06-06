'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  UserCircle,
  ShieldCheck,
  CreditCard,
  Globe,
  Mail,
  FileText,
  Settings2,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

type User = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  user_type: string;
};

type CurrencyOption = { code: string; symbol: string; name: string };

const CURRENCIES: CurrencyOption[] = [
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [currency, setCurrency] = useState('NGN');
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [currencySaved, setCurrencySaved] = useState(false);
  const [currencyError, setCurrencyError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');
    if (!storedUser || !token) { router.push('/login'); return; }

    let parsed: User;
    try { parsed = JSON.parse(storedUser); } catch { router.push('/login'); return; }
    setUser(parsed);

    // Load existing currency preference for vendor/affiliate
    if (parsed.user_type === 'vendor' || parsed.user_type === 'affiliate') {
      const endpoint =
        parsed.user_type === 'vendor'
          ? '/api/vendor/settings'
          : '/api/affiliate/settings';
      fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => {
          const saved =
            data?.data?.preferred_currency ||
            data?.data?.currency ||
            null;
          if (saved) setCurrency(saved);
        })
        .catch(() => {});
    }
  }, [router]);

  const handleCurrencySave = async () => {
    if (!user) return;
    setSavingCurrency(true);
    setCurrencyError('');
    setCurrencySaved(false);
    const token = localStorage.getItem('auth_token');
    const endpoint =
      user.user_type === 'vendor'
        ? '/api/vendor/settings/currency'
        : '/api/affiliate/settings/currency';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currency }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save');
      setCurrencySaved(true);
      setTimeout(() => setCurrencySaved(false), 3000);
    } catch (e: unknown) {
      setCurrencyError(e instanceof Error ? e.message : 'Failed to save currency');
    } finally {
      setSavingCurrency(false);
    }
  };

  const isAdmin = user?.user_type === 'admin' || user?.user_type === 'superadmin';
  const isVendorOrAffiliate = user?.user_type === 'vendor' || user?.user_type === 'affiliate';

  /* ─── Card definitions ─── */
  const generalCards = [
    {
      href: '/settings/notifications',
      icon: Bell,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      title: 'Notifications',
      desc: 'Control which email alerts you receive',
    },
    {
      href: '/profile',
      icon: UserCircle,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      title: 'Profile & Bank Details',
      desc: 'Update your name, photo, and payout account',
    },
    {
      href: '/profile',
      icon: ShieldCheck,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      title: 'Security',
      desc: 'Change your password with OTP verification',
    },
  ];

  const adminCards = [
    {
      href: '/settings/smtp',
      icon: Mail,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
      title: 'SMTP Settings',
      desc: 'Configure your outbound email server',
    },
    {
      href: '/settings/email-templates',
      icon: FileText,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      title: 'Email Templates',
      desc: 'Customise the content of system emails',
    },
    {
      href: '/admin/settings/payment',
      icon: CreditCard,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      title: 'Payment Settings',
      desc: 'Manage Paystack keys and payment config',
    },
    {
      href: '/admin/settings/subscriptions',
      icon: Settings2,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      title: 'Subscription Pricing',
      desc: 'Set monthly prices for vendors and affiliates',
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account preferences and platform configuration
          </p>
        </div>

        {/* ── General settings ── */}
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Account
          </h2>
          <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {generalCards.map(({ href, icon: Icon, iconBg, iconColor, title, desc }) => (
              <Link
                key={href + title}
                href={href}
                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                  <Icon size={20} className={iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                    {title}
                  </p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-gray-400 group-hover:text-blue-500" />
              </Link>
            ))}
          </div>
        </section>

        {/* ── Currency preference (vendor / affiliate only) ── */}
        {isVendorOrAffiliate && (
          <section className="mb-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Display Currency
            </h2>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50">
                  <Globe size={20} className="text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Preferred Currency</p>
                  <p className="mb-3 text-xs text-gray-500">
                    Amounts on your dashboard will be shown in this currency
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={currency}
                      onChange={(e) => { setCurrency(e.target.value); setCurrencySaved(false); }}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.symbol} — {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleCurrencySave}
                      disabled={savingCurrency}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {savingCurrency ? 'Saving…' : 'Save'}
                    </button>
                    {currencySaved && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 size={14} /> Saved
                      </span>
                    )}
                    {currencyError && (
                      <span className="text-xs text-red-600">{currencyError}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Admin-only settings ── */}
        {isAdmin && (
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Platform Configuration
            </h2>
            <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {adminCards.map(({ href, icon: Icon, iconBg, iconColor, title, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                    <Icon size={20} className={iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                      {title}
                    </p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-gray-400 group-hover:text-blue-500" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
