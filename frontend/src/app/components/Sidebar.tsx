'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

type NavItem = {
  href: string;
  label: string;
  icon: string;
  visible?: boolean;
};

interface SidebarProps {
  userType?: string | null;
}

export default function Sidebar({ userType = 'customer' }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  const isAdmin = userType === 'admin' || userType === 'superadmin';
  const isVendor = userType === 'vendor';
  const isAffiliate = userType === 'affiliate';

  const adminNav: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/products', label: 'Products', icon: '📦' },
    { href: '/admin/payouts', label: 'Payouts', icon: '💰' },
    { href: '/admin/reports', label: 'Reports', icon: '📈' },
  ];

  const vendorNav: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/products', label: 'My Products', icon: '📦' },
    { href: '/analytics', label: 'Analytics', icon: '📈' },
    { href: '/withdrawals', label: 'Withdrawals', icon: '💰' },
  ];

  const affiliateNav: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/products', label: 'Products', icon: '🛍️' },
    { href: '/links', label: 'Affiliate Links', icon: '🔗' },
    { href: '/analytics', label: 'Analytics', icon: '📈' },
    { href: '/withdrawals', label: 'Withdrawals', icon: '💰' },
  ];

  const customerNav: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/products', label: 'Products', icon: '🛍️' },
  ];

  let navItems = customerNav;
  if (isAdmin) navItems = adminNav;
  else if (isVendor) navItems = vendorNav;
  else if (isAffiliate) navItems = affiliateNav;

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 md:hidden rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white shadow-lg transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="border-b border-slate-800 p-6">
          <h1 className="text-2xl font-bold text-blue-400">AffiliateHub</h1>
          <p className="mt-1 text-xs text-slate-400">
            {isAdmin ? 'Admin Panel' : isVendor ? 'Vendor' : isAffiliate ? 'Affiliate' : 'Customer'}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-4 py-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  setIsOpen(false);
                }
              }}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                isActive(item.href)
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-800 p-6">
          <Link
            href="/settings"
            className="mb-3 flex items-center gap-3 rounded-lg px-4 py-3 text-slate-300 hover:bg-slate-800"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
