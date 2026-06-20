'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Sun, Moon, Bell, ChevronDown, UserCircle, Settings, LogOut } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

type User = {
  first_name?: string;
  last_name?: string;
  email: string;
  user_type?: string;
  avatar?: string | null;
};

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700 flex-shrink-0"
      />
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {initials || '?'}
    </div>
  );
}

export default function TopBar() {
  const { theme, toggle } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => {
      try {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
      } catch {}
    };
    load();
    // 'storage' fires in OTHER tabs; 'user-updated' fires in the SAME tab
    // (dispatched by the profile page after avatar upload / profile save)
    window.addEventListener('storage', load);
    window.addEventListener('user-updated', load);
    return () => {
      window.removeEventListener('storage', load);
      window.removeEventListener('user-updated', load);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const isAdmin = user?.user_type === 'admin' || user?.user_type === 'superadmin';

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <header className="hidden md:flex sticky top-0 z-30 h-16 w-full items-center justify-end border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 shadow-sm gap-2">

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

      {/* User dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Avatar name={name} avatarUrl={user?.avatar} />
          <div className="leading-tight text-left">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{name || '—'}</p>
            {roleLabel && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{roleLabel}</p>
            )}
          </div>
          <ChevronDown
            size={15}
            className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1 z-50">
            {/* User info header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name || '—'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
            </div>

            <div className="py-1">
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <UserCircle size={16} className="text-gray-400" />
                View Profile
              </Link>

              {!isAdmin && (
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Settings size={16} className="text-gray-400" />
                  Settings
                </Link>
              )}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 py-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
