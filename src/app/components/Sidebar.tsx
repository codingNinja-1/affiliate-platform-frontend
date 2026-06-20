'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useIdleLogout } from '@/hooks/useIdleLogout';
import { Home, Package, DollarSign, BarChart3, Link2, Settings as SettingsIcon, LogOut, Menu, Users, ShoppingBag, Mail, FileText, ChevronDown, Trophy, CreditCard, UserCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  visible?: boolean;
};

type SubmenuItem = {
  href: string;
  label: string;
};

type NavItemWithSubmenu = NavItem & {
  submenu?: SubmenuItem[];
};

interface SidebarProps {
  userType?: string | null;
}

export default function Sidebar({ userType = 'customer' }: SidebarProps) {
  useIdleLogout();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const pathname = usePathname();

  const isAdmin = userType === 'admin' || userType === 'superadmin';
  const isVendor = userType === 'vendor';
  const isAffiliate = userType === 'affiliate';

  const adminNav: NavItemWithSubmenu[] = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/transactions', label: 'Transactions', icon: CreditCard },
    { href: '/admin/withdrawals', label: 'Withdrawals', icon: DollarSign },
    { href: '/admin/affiliates', label: 'Affiliates', icon: BarChart3 },
    { href: '/admin/vendors', label: 'Vendors', icon: ShoppingBag },
    { href: '/admin/reports', label: 'Reports', icon: FileText },
    {
      href: '/admin/settings/payment',
      label: 'Settings',
      icon: SettingsIcon,
      submenu: [
        { href: '/admin/settings/payment', label: 'Payment Settings' },
        { href: '/admin/settings/subscriptions', label: 'Subscription Pricing' },
        { href: '/admin/currency-rates', label: 'Currency Rates' },
      ],
    },
    { href: '/admin/email', label: 'Email Settings', icon: Mail },
    { href: '/admin/email/logs', label: 'Email Logs', icon: FileText },
  ];

  const vendorNav: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/products', label: 'My Products', icon: Package },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/withdrawals', label: 'Withdrawals', icon: DollarSign },
    { href: '/subscriptions', label: 'Subscription', icon: CreditCard },
  ];

  const affiliateNav: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/products', label: 'Products', icon: ShoppingBag },
    { href: '/links', label: 'Affiliate Links', icon: Link2 },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/withdrawals', label: 'Withdrawals', icon: DollarSign },
    { href: '/subscriptions', label: 'Subscription', icon: CreditCard },
  ];

  const customerNav: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/products', label: 'Products', icon: ShoppingBag },
  ];

  let navItems = customerNav;
  if (isAdmin) navItems = adminNav;
  else if (isVendor) navItems = vendorNav;
  else if (isAffiliate) navItems = affiliateNav;

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(href + '/');

  const toggleSubmenu = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile toggle button - positioned inline on mobile, hidden on desktop */}
      <div className="fixed left-0 top-0 right-0 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 md:hidden z-50 flex items-center px-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 shadow-sm"
        >
          <Menu size={20} />
        </button>
        <div className="ml-3 flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">A</span>
          </div>
          <h1 className="text-base font-bold text-gray-900">AffiliateHub</h1>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-60 bg-white dark:bg-gray-900 shadow-sm transition-transform duration-300 md:translate-x-0 flex flex-col border-r border-gray-200 dark:border-gray-800 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">AffiliateHub</h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 ml-10">
            {isAdmin ? 'Admin Panel' : isVendor ? 'Vendor Portal' : isAffiliate ? 'Affiliate Portal' : 'Customer'}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide px-3 mb-3">Menu</p>
          {navItems.map((item) => (
            <div key={item.href}>
              {(item as NavItemWithSubmenu).submenu ? (
                <>
                  <button
                    onClick={() => toggleSubmenu(item.label)}
                    className={`w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                      expandedMenu === item.label || (item as NavItemWithSubmenu).submenu?.some(sub => isActive(sub.href))
                        ? 'bg-blue-50 dark:bg-blue-950 text-blue-600'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} className={expandedMenu === item.label || (item as NavItemWithSubmenu).submenu?.some(sub => isActive(sub.href)) ? 'text-blue-600' : 'text-gray-500'} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${
                        expandedMenu === item.label ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expandedMenu === item.label && (
                    <div className="mt-1 ml-9 space-y-1 border-l border-gray-200 pl-3">
                      {(item as NavItemWithSubmenu).submenu?.map((subitem) => (
                        <Link
                          key={subitem.href}
                          href={subitem.href}
                          onClick={() => {
                            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                              setIsOpen(false);
                            }
                          }}
                          className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                            isActive(subitem.href)
                              ? 'text-blue-600 font-medium'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 768) {
                      setIsOpen(false);
                    }
                  }}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <item.icon size={20} className={isActive(item.href) ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-2">
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <UserCircle size={20} className="text-gray-500" />
            <span className="text-sm font-medium">Profile</span>
          </Link>
          <Link
            href="/settings"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
              isActive('/settings')
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <SettingsIcon size={20} className={isActive('/settings') ? 'text-blue-600' : 'text-gray-500'} />
            <span className="text-sm font-medium">Settings</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors"
          >
            <LogOut size={20} />
            <span className="text-sm">Logout</span>
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
