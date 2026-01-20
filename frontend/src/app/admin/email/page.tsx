'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Settings, Home, Users, Package, CreditCard, DollarSign, Building2, TrendingUp, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';

const API_BASE = '/api';

// Email Notification Settings Component
export default function EmailPage() {
  const router = useRouter();
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

    if (!storedUser || !token) {
      router.push('/login');
      return;
    }

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
  }, [router]);

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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userType="admin" />
      
      <div className="flex-1 md:ml-60">
        <div className="p-4 sm:p-6 md:p-8">
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
      </div>
    </div>
  );
}
