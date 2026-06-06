'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  User, Mail, Phone, Globe, Calendar, ShieldCheck, ShieldOff,
  Pencil, Save, X, Eye, EyeOff, Landmark, Lock, CheckCircle,
  AlertTriangle, CreditCard,
} from 'lucide-react';
import { africanBanks, countries, banksByCountry } from '@/data/africanBanks';

type UserProfile = {
  id: number;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  user_type: string;
  status: string;
  created_at: string;
};

type BankDetails = {
  bank_name: string;
  bank_code: string;
  account_name: string;
  account_number: string;
};

type SubscriptionInfo = {
  status: 'active' | 'past_due' | 'suspended';
  expires_at: string | null;
  monthly_amount: number;
};

function Avatar({ name, size = 'lg' }: { name: string; size?: 'sm' | 'lg' }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const cls = size === 'lg'
    ? 'w-24 h-24 text-3xl'
    : 'w-10 h-10 text-sm';

  return (
    <div className={`${cls} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0 ring-4 ring-white dark:ring-gray-900 shadow-md`}>
      {initials || '?'}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <Icon size={15} className="text-gray-400 flex-shrink-0" />
      <span className="text-xs text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{value || '—'}</span>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2.5 bg-gray-900 dark:bg-gray-950 text-white px-5 py-3.5 rounded-t-xl">
      <Icon size={16} className="text-blue-400" />
      <h2 className="text-sm font-semibold">{title}</h2>
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [bank, setBank] = useState<BankDetails>({ bank_name: '', bank_code: '', account_name: '', account_number: '' });
  const [selectedCountry, setSelectedCountry] = useState('');

  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  const [bankSaving, setBankSaving] = useState(false);
  const [bankVerifying, setBankVerifying] = useState(false);
  const [bankMsg, setBankMsg] = useState('');
  const [bankErr, setBankErr] = useState('');

  const [pwForm, setPwForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) { window.location.href = '/login'; return; }

    Promise.all([
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/subscriptions', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
    ]).then(([meData, settingsData, subData]) => {
      if (meData.data) {
        setUser(meData.data);
        setProfileForm({
          first_name: meData.data.first_name || '',
          last_name: meData.data.last_name || '',
          phone: meData.data.phone || '',
        });
      }
      if (settingsData?.data?.bank_details) {
        const bd = settingsData.data.bank_details;
        setBank({ bank_name: bd.bank_name || '', bank_code: bd.bank_code || '', account_name: bd.account_name || '', account_number: bd.account_number || '' });
      }
      if (subData?.data) setSubscription(subData.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Reset account name when bank or account number changes
  useEffect(() => {
    setBankMsg('');
    setBankErr('');
    setBank(prev => ({ ...prev, account_name: '' }));
  }, [bank.bank_code, bank.account_number]);

  const filteredBanks = (selectedCountry ? banksByCountry[selectedCountry] || [] : africanBanks)
    .slice().sort((a, b) => a.name.localeCompare(b.name));

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(''); setProfileErr('');
    setProfileSaving(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      setUser(data.data);
      localStorage.setItem('user', JSON.stringify(data.data));
      setEditing(false);
      setProfileMsg('Profile updated.');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err) {
      setProfileErr(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setProfileSaving(false);
    }
  };

  const verifyAccount = async () => {
    setBankErr(''); setBankMsg('');
    if (!bank.bank_code) { setBankErr('Select a bank first.'); return; }
    if (bank.account_number.length < 10) { setBankErr('Enter a valid 10-digit account number.'); return; }
    setBankVerifying(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/settings/resolve-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bank_code: bank.bank_code, account_number: bank.account_number }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Cannot verify account');
      const name = data.data?.account_name || '';
      setBank(prev => ({ ...prev, account_name: name }));
      setBankMsg(`Verified: ${name}`);
    } catch (err) {
      setBankErr(err instanceof Error ? err.message : 'Cannot verify account');
    } finally {
      setBankVerifying(false);
    }
  };

  const handleBankSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankMsg(''); setBankErr('');
    if (!bank.bank_name || !bank.account_number || !bank.account_name) { setBankErr('Verify your account first.'); return; }
    setBankSaving(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/settings/bank-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(bank),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');
      setBankMsg('Bank details saved.');
      setTimeout(() => setBankMsg(''), 3000);
    } catch (err) {
      setBankErr(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBankSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(''); setPwErr('');
    if (pwForm.password !== pwForm.password_confirmation) { setPwErr('Passwords do not match.'); return; }
    if (pwForm.password.length < 8) { setPwErr('New password must be at least 8 characters.'); return; }
    setPwSaving(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(pwForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Password change failed');
      setPwMsg('Password updated successfully.');
      setPwForm({ current_password: '', password: '', password_confirmation: '' });
      setTimeout(() => setPwMsg(''), 3000);
    } catch (err) {
      setPwErr(err instanceof Error ? err.message : 'Password change failed');
    } finally {
      setPwSaving(false);
    }
  };

  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() : '';
  const roleLabel = user?.user_type === 'vendor' ? 'Vendor' : user?.user_type === 'affiliate' ? 'Affiliate' : user?.user_type === 'admin' ? 'Admin' : user?.user_type || '';
  const isSubActive = subscription?.status === 'active';
  const isAdminUser = user?.user_type === 'admin' || user?.user_type === 'superadmin';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
        <span>›</span>
        <span className="text-gray-900 dark:text-white font-medium">Profile</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">

        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-1 flex flex-col gap-5">

          {/* Avatar card */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            {/* Gradient banner */}
            <div className="h-20 bg-gradient-to-r from-blue-600 to-indigo-600" />

            <div className="px-5 pb-5 -mt-12">
              <div className="flex items-end justify-between mb-3">
                <Avatar name={fullName || user?.email || '?'} size="lg" />
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg"
                  >
                    <Pencil size={12} />
                    Edit
                  </button>
                )}
              </div>

              {editing ? (
                <form onSubmit={handleProfileSave} className="space-y-3 mt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">First name</label>
                      <input
                        value={profileForm.first_name}
                        onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Last name</label>
                      <input
                        value={profileForm.last_name}
                        onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  {profileErr && <p className="text-xs text-red-600">{profileErr}</p>}
                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={profileSaving} className="flex items-center gap-1.5 text-xs font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-60">
                      <Save size={12} />{profileSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button type="button" onClick={() => setEditing(false)} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                      <X size={12} />Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{fullName || '—'}</h2>
                  {user?.user_id && (
                    <span className="inline-block mt-1 text-xs font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                      {user.user_id}
                    </span>
                  )}
                </>
              )}

              {profileMsg && (
                <p className="mt-2 text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12} />{profileMsg}</p>
              )}
            </div>

            {/* Info rows */}
            <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4 space-y-0.5">
              <InfoRow icon={User} label="Name" value={fullName} />
              <InfoRow icon={Mail} label="Email" value={user?.email || ''} />
              <InfoRow icon={Phone} label="Phone" value={user?.phone || ''} />
              <InfoRow icon={Globe} label="Role" value={roleLabel} />
              <InfoRow icon={Calendar} label="Joined" value={user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''} />
            </div>
          </div>

          {/* Subscription status */}
          {!isAdminUser && subscription && (
            <div className={`rounded-xl border p-4 ${isSubActive ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'}`}>
              <div className="flex items-center gap-2.5 mb-2">
                {isSubActive
                  ? <ShieldCheck size={20} className="text-green-600 dark:text-green-400" />
                  : <ShieldOff size={20} className="text-amber-500" />}
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {isSubActive ? 'Access Active' : 'No Active Subscription'}
                  </p>
                  {isSubActive && subscription.expires_at && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Valid until <strong>{new Date(subscription.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                    </p>
                  )}
                </div>
              </div>
              {!isSubActive && (
                <Link href="/subscriptions" className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors mt-1">
                  <CreditCard size={12} />
                  Subscribe Now
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Bank Information */}
          {!isAdminUser && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
              <SectionHeader icon={Landmark} title="Bank Information" />

              <div className="p-5">
                <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-4 py-2.5 mb-5">
                  <CheckCircle size={14} className="text-blue-500 flex-shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Ensure your bank account name matches your profile name for smooth withdrawals.
                  </p>
                </div>

                {bankMsg && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-2.5 text-sm text-green-700 dark:text-green-300">
                    <CheckCircle size={14} className="flex-shrink-0" />{bankMsg}
                  </div>
                )}
                {bankErr && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
                    <AlertTriangle size={14} className="flex-shrink-0" />{bankErr}
                  </div>
                )}

                <form onSubmit={handleBankSave} className="space-y-4">
                  {/* Country filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Country</label>
                    <select
                      value={selectedCountry}
                      onChange={e => { setSelectedCountry(e.target.value); setBank(prev => ({ ...prev, bank_name: '', bank_code: '' })); }}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">All African Countries</option>
                      {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Bank Name</label>
                      <select
                        value={bank.bank_name}
                        onChange={e => { const b = filteredBanks.find(x => x.name === e.target.value); if (b) setBank(prev => ({ ...prev, bank_name: b.name, bank_code: b.code })); }}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Select bank…</option>
                        {filteredBanks.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Account Number</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={11}
                          value={bank.account_number}
                          onChange={e => setBank(prev => ({ ...prev, account_number: e.target.value.replace(/\D/g, '') }))}
                          placeholder="0000000000"
                          className="flex-1 min-w-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={verifyAccount}
                          disabled={bankVerifying}
                          className="flex-shrink-0 text-xs font-semibold bg-gray-900 dark:bg-gray-700 text-white px-3 py-2.5 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-60 transition-colors"
                        >
                          {bankVerifying ? '…' : 'Verify'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Account Name</label>
                    <input
                      type="text"
                      value={bank.account_name}
                      readOnly
                      placeholder="Auto-filled after verification"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 cursor-default focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-400">Auto-filled when account number and bank are verified</p>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={bankSaving || !bank.account_name}
                      className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Landmark size={15} />
                      {bankSaving ? 'Saving…' : 'Update Bank Info'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Security Settings */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
            <SectionHeader icon={Lock} title="Security Settings" />

            <div className="p-5">
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-4 py-2.5 mb-5">
                <Lock size={14} className="text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Change your password below to keep your account secure.
                </p>
              </div>

              {pwMsg && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-2.5 text-sm text-green-700 dark:text-green-300">
                  <CheckCircle size={14} className="flex-shrink-0" />{pwMsg}
                </div>
              )}
              {pwErr && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
                  <AlertTriangle size={14} className="flex-shrink-0" />{pwErr}
                </div>
              )}

              <form onSubmit={handlePasswordSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPw.current ? 'text' : 'password'}
                        value={pwForm.current_password}
                        onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })}
                        placeholder="Enter current password"
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2.5 pr-10 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                      />
                      <button type="button" onClick={() => setShowPw(s => ({ ...s, current: !s.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPw.current ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showPw.new ? 'text' : 'password'}
                        value={pwForm.password}
                        onChange={e => setPwForm({ ...pwForm, password: e.target.value })}
                        placeholder="Enter new password"
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2.5 pr-10 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                      />
                      <button type="button" onClick={() => setShowPw(s => ({ ...s, new: !s.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPw.new ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="sm:w-1/2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPw.confirm ? 'text' : 'password'}
                      value={pwForm.password_confirmation}
                      onChange={e => setPwForm({ ...pwForm, password_confirmation: e.target.value })}
                      placeholder="Confirm new password"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2.5 pr-10 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                    />
                    <button type="button" onClick={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={pwSaving}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Lock size={15} />
                    {pwSaving ? 'Updating…' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
