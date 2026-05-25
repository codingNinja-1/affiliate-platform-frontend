'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type SmtpSettings = {
  mail_mailer?: string;
  mail_host?: string;
  mail_port?: string;
  mail_username?: string;
  mail_password?: string;
  mail_encryption?: string;
  mail_from_address?: string;
  mail_from_name?: string;
};

export default function SmtpSettingsPage() {
  const [settings, setSettings] = useState<SmtpSettings>({
    mail_mailer: 'smtp',
    mail_host: '',
    mail_port: '587',
    mail_username: '',
    mail_password: '',
    mail_encryption: 'tls',
    mail_from_address: '',
    mail_from_name: 'AffiliateHub',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    fetch('/api/settings/smtp', {
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

  const handleChange = (field: keyof SmtpSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch('/api/settings/smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (data.success) {
        setMessage('SMTP settings saved successfully!');
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

  const handleTest = async () => {
    setTesting(true);
    setMessage('');

    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch('/api/settings/smtp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: testEmail }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage('Test email sent successfully! Check your inbox.');
      } else {
        setMessage(data.message || 'Failed to send test email');
      }
    } catch (error) {
      setMessage('An error occurred while sending test email');
    } finally {
      setTesting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <Link href="/settings/notifications" className="text-sm text-blue-600 hover:text-blue-700">
            ← Back to notifications
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">SMTP Configuration</h1>
          <p className="text-sm text-gray-600">
            Configure your email server settings to send transactional emails
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
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Mail Driver</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Mail Driver
                </label>
                <select
                  value={settings.mail_mailer}
                  onChange={(e) => handleChange('mail_mailer', e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="smtp">SMTP</option>
                  <option value="sendmail">Sendmail</option>
                  <option value="mailgun">Mailgun</option>
                  <option value="ses">Amazon SES</option>
                  <option value="log">Log (Development)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">Choose your mail delivery method</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">SMTP Server Settings</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  SMTP Host *
                </label>
                <input
                  type="text"
                  value={settings.mail_host}
                  onChange={(e) => handleChange('mail_host', e.target.value)}
                  placeholder="smtp.gmail.com"
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  SMTP Port *
                </label>
                <input
                  type="text"
                  value={settings.mail_port}
                  onChange={(e) => handleChange('mail_port', e.target.value)}
                  placeholder="587"
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Username *
                </label>
                <input
                  type="text"
                  value={settings.mail_username}
                  onChange={(e) => handleChange('mail_username', e.target.value)}
                  placeholder="your-email@gmail.com"
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={settings.mail_password}
                    onChange={(e) => handleChange('mail_password', e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Encryption
                </label>
                <select
                  value={settings.mail_encryption}
                  onChange={(e) => handleChange('mail_encryption', e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="tls">TLS (Recommended)</option>
                  <option value="ssl">SSL</option>
                  <option value="">None</option>
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">From Address</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  From Email *
                </label>
                <input
                  type="email"
                  value={settings.mail_from_address}
                  onChange={(e) => handleChange('mail_from_address', e.target.value)}
                  placeholder="noreply@yourdomain.com"
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  From Name *
                </label>
                <input
                  type="text"
                  value={settings.mail_from_name}
                  onChange={(e) => handleChange('mail_from_name', e.target.value)}
                  placeholder="AffiliateHub"
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          </section>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-blue-900">Test your configuration</p>
            </div>
            <p className="mb-3 text-xs text-blue-700">Send a test email to verify your SMTP settings are working correctly</p>
            <div className="flex gap-3">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter recipient email address"
                className="flex-1 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleTest}
                disabled={testing || loading || !testEmail}
                className="whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {testing ? 'Sending...' : 'Send Test Email'}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href="/settings/email-templates"
              className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit Email Templates
            </Link>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
