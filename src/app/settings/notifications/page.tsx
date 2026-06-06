'use client';

import { useEffect, useState } from 'react';

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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    fetch(`${apiUrl}/api/settings/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setSettings(data.data);
        }
      })
      .catch((err) => {
        setMessage('Failed to load settings. Please try again.');
        console.error('Failed to load settings:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const allowedKeys: (keyof NotificationSettings)[] = [
    'affiliate_approved',
    'affiliate_declined',
    'new_referral',
    'new_sale',
    'new_withdrawal_request',
    'withdrawal_approved',
    'withdrawal_rejected',
    'weekly_summary',
  ];

  const handleToggle = (key: keyof NotificationSettings) => {
    if (!allowedKeys.includes(key)) return;
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    const token = localStorage.getItem('auth_token');

    // Only send allowed keys and booleans
    const cleanSettings: NotificationSettings = {};
    allowedKeys.forEach((key) => {
      cleanSettings[key] = Boolean(settings[key]);
    });

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/settings/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cleanSettings),
      });

      const data = await res.json();

      if (data.success) {
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Failed to save settings. Please check your input and try again.');
      }
    } catch (error) {
      setMessage('A network error occurred while saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const userType = user?.user_type?.toLowerCase();

  return (
    <main className="bg-gray-50 p-8">
      <div className="mr-auto max-w-4xl">
        <header className="mb-8">
          <a href="/settings" className="text-sm text-blue-600 hover:text-blue-700">
            ← Back to settings
          </a>
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
                  enabled={!!settings.affiliate_approved}
                  loading={loading}
                  onChange={() => handleToggle('affiliate_approved')}
                />
                <NotificationToggle
                  icon="👤"
                  title="Affiliate Declined"
                  description="Send email to affiliate when they are declined"
                  enabled={!!settings.affiliate_declined}
                  loading={loading}
                  onChange={() => handleToggle('affiliate_declined')}
                />
                <NotificationToggle
                  icon="💰"
                  title="Withdrawal Approved"
                  description="Send email when withdrawal request is approved"
                  enabled={!!settings.withdrawal_approved}
                  loading={loading}
                  onChange={() => handleToggle('withdrawal_approved')}
                />
                <NotificationToggle
                  icon="💰"
                  title="Withdrawal Rejected"
                  description="Send email when withdrawal request is rejected"
                  enabled={!!settings.withdrawal_rejected}
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
                    enabled={!!settings.new_referral}
                    loading={loading}
                    onChange={() => handleToggle('new_referral')}
                  />
                  <NotificationToggle
                    icon="💵"
                    title="New Sale"
                    description={`Send email to ${userType} when they get a new Sale`}
                    enabled={!!settings.new_sale}
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
                    enabled={!!settings.affiliate_approved}
                    loading={loading}
                    onChange={() => handleToggle('affiliate_approved')}
                  />
                  <NotificationToggle
                    icon="💰"
                    title="New Withdrawal Request"
                    description="Receive an email when a new withdrawal request is made"
                    enabled={!!settings.new_withdrawal_request}
                    loading={loading}
                    onChange={() => handleToggle('new_withdrawal_request')}
                  />
                  <NotificationToggle
                    icon="💵"
                    title="New Sale"
                    description="Receive an email when a new sale is made in your affiliate program"
                    enabled={!!settings.new_sale}
                    loading={loading}
                    onChange={() => handleToggle('new_sale')}
                  />
                </>
              )}

              <NotificationToggle
                icon="📊"
                title="Weekly summary"
                description="Receive a weekly email update about how your affiliate program is performing"
                enabled={!!settings.weekly_summary}
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
