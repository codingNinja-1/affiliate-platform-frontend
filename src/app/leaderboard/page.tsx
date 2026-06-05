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

function Avatar({ name, src, size = 'md' }: { name: string; src: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sizeClass = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'md' ? 'w-11 h-11 text-sm' : 'w-9 h-9 text-xs';

  if (src) {
    return <img src={src} alt={name} className={`${sizeClass} rounded-full object-cover`} />;
  }
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold`}>
      {initials || '?'}
    </div>
  );
}

const PODIUM = [
  {
    label: '1st',
    crownColor: '#F59E0B',
    crownShadow: 'shadow-yellow-200',
    bg: 'from-yellow-50 to-amber-100',
    border: 'border-yellow-300',
    badge: 'bg-yellow-400 text-white',
    height: 'h-28',
    emoji: '👑',
  },
  {
    label: '2nd',
    crownColor: '#9CA3AF',
    crownShadow: 'shadow-gray-200',
    bg: 'from-gray-50 to-slate-100',
    border: 'border-gray-300',
    badge: 'bg-gray-400 text-white',
    height: 'h-20',
    emoji: '🥈',
  },
  {
    label: '3rd',
    crownColor: '#D97706',
    crownShadow: 'shadow-orange-200',
    bg: 'from-orange-50 to-amber-100',
    border: 'border-orange-300',
    badge: 'bg-orange-400 text-white',
    height: 'h-16',
    emoji: '🥉',
  },
];

function PodiumCard({
  entry,
  rank,
  formatAmount,
}: {
  entry: LeaderboardEntry;
  rank: 0 | 1 | 2;
  formatAmount: (n: number) => string;
}) {
  const p = PODIUM[rank];
  const order = rank === 0 ? 'order-2' : rank === 1 ? 'order-1' : 'order-3';

  return (
    <div className={`flex flex-col items-center gap-2 ${order}`}>
      {/* Crown emoji */}
      <span className="text-2xl">{p.emoji}</span>

      {/* Avatar */}
      <div className={`ring-4 rounded-full ${rank === 0 ? 'ring-yellow-400' : rank === 1 ? 'ring-gray-300' : 'ring-orange-400'}`}>
        <Avatar name={entry.name} src={entry.avatar} size="lg" />
      </div>

      {/* Name */}
      <div className="text-center">
        <p className="font-bold text-gray-900 text-sm leading-tight max-w-[100px] truncate">{entry.name || 'Anonymous'}</p>
        <p className="text-xs text-gray-500">{entry.total_sales} sales</p>
      </div>

      {/* Podium block */}
      <div className={`w-24 ${p.height} bg-gradient-to-b ${p.bg} border ${p.border} rounded-t-xl flex flex-col items-center justify-center gap-1 shadow-sm`}>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.badge}`}>{p.label}</span>
        <p className="text-xs font-semibold text-gray-700 text-center px-1">{formatAmount(entry.total_earnings)}</p>
      </div>
    </div>
  );
}

function RankRow({
  entry,
  rank,
  formatAmount,
  type,
}: {
  entry: LeaderboardEntry;
  rank: number;
  formatAmount: (n: number) => string;
  type: 'affiliate' | 'vendor';
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
      {/* Rank number */}
      <div className="w-8 text-center flex-shrink-0">
        <span className="text-sm font-bold text-gray-400">#{rank}</span>
      </div>

      <Avatar name={entry.name} src={entry.avatar} size="sm" />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 truncate text-sm">{entry.name || 'Anonymous'}</p>
        <p className="text-xs text-gray-400">
          {type === 'affiliate' && entry.tier
            ? `${entry.tier.charAt(0).toUpperCase() + entry.tier.slice(1)} tier`
            : type === 'vendor' && entry.total_products !== undefined
            ? `${entry.total_products} product${entry.total_products !== 1 ? 's' : ''}`
            : ''}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-gray-900">{entry.total_sales.toLocaleString()} <span className="text-gray-400 font-normal text-xs">sales</span></p>
        <p className="text-xs text-gray-500">{formatAmount(entry.total_earnings)}</p>
      </div>
    </div>
  );
}

function LeaderboardContent({
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
      <div className="space-y-3 p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <span className="text-5xl mb-4">🏆</span>
        <p className="font-medium text-gray-500">No entries yet</p>
        <p className="text-sm mt-1">Be the first to make a sale!</p>
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div>
      {/* Podium */}
      {top3.length >= 1 && (
        <div className="bg-gradient-to-b from-blue-50 to-white px-6 pt-8 pb-0">
          <div className="flex items-end justify-center gap-3">
            {top3.map((entry, i) => (
              <PodiumCard key={i} entry={entry} rank={i as 0 | 1 | 2} formatAmount={formatAmount} />
            ))}
          </div>
        </div>
      )}

      {/* Rest of the list */}
      {rest.length > 0 && (
        <div className="px-4 py-4 divide-y divide-gray-100">
          {rest.map((entry, i) => (
            <RankRow
              key={i}
              entry={entry}
              rank={i + 4}
              formatAmount={formatAmount}
              type={type}
            />
          ))}
        </div>
      )}
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
    if (!token) { window.location.href = '/login'; return; }

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
    <main className="mr-auto flex max-w-2xl flex-col gap-6 bg-gray-50 px-6 py-10">
      {/* Header */}
      <header>
        <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
          ← Back to dashboard
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
          <span className="text-3xl">🏆</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">Top 10 performers on the platform</p>
      </header>

      {/* Tab bar */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {(['affiliate', 'vendor'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'affiliate' ? '🤝 Affiliates' : '🏪 Vendors'}
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {tab === 'affiliate' ? (
          <LeaderboardContent entries={affiliates} loading={loadingAffiliates} type="affiliate" />
        ) : (
          <LeaderboardContent entries={vendors} loading={loadingVendors} type="vendor" />
        )}
      </div>
    </main>
  );
}
