'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sun, Moon, Bell } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

type User = {
  first_name?: string;
  last_name?: string;
  email: string;
  user_type?: string;
};

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {initials || '?'}
    </div>
  );
}

export default function TopBar() {
  const { theme, toggle } = useTheme();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  const name = user
    ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email
    : '';

  const roleLabel =
    user?.user_type === 'vendor'
      ? 'Vendor'
      : user?.user_type === 'affiliate'
      ? 'Affiliate'
      : user?.user_type === 'admin'
      ? 'Admin'
      : '';

  return (
    <header className="hidden md:flex sticky top-0 z-30 h-16 w-full items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 shadow-sm">
      {/* Left — user info (clickable → profile) */}
      <Link href="/profile" className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
        <Avatar name={name} />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{name || '—'}</p>
          {roleLabel && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{roleLabel}</p>
          )}
        </div>
      </Link>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        {/* Bell */}
        <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors">
          <Bell size={18} />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {theme === 'dark' ? (
            <>
              <Sun size={15} className="text-yellow-400" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon size={15} className="text-indigo-500" />
              <span>Dark</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
