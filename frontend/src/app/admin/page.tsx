'use client';

import React, { useState, useEffect } from 'react';
import { Home, ShoppingBag, Users, CreditCard, TrendingUp, BarChart3, DollarSign, Settings, Mail, Link2, Plus, LogOut, Menu, X, LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_BASE = '/api';

interface DashboardStats {
  app_gross_revenue: number;
  total_transactions: number;
  total_paid_out: number;
  vendor_earnings: number;
  affiliate_earnings: number;
  unpaid_vendor_balance: number;
  unpaid_affiliate_balance: number;
  pending_withdrawals: number;
  active_vendors: number;
  active_affiliates: number;
  total_customers: number;
  approved_products: number;
}

// Sidebar Component
const Sidebar = ({ currentPage, setCurrentPage, isOpen, setIsOpen }: { currentPage: string; setCurrentPage: (page: string) => void; isOpen: boolean; setIsOpen: (open: boolean) => void }) => {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleNavigation = (id: string, path?: string) => {
    if (path) {
      router.push(path);
    } else {
      setCurrentPage(id);
    }
    // Close sidebar on mobile after navigation
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const menuItems: Array<{ id: string; icon: LucideIcon; label: string; path?: string; badge?: string }> = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'users', icon: Users, label: 'Users', path: '/admin/users' },
    { id: 'products', icon: ShoppingBag, label: 'Products', path: '/admin/products' },
    { id: 'transactions', icon: CreditCard, label: 'Transactions', path: '/admin/transactions' },
    { id: 'withdrawals', icon: DollarSign, label: 'Withdrawals', path: '/admin/withdrawals' },
    { id: 'affiliates', icon: TrendingUp, label: 'Affiliates', path: '/admin/affiliates' },
    { id: 'reports', icon: BarChart3, label: 'Reports', path: '/admin/reports' },
  ];

  const preferences = [
    { id: 'settings', icon: Settings, label: 'Settings', path: '/admin/settings/payment' },
    { id: 'integrations', icon: Link2, label: 'Integrations' },
    { id: 'email', icon: Mail, label: 'Email', path: '/admin/email' },
  ];

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 md:hidden rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div className={`w-60 bg-white h-screen flex flex-col border-r border-gray-200 fixed left-0 top-0 shadow-sm transition-transform duration-300 z-40 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 sm:w-8 h-7 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-base sm:text-xl font-bold text-gray-900">AffiliateHub</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 mb-3">Dashboard</p>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id, item.path)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                currentPage === item.id 
                  ? 'bg-blue-50 text-blue-600 font-medium' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={currentPage === item.id ? 'text-blue-600' : 'text-gray-500'} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">{item.badge}</span>
              )}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 mb-3">Preferences</p>
          {preferences.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id, item.path)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                currentPage === item.id 
                  ? 'bg-blue-50 text-blue-600 font-medium' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={currentPage === item.id ? 'text-blue-600' : 'text-gray-500'} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg hover:bg-red-50 text-red-600 font-medium transition-colors"
        >
          <LogOut size={20} />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
    </>
  );
};

// Dashboard Page
const Dashboard = ({ stats }: { stats: DashboardStats | null }) => {
  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:justify-between md:items-center mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-600">Platform overview and management</p>
        </div>
        <button className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 shadow-sm text-sm sm:text-base w-full sm:w-auto">
          <Plus size={18} />
          New Campaign
        </button>
      </div>

      {/* Quick Setup Guide */}
      <div className="bg-blue-50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-blue-100">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Quick setup guide</h2>
          <button className="text-xs sm:text-sm text-gray-600 hover:text-gray-900">Collapse</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100">
            <div className="h-20 sm:h-24 bg-linear-to-br from-green-100 to-green-200 rounded-lg mb-3 flex items-center justify-center">
              <div className="text-3xl sm:text-4xl">📊</div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Customize your account</h3>
            <p className="text-xs text-gray-600">Supercharge your brand identity. Upload your logo to your account.</p>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100">
            <div className="h-20 sm:h-24 bg-linear-to-br from-red-100 to-red-200 rounded-lg mb-3 flex items-center justify-center">
              <div className="text-3xl sm:text-4xl">🎯</div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Create the 1st offer</h3>
            <p className="text-xs text-gray-600">Set up affiliate commissions and add your landing page in under 5 minutes.</p>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100">
            <div className="h-20 sm:h-24 bg-linear-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center">
              <div className="text-3xl sm:text-4xl">✅</div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Verify the configuration</h3>
            <p className="text-xs text-gray-600">Test that your affiliates can sign up and generate referral codes.</p>
            <p className="text-xs text-gray-600">Once you&apos;ve configured the tracking, test the initial click.</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs sm:text-sm text-gray-600 mb-2">Revenue</p>
          <div className="flex items-baseline gap-2 mb-2 flex-wrap">
            <p className="text-xl sm:text-3xl font-bold text-gray-900">₦{stats?.app_gross_revenue?.toLocaleString() || '0'}</p>
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">+5%</span>
          </div>
          <p className="text-xs text-gray-500">↗ +27.5% From last month</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs sm:text-sm text-gray-600 mb-2">Transactions</p>
          <div className="flex items-baseline gap-2 mb-2 flex-wrap">
            <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats?.total_transactions?.toLocaleString() || '0'}</p>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">-2.5%</span>
          </div>
          <p className="text-xs text-gray-500">↘ -2.5% From last month</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs sm:text-sm text-gray-600 mb-2">Conversions</p>
          <div className="flex items-baseline gap-2 mb-2 flex-wrap">
            <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats?.active_affiliates || '47'}</p>
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">+4.5%</span>
          </div>
          <p className="text-xs text-gray-500">↗ +4.5% From last month</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs sm:text-sm text-gray-600 mb-2">Payouts</p>
          <div className="flex items-baseline gap-2 mb-2 flex-wrap">
            <p className="text-xl sm:text-3xl font-bold text-gray-900">₦{stats?.total_paid_out?.toLocaleString() || '0'}</p>
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">+5%</span>
          </div>
          <p className="text-xs text-gray-500">↗ +5% From last month</p>
        </div>
      </div>
      {/* Performance Overview & Campaign */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Performance Overview</h3>
            <select className="text-xs sm:text-sm border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5">
              <option>Last Month</option>
              <option>Last 3 Months</option>
              <option>Last 6 Months</option>
            </select>
          </div>
          <div className="h-48 sm:h-64 flex items-center justify-center bg-linear-to-br from-blue-50 to-purple-50 rounded-lg">
            <div className="text-center">
              <div className="text-3xl sm:text-5xl mb-2">📈</div>
              <p className="text-xs sm:text-sm text-gray-600">Chart visualization coming soon</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Discount campaign</h3>
          <button className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm w-full mb-4">Create Campaign</button>
          <div className="w-40 h-40 mx-auto mb-4 relative flex items-center justify-center bg-linear-to-br from-purple-100 to-blue-100 rounded-full">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Performance Progress</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">₦{stats?.affiliate_earnings?.toLocaleString() || '0'}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">Affiliates earnings to date</p>
        </div>
      </div>

      {/* Pending Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs sm:text-sm text-gray-600 mb-2">Vendor Unpaid</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">₦{stats?.unpaid_vendor_balance?.toLocaleString() || '0'}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs sm:text-sm text-gray-600 mb-2">Pending Withdrawals</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats?.pending_withdrawals?.toLocaleString() || '0'}</p>
        </div>
      </div>

      {/* Users & Products */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900">Users & Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
            <p className="text-xs sm:text-sm text-gray-600 mb-2">Active Vendors</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats?.active_vendors?.toLocaleString() || '0'}</p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
            <p className="text-xs sm:text-sm text-gray-600 mb-2">Active Affiliates</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats?.active_affiliates?.toLocaleString() || '0'}</p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
            <p className="text-xs sm:text-sm text-gray-600 mb-2">Total Customers</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats?.total_customers?.toLocaleString() || '0'}</p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
            <p className="text-xs sm:text-sm text-gray-600 mb-2">Approved Products</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats?.approved_products?.toLocaleString() || '0'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Empty pages for other sections
const SettingsPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Settings</h1></div>;
const IntegrationsPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Integrations</h1></div>;

// Email Notification Settings Component
const EmailPage = () => {
  const [settings, setSettings] = useState<{
    affiliate_approved?: boolean;
    affiliate_declined?: boolean;
    new_referral?: boolean;
    new_sale?: boolean;
    new_withdrawal_request?: boolean;
    withdrawal_approved?: boolean;
    withdrawal_rejected?: boolean;
    weekly_summary?: boolean;
  }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<{ user_type?: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Load settings
    fetch(`${API_BASE}/settings/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setSettings(data.data);
        }
      })
      .catch((err) => console.error('Failed to load settings:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch(`${API_BASE}/settings/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (data.success) {
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Failed to save settings');
      }
    } catch {
      setMessage('An error occurred while saving settings');
    } finally {
      setSaving(false);
    }
  };

  const userType = user?.user_type?.toLowerCase();

  const NotificationToggle = ({
    icon,
    title,
    description,
    enabled,
    onChange,
  }: {
    icon: string;
    title: string;
    description: string;
    enabled: boolean;
    onChange: () => void;
  }) => (
    <div className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {loading ? (
          <div className="h-6 w-11 animate-pulse rounded-full bg-gray-200" />
        ) : (
          <button
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        )}
        <button className="text-gray-400 hover:text-gray-600" aria-label="Email info">
          <Mail size={20} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Email Notification</h1>
          <p className="text-sm text-gray-600">
            Edit the email notifications that are sent to your email address when certain events occur.
          </p>
        </header>

        {message && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
              message.includes('success')
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {message}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <a
            href="/settings/smtp"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Settings size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">SMTP Settings</h3>
              <p className="text-xs text-gray-500">Configure email server</p>
            </div>
            <svg className="h-5 w-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>

          <a
            href="/settings/email-templates"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-600">
              <Mail size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-purple-600">Email Templates</h3>
              <p className="text-xs text-gray-500">Customize email content</p>
            </div>
            <svg className="h-5 w-5 text-gray-400 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <div className="space-y-6">
          {/* Notifications sent to others */}
          {(userType === 'admin' || userType === 'superadmin') && (
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-medium text-gray-600">Notifications sent to users</h2>
              <div className="space-y-4">
                <NotificationToggle
                  icon="👤"
                  title="Affiliate Approved"
                  description="Send email to affiliate when they are approved"
                  enabled={settings.affiliate_approved ?? true}
                  onChange={() => handleToggle('affiliate_approved')}
                />
                <NotificationToggle
                  icon="👤"
                  title="Affiliate Declined"
                  description="Send email to affiliate when they are declined"
                  enabled={settings.affiliate_declined ?? true}
                  onChange={() => handleToggle('affiliate_declined')}
                />
                <NotificationToggle
                  icon="💰"
                  title="Withdrawal Approved"
                  description="Send email when withdrawal request is approved"
                  enabled={settings.withdrawal_approved ?? true}
                  onChange={() => handleToggle('withdrawal_approved')}
                />
                <NotificationToggle
                  icon="💰"
                  title="Withdrawal Rejected"
                  description="Send email when withdrawal request is rejected"
                  enabled={settings.withdrawal_rejected ?? true}
                  onChange={() => handleToggle('withdrawal_rejected')}
                />
              </div>
            </section>
          )}

          {/* Notifications sent to you */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-medium text-gray-600">Notification sent to you</h2>
            <div className="space-y-4">
              {(userType === 'vendor' || userType === 'affiliate') && (
                <>
                  <NotificationToggle
                    icon="🔗"
                    title="New referral"
                    description={`Send email to ${userType} when they get a new referral`}
                    enabled={settings.new_referral ?? true}
                    onChange={() => handleToggle('new_referral')}
                  />
                  <NotificationToggle
                    icon="💵"
                    title="New Sale"
                    description={`Send email to ${userType} when they get a new Sale`}
                    enabled={settings.new_sale ?? true}
                    onChange={() => handleToggle('new_sale')}
                  />
                </>
              )}

              {(userType === 'admin' || userType === 'superadmin') && (
                <>
                  <NotificationToggle
                    icon="👤"
                    title="New Affiliate sign up"
                    description="Receive an email when a new referral is made by an affiliate"
                    enabled={settings.affiliate_approved ?? true}
                    onChange={() => handleToggle('affiliate_approved')}
                  />
                  <NotificationToggle
                    icon="💰"
                    title="New Withdrawal Request"
                    description="Receive an email when a new withdrawal request is made"
                    enabled={settings.new_withdrawal_request ?? true}
                    onChange={() => handleToggle('new_withdrawal_request')}
                  />
                  <NotificationToggle
                    icon="💵"
                    title="New Sale"
                    description="Receive an email when a new sale is made in your affiliate program"
                    enabled={settings.new_sale ?? true}
                    onChange={() => handleToggle('new_sale')}
                  />
                </>
              )}

              <NotificationToggle
                icon="📊"
                title="Weekly summary"
                description="Receive a weekly email update about how your affiliate program is performing"
                enabled={settings.weekly_summary ?? true}
                onChange={() => handleToggle('weekly_summary')}
              />
            </div>
          </section>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App
export default function AdminApp() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${API_BASE}/admin/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        if (res.ok) {
          const data = await res.json();
          setStats(data.data || null);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    fetchStats();
  }, [router]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard stats={stats} />;
      case 'settings': return <SettingsPage />;
      case 'integrations': return <IntegrationsPage />;
      case 'email': return <EmailPage />;
      default: return <Dashboard stats={stats} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="w-full md:ml-60 flex-1 overflow-y-auto">
        {renderPage()}
      </div>
    </div>
  );
}
