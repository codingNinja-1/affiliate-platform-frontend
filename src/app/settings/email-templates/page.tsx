'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type EmailTemplate = {
  key: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
};

const TEMPLATE_TYPES = [
  {
    key: 'affiliate_approved',
    name: 'Affiliate Approved',
    description: 'Sent when an affiliate is approved',
    variables: ['{name}', '{email}', '{login_url}', '{dashboard_url}'],
  },
  {
    key: 'affiliate_declined',
    name: 'Affiliate Declined',
    description: 'Sent when an affiliate is declined',
    variables: ['{name}', '{email}', '{reason}'],
  },
  {
    key: 'withdrawal_approved',
    name: 'Withdrawal Approved',
    description: 'Sent when withdrawal is approved',
    variables: ['{name}', '{amount}', '{withdrawal_ref}', '{bank_name}', '{account_number}'],
  },
  {
    key: 'withdrawal_rejected',
    name: 'Withdrawal Rejected',
    description: 'Sent when withdrawal is rejected',
    variables: ['{name}', '{amount}', '{withdrawal_ref}', '{reason}'],
  },
  {
    key: 'new_sale',
    name: 'New Sale Notification',
    description: 'Sent when a new sale is made',
    variables: ['{name}', '{product_name}', '{amount}', '{commission}', '{customer_email}'],
  },
  {
    key: 'password_reset',
    name: 'Password Reset',
    description: 'Password reset email',
    variables: ['{name}', '{reset_url}', '{expiry_time}'],
  },
];

export default function EmailTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('affiliate_approved');
  const [template, setTemplate] = useState({ subject: '', body: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const currentTemplateInfo = TEMPLATE_TYPES.find((t) => t.key === selectedTemplate);

  useEffect(() => {
    loadTemplate(selectedTemplate);
  }, [selectedTemplate]);

  const loadTemplate = async (key: string) => {
    setLoading(true);
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/settings/email-templates/${key}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success && data.data) {
        setTemplate({
          subject: data.data.subject || '',
          body: data.data.body || '',
        });
      }
    } catch (error) {
      console.error('Failed to load template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/settings/email-templates/${selectedTemplate}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(template),
      });

      const data = await res.json();

      if (data.success) {
        setMessage('Email template saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Failed to save template');
      }
    } catch (error) {
      setMessage('An error occurred while saving template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <Link href="/settings/smtp" className="text-sm text-blue-600 hover:text-blue-700">
            ← Back to SMTP settings
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-sm text-gray-600">
            Customize the email templates sent to your users
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

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Template List */}
          <aside className="lg:col-span-1">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-gray-900">Templates</h2>
              <div className="space-y-1">
                {TEMPLATE_TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setSelectedTemplate(t.key)}
                    className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      selectedTemplate === t.key
                        ? 'bg-blue-50 font-medium text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Template Editor */}
          <div className="space-y-6 lg:col-span-3">
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{currentTemplateInfo?.name}</h2>
                <p className="text-sm text-gray-600">{currentTemplateInfo?.description}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={template.subject}
                    onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                    disabled={loading}
                    placeholder="Enter email subject..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Email Body
                  </label>
                  <textarea
                    value={template.body}
                    onChange={(e) => setTemplate({ ...template, body: e.target.value })}
                    disabled={loading}
                    placeholder="Enter email body..."
                    rows={12}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    You can use HTML tags for formatting
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Available Variables</h3>
              <div className="flex flex-wrap gap-2">
                {currentTemplateInfo?.variables.map((variable) => (
                  <button
                    key={variable}
                    onClick={() => {
                      navigator.clipboard.writeText(variable);
                      setMessage(`Copied ${variable} to clipboard!`);
                      setTimeout(() => setMessage(''), 2000);
                    }}
                    className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-mono text-gray-700 hover:bg-gray-200"
                  >
                    {variable}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Click to copy. These variables will be replaced with actual values when emails are sent.
              </p>
            </section>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => loadTemplate(selectedTemplate)}
                disabled={loading}
                className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
