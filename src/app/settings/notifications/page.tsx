'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type NotificationSettings = {
  affiliate_approved?: boolean;
  affiliate_declined?: boolean;
  new_referral?: boolean;
  new_sale?: boolean;
  new_withdrawal_request?: boolean;
  withdrawal_approved?: boolean;
  withdrawal_rejected?: boolean;
  weekly_summary?: boolean;
};

export default function NotificationSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<NotificationSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');

    if (!storedUser || !token) {
      window.location.href = '/login';
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // Load settings
    fetch('http://127.0.0.1:8000/api/settings/notifications', {
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

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch('http://127.0.0.1:8000/api/settings/notifications', {
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
    } catch (error) {
      setMessage('An error occurred while saving settings');
    } finally {
      setSaving(false);
    }
  };

  const userType = user?.user_type?.toLowerCase();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Email Notification</h1>
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
          <Link
            href="/settings/smtp"
            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">SMTP Settings</h3>
              <p className="text-xs text-gray-500">Configure email server</p>
            </div>
            <svg className="h-5 w-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/settings/email-templates"
            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-purple-600">Email Templates</h3>
              <p className="text-xs text-gray-500">Customize email content</p>
            </div>
            <svg className="h-5 w-5 text-gray-400 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
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
                  loading={loading}
                  onChange={() => handleToggle('affiliate_approved')}
                />
                <NotificationToggle
                  icon="👤"
                  title="Affiliate Declined"
                  description="Send email to affiliate when they are declined"
                  enabled={settings.affiliate_declined ?? true}
                  loading={loading}
                  onChange={() => handleToggle('affiliate_declined')}
                />
                <NotificationToggle
                  icon="💰"
                  title="Withdrawal Approved"
                  description="Send email when withdrawal request is approved"
                  enabled={settings.withdrawal_approved ?? true}
                  loading={loading}
                  onChange={() => handleToggle('withdrawal_approved')}
                />
                <NotificationToggle
                  icon="💰"
                  title="Withdrawal Rejected"
                  description="Send email when withdrawal request is rejected"
                  enabled={settings.withdrawal_rejected ?? true}
                  loading={loading}
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
                    loading={loading}
                    onChange={() => handleToggle('new_referral')}
                  />
                  <NotificationToggle
                    icon="💵"
                    title="New Sale"
                    description={`Send email to ${userType} when they get a new Sale`}
                    enabled={settings.new_sale ?? true}
                    loading={loading}
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
                    loading={loading}
                    onChange={() => handleToggle('affiliate_approved')}
                  />
                  <NotificationToggle
                    icon="💰"
                    title="New Withdrawal Request"
                    description="Receive an email when a new withdrawal request is made"
                    enabled={settings.new_withdrawal_request ?? true}
                    loading={loading}
                    onChange={() => handleToggle('new_withdrawal_request')}
                  />
                  <NotificationToggle
                    icon="💵"
                    title="New Sale"
                    description="Receive an email when a new sale is made in your affiliate program"
                    enabled={settings.new_sale ?? true}
                    loading={loading}
                    onChange={() => handleToggle('new_sale')}
                  />
                </>
              )}

              <NotificationToggle
                icon="📊"
                title="Weekly summary"
                description="Receive a weekly email update about how your affiliate program is performing"
                enabled={settings.weekly_summary ?? true}
                loading={loading}
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
    </main>
  );
}

function NotificationToggle({
  icon,
  title,
  description,
  enabled,
  loading,
  onChange,
}: {
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
  loading: boolean;
  onChange: () => void;
}) {
  return (
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
        <button className="text-gray-400 hover:text-gray-600">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
