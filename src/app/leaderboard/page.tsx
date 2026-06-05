'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';

type LeaderboardEntry = {
  name: string;
  avatar: string | null;
  total_sales: number;
  total_earnings: number;
  tier?: string;
  referral_code?: string;
  total_products?: number;
};

const CROWN_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

function Crown({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M2 19h20v2H2v-2zM2 17l4-8 6 4 4-6 4 8H2z" />
    </svg>
  );
}

function Avatar({ name, src }: { name: string; src: string | null }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="w-10 h-10 rounded-full object-cover border border-gray-200"
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm border border-blue-200">
      {initials || '?'}
    </div>
  );
}

function LeaderboardTable({
  entries,
  loading,
  type,
}: {
  entries: LeaderboardEntry[];
  loading: boolean;
  type: 'affiliate' | 'vendor';
}) {
  const { formatAmount } = useCurrency();

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <span className="text-4xl mb-3">🏆</span>
        <p className="text-sm">No data yet. Be the first on the board!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => {
        const rank = index + 1;
        const isTopThree = rank <= 3;
        const crownColor = isTopThree ? CROWN_COLORS[index] : null;

        const rankBg =
          rank === 1
            ? 'bg-yellow-50 border-yellow-200'
            : rank === 2
            ? 'bg-gray-50 border-gray-200'
            : rank === 3
            ? 'bg-orange-50 border-orange-200'
            : 'bg-white border-gray-100';

        return (
          <div
            key={index}
            className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-shadow hover:shadow-sm ${rankBg}`}
          >
            {/* Rank */}
            <div className="w-8 flex-shrink-0 flex flex-col items-center gap-0.5">
              {crownColor ? (
                <Crown color={crownColor} />
              ) : (
                <span className="text-sm font-semibold text-gray-400">#{rank}</span>
              )}
            </div>

            {/* Avatar */}
            <Avatar name={entry.name} src={entry.avatar} />

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{entry.name || 'Anonymous'}</p>
              <p className="text-xs text-gray-500">
                {type === 'affiliate' && entry.tier
                  ? `${entry.tier.charAt(0).toUpperCase() + entry.tier.slice(1)} tier`
                  : type === 'vendor' && entry.total_products !== undefined
                  ? `${entry.total_products} product${entry.total_products !== 1 ? 's' : ''}`
                  : null}
              </p>
            </div>

            {/* Stats */}
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-gray-900">{entry.total_sales.toLocaleString()} sales</p>
              <p className="text-xs text-gray-500">{formatAmount(entry.total_earnings)} earned</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'affiliate' | 'vendor'>('affiliate');
  const [affiliates, setAffiliates] = useState<LeaderboardEntry[]>([]);
  const [vendors, setVendors] = useState<LeaderboardEntry[]>([]);
  const [loadingAffiliates, setLoadingAffiliates] = useState(true);
  const [loadingVendors, setLoadingVendors] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    fetch('/api/leaderboard/affiliates', { headers })
      .then((r) => r.json())
      .then((d) => setAffiliates(d.data || []))
      .catch(console.error)
      .finally(() => setLoadingAffiliates(false));

    fetch('/api/leaderboard/vendors', { headers })
      .then((r) => r.json())
      .then((d) => setVendors(d.data || []))
      .catch(console.error)
      .finally(() => setLoadingVendors(false));
  }, []);

  return (
    <main className="mr-auto flex max-w-3xl flex-col gap-6 bg-gray-50 px-6 py-10">
      <header>
        <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900">Leaderboard</h1>
        <p className="text-sm text-gray-600">Top 10 performers this platform</p>
      </header>

      {/* Top 3 podium labels */}
      <div className="flex gap-2 text-xs text-gray-500 font-medium px-1">
        <span style={{ color: CROWN_COLORS[0] }}>▲ Gold</span>
        <span>·</span>
        <span style={{ color: CROWN_COLORS[1] }}>▲ Silver</span>
        <span>·</span>
        <span style={{ color: CROWN_COLORS[2] }}>▲ Bronze</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['affiliate', 'vendor'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'affiliate' ? '🤝 Affiliates' : '🏪 Vendors'}
          </button>
        ))}
      </div>

      {/* Table */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {tab === 'affiliate' ? (
          <LeaderboardTable entries={affiliates} loading={loadingAffiliates} type="affiliate" />
        ) : (
          <LeaderboardTable entries={vendors} loading={loadingVendors} type="vendor" />
        )}
      </section>
    </main>
  );
}
