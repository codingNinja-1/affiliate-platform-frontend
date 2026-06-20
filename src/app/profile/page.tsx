'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  User, Mail, Phone, Globe, Calendar, ShieldCheck, ShieldOff,
  Pencil, Save, X, Eye, EyeOff, Landmark, Lock, CheckCircle,
  AlertTriangle, CreditCard, Camera, KeyRound, RefreshCw,
} from 'lucide-react';
import { africanBanks, countries, banksByCountry } from '@/data/africanBanks';

const API_BASE = '/api';

type UserProfile = {
  id: number;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  user_type: string;
  status: string;
  avatar?: string | null;
  created_at: string;
};

type BankDetails = {
  bank_name: string;
  bank_code: string;
  account_name: string;
  account_number: string;
};

type SubInfo = {
  status: 'active' | 'past_due' | 'suspended';
  expires_at: string | null;
  monthly_amount: number;
};

// OTP sub-component used by each section
function OtpStep({
  purpose,
  onVerified,
  onCancel,
}: {
  purpose: string;
  onVerified: (code: string) => void;
  onCancel: () => void;
}) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendOtp = async () => {
    setSending(true); setErr('');
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`${API_BASE}/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ purpose }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to send OTP');
      setSent(true);
      setCountdown(60);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to send OTP');
    } finally {
      setSending(false);
    }
  };

  if (!sent) {
    return (
      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
          An OTP will be sent to your email to verify this action.
        </p>
        {err && <p className="text-xs text-red-600 mb-2">{err}</p>}
        <div className="flex gap-2">
          <button
            onClick={sendOtp}
            disabled={sending}
            className="flex items-center gap-1.5 text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            <KeyRound size={14} />
            {sending ? 'Sending…' : 'Send OTP'}
          </button>
          <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
      <p className="text-sm text-green-800 dark:text-green-300 mb-3">
        OTP sent to your email. Enter it below to confirm.
      </p>
      {err && <p className="text-xs text-red-600 mb-2">{err}</p>}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          maxLength={8}
          value={code}
          onChange={e => { setCode(e.target.value); setErr(''); }}
          placeholder="Enter OTP"
          className="w-36 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono text-center text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={() => { if (code.trim()) onVerified(code.trim()); else setErr('Enter the OTP code.'); }}
          className="flex items-center gap-1.5 text-sm font-semibold bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <CheckCircle size={14} /> Verify & Save
        </button>
        <button
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700 px-2 py-2 rounded-lg"
        >
          <X size={15} />
        </button>
      </div>
      <button
        onClick={() => { if (countdown === 0) { setSent(false); setCode(''); } }}
        disabled={countdown > 0}
        className="mt-2 text-xs text-blue-600 disabled:text-gray-400 hover:underline disabled:no-underline"
      >
        {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
      </button>
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

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <Icon size={15} className="text-gray-400 flex-shrink-0" />
      <span className="text-xs text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{value || '—'}</span>
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<SubInfo | null>(null);
  const [bank, setBank] = useState<BankDetails>({ bank_name: '', bank_code: '', account_name: '', account_number: '' });
  const [selectedCountry, setSelectedCountry] = useState('');
  const [loading, setLoading] = useState(true);
  // Live Paystack bank list — codes guaranteed to match Paystack's /bank/resolve API
  const [liveBanks, setLiveBanks] = useState<{ name: string; code: string }[]>([]);

  // Avatar
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Prevents the bank reset effect from wiping account_name on initial API load
  const isInitialBankLoad = useRef(true);

  // Profile edit
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [profileOtp, setProfileOtp] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  // Bank
  const [bankOtp, setBankOtp] = useState(false);
  const [bankVerifying, setBankVerifying] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);
  const [bankMsg, setBankMsg] = useState('');
  const [bankErr, setBankErr] = useState('');
  // true when both Paystack + Korapay resolve APIs are unavailable (rate-limit / test mode)
  const [bankManualEntry, setBankManualEntry] = useState(false);

  // Auto-payout
  const [autopayoutEnabled, setAutopayoutEnabled] = useState(false);
  const [autopayoutLoading, setAutopayoutLoading] = useState(false);
  const [autopayoutMsg, setAutopayoutMsg] = useState('');
  const [autopayoutErr, setAutopayoutErr] = useState('');

  // Password
  const [pwForm, setPwForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwOtp, setPwOtp] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

  // When bank or account number changes (after initial load):
  //   1. Reset the verified account_name so the user must re-verify
  //   2. Auto-verify when account number reaches 10 digits
  useEffect(() => {
    if (isInitialBankLoad.current) {
      // Skip the first fire (triggered by API data loading in) so we don't
      // wipe the account_name that was just fetched from the server.
      isInitialBankLoad.current = false;
      return;
    }
    setBankMsg(''); setBankErr('');
    setBankManualEntry(false);
    setBank(prev => ({ ...prev, account_name: '' }));

    if (!bank.bank_code || bank.account_number.length < 10) return;

    // Capture current values so the async callback uses the right ones
    const bCode = bank.bank_code;
    const bNum  = bank.account_number;

    const timer = setTimeout(async () => {
      setBankVerifying(true);
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${API_BASE}/settings/resolve-account`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ bank_code: bCode, account_number: bNum }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Cannot verify account');
        setBank(prev => ({ ...prev, account_name: data.data?.account_name || '' }));
        setBankMsg(`Verified: ${data.data?.account_name}`);
        setBankManualEntry(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Cannot verify account';
        setBankErr(msg);
        // Both Paystack + Korapay failed — let user type the account name manually
        if (msg.includes('Korapay fallback:')) setBankManualEntry(true);
      } finally {
        setBankVerifying(false);
      }
    }, 600);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bank.bank_code, bank.account_number]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) { window.location.href = '/login'; return; }

    Promise.all([
      fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_BASE}/settings`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_BASE}/subscriptions`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
      // Load live bank list from Paystack so codes match /bank/resolve exactly
      fetch(`${API_BASE}/banks`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
    ]).then(([me, settings, sub, banksRes]) => {
      if (me.data) {
        setUser(me.data);
        setProfileForm({ first_name: me.data.first_name || '', last_name: me.data.last_name || '', phone: me.data.phone || '' });
        if (me.data.avatar) {
          // Backend returns full URL via asset(); use it directly
          setAvatarUrl(me.data.avatar);
        }
      }
      if (settings?.data?.bank_details) {
        const bd = settings.data.bank_details;
        setBank({ bank_name: bd.bank_name || '', bank_code: bd.bank_code || '', account_name: bd.account_name || '', account_number: bd.account_number || '' });
      }
      if (settings?.data?.autopayout_enabled !== undefined) {
        setAutopayoutEnabled(!!settings.data.autopayout_enabled);
      }
      if (sub?.data) setSubscription(sub.data);
      // Use live Paystack bank codes (correct for account verification)
      if (banksRes?.success && Array.isArray(banksRes.data) && banksRes.data.length > 0) {
        setLiveBanks(banksRes.data.map((b: any) => ({ name: b.name, code: b.code })));
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);

    setAvatarUploading(true);
    const token = localStorage.getItem('auth_token');
    const fd = new FormData();
    fd.append('avatar', file);

    try {
      const res = await fetch(`${API_BASE}/profile/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Upload failed');
      const newAvatarUrl = data.data.avatar_url;
      setAvatarUrl(newAvatarUrl);

      // Sync localStorage so TopBar (and any other component) picks up the
      // new avatar immediately without requiring a page reload.
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userObj = JSON.parse(storedUser);
          userObj.avatar = newAvatarUrl;
          localStorage.setItem('user', JSON.stringify(userObj));
          // 'storage' events don't fire in the same tab, so dispatch a
          // custom event that TopBar listens for.
          window.dispatchEvent(new Event('user-updated'));
        }
      } catch {}
    } catch (err) {
      setProfileErr(err instanceof Error ? err.message : 'Avatar upload failed');
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleProfileSave = async (otpCode: string) => {
    setProfileSaving(true); setProfileErr('');
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...profileForm, otp_code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      setUser(data.data);
      localStorage.setItem('user', JSON.stringify(data.data));
      window.dispatchEvent(new Event('user-updated'));
      setEditing(false); setProfileOtp(false);
      setProfileMsg('Profile updated successfully.');
      setTimeout(() => setProfileMsg(''), 4000);
    } catch (err) {
      setProfileErr(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setProfileSaving(false);
    }
  };

  const verifyAccount = async () => {
    setBankErr(''); setBankMsg('');
    setBankManualEntry(false);
    if (!bank.bank_code) { setBankErr('Select a bank first.'); return; }
    if (bank.account_number.length < 10) { setBankErr('Enter a valid 10-digit account number.'); return; }
    setBankVerifying(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`${API_BASE}/settings/resolve-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bank_code: bank.bank_code, account_number: bank.account_number }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Cannot verify account');
      setBank(prev => ({ ...prev, account_name: data.data?.account_name || '' }));
      setBankMsg(`Verified: ${data.data?.account_name}`);
      setBankManualEntry(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Cannot verify account';
      setBankErr(msg);
      if (msg.includes('Korapay fallback:')) setBankManualEntry(true);
    } finally {
      setBankVerifying(false);
    }
  };

  const handleBankSave = async (otpCode: string) => {
    setBankSaving(true); setBankErr('');
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`${API_BASE}/settings/bank-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...bank, otp_code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');
      setBankOtp(false);
      setBankMsg('Bank details saved successfully.');
      setTimeout(() => setBankMsg(''), 4000);
    } catch (err) {
      setBankErr(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBankSaving(false);
    }
  };

  const handleAutopayoutToggle = async (next: boolean) => {
    setAutopayoutLoading(true); setAutopayoutErr(''); setAutopayoutMsg('');
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`${API_BASE}/settings/autopayout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Toggle failed');
      setAutopayoutEnabled(next);
      setAutopayoutMsg(next ? 'Auto-payout enabled. You will be paid out automatically when your balance meets the minimum.' : 'Auto-payout disabled.');
      setTimeout(() => setAutopayoutMsg(''), 5000);
    } catch (err) {
      setAutopayoutErr(err instanceof Error ? err.message : 'Toggle failed');
    } finally {
      setAutopayoutLoading(false);
    }
  };

  const handlePasswordSave = async (otpCode: string) => {
    setPwErr('');
    if (pwForm.password !== pwForm.password_confirmation) { setPwErr('Passwords do not match.'); return; }
    if (pwForm.password.length < 8) { setPwErr('Password must be at least 8 characters.'); return; }
    setPwSaving(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...pwForm, otp_code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.errors
          ? Object.values(data.errors as Record<string, string[]>).flat().join(' ')
          : data.message || 'Failed';
        throw new Error(msg);
      }
      setPwOtp(false);
      setPwForm({ current_password: '', password: '', password_confirmation: '' });
      setPwMsg('Password changed successfully.');
      setTimeout(() => setPwMsg(''), 4000);
    } catch (err) {
      setPwErr(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  // For Nigeria (or no filter): use live Paystack banks — codes are guaranteed to
  // match what Paystack's /bank/resolve endpoint accepts.
  // For other countries: fall back to the static list (Paystack only supports Nigeria).
  const filteredBanks = useMemo(() => {
    let source: { name: string; code: string }[];
    if (selectedCountry && selectedCountry !== 'Nigeria') {
      source = banksByCountry[selectedCountry] || [];
    } else {
      source = liveBanks.length > 0 ? liveBanks : africanBanks;
    }
    return [...source].sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedCountry, liveBanks]);

  const displayAvatar = avatarPreview || avatarUrl;
  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() : '';
  const initials = fullName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const roleLabel = { vendor: 'Vendor', affiliate: 'Affiliate', admin: 'Admin', superadmin: 'Admin' }[user?.user_type || ''] || '';
  const isAdmin = user?.user_type === 'admin' || user?.user_type === 'superadmin';
  const isSubActive = subscription?.status === 'active';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <RefreshCw className="w-7 h-7 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
        <span>›</span>
        <span className="text-gray-900 dark:text-white font-medium">Profile</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">

        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-1 flex flex-col gap-5">

          {/* Avatar + Info card */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            {/* Banner */}
            <div className="h-20 bg-gradient-to-r from-blue-600 to-indigo-600" />

            <div className="px-5 pb-5 -mt-12">
              <div className="flex items-end justify-between mb-3">
                {/* Clickable avatar */}
                <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  {displayAvatar ? (
                    <img
                      src={displayAvatar}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-white dark:ring-gray-900 shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white dark:ring-gray-900 shadow-md">
                      {initials}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {avatarUploading
                      ? <RefreshCw size={20} className="text-white animate-spin" />
                      : <Camera size={20} className="text-white" />}
                  </div>
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

                {!editing && (
                  <button
                    onClick={() => { setEditing(true); setProfileOtp(false); setProfileErr(''); }}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Pencil size={12} />Edit
                  </button>
                )}
              </div>

              {/* Name / ID */}
              {!editing && (
                <>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{fullName || '—'}</h2>
                  {user?.user_id && (
                    <span className="inline-block mt-1 text-xs font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                      {user.user_id}
                    </span>
                  )}
                </>
              )}

              {/* Edit form */}
              {editing && (
                <div className="mt-1 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {(['first_name', 'last_name'] as const).map(field => (
                      <div key={field}>
                        <label className="block text-xs text-gray-500 mb-1 capitalize">{field.replace('_', ' ')}</label>
                        <input
                          value={profileForm[field]}
                          onChange={e => setProfileForm(p => ({ ...p, [field]: e.target.value }))}
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {profileErr && <p className="text-xs text-red-600">{profileErr}</p>}

                  {!profileOtp ? (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setProfileOtp(true)}
                        disabled={profileSaving}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                      >
                        <Save size={12} />Save Changes
                      </button>
                      <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                        <X size={12} />Cancel
                      </button>
                    </div>
                  ) : (
                    <OtpStep
                      purpose="profile_update"
                      onVerified={handleProfileSave}
                      onCancel={() => { setProfileOtp(false); setEditing(false); }}
                    />
                  )}
                </div>
              )}

              {profileMsg && (
                <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle size={12} />{profileMsg}
                </p>
              )}
            </div>

            {/* Info rows */}
            <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-3 space-y-0">
              <InfoRow icon={User} label="Name" value={fullName} />
              <InfoRow icon={Mail} label="Email" value={user?.email || ''} />
              <InfoRow icon={Phone} label="Phone" value={user?.phone || ''} />
              <InfoRow icon={Globe} label="Role" value={roleLabel} />
              <InfoRow icon={Calendar} label="Joined" value={user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''} />
            </div>
          </div>

          {/* Subscription status */}
          {!isAdmin && subscription && (
            <div className={`rounded-xl border p-4 ${isSubActive ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'}`}>
              <div className="flex items-start gap-3">
                {isSubActive
                  ? <ShieldCheck size={22} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  : <ShieldOff size={22} className="text-amber-500 flex-shrink-0 mt-0.5" />}
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {isSubActive ? 'Access Active' : 'No Active Subscription'}
                  </p>
                  {isSubActive && subscription.expires_at && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Valid until <strong>{new Date(subscription.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                    </p>
                  )}
                  {!isSubActive && (
                    <Link href="/subscriptions" className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors">
                      <CreditCard size={12} />Subscribe Now
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Bank Information */}
          {!isAdmin && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
              <SectionHeader icon={Landmark} title="Bank Information" />
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-4 py-2.5">
                  <CheckCircle size={14} className="text-blue-500 flex-shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">Ensure your bank account name matches your profile name for smooth withdrawals.</p>
                </div>

                {bankMsg && (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 px-4 py-2.5 text-sm text-green-700 dark:text-green-300">
                    <CheckCircle size={14} className="flex-shrink-0" />{bankMsg}
                  </div>
                )}
                {bankErr && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
                    <AlertTriangle size={14} className="flex-shrink-0" />{bankErr}
                  </div>
                )}

                {/* Country */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Country</label>
                  <select
                    value={selectedCountry}
                    onChange={e => { setSelectedCountry(e.target.value); setBank(prev => ({ ...prev, bank_name: '', bank_code: '' })); }}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
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
                        type="text" maxLength={11}
                        value={bank.account_number}
                        onChange={e => setBank(prev => ({ ...prev, account_number: e.target.value.replace(/\D/g, '') }))}
                        placeholder="0000000000"
                        className="flex-1 min-w-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                      />
                      <button type="button" onClick={verifyAccount} disabled={bankVerifying}
                        className="flex-shrink-0 text-xs font-semibold bg-gray-900 dark:bg-gray-700 text-white px-3 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-60 transition-colors">
                        {bankVerifying ? '…' : 'Verify'}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Account Name
                    {bankVerifying && (
                      <span className="ml-2 text-blue-500 text-xs font-normal animate-pulse">Verifying…</span>
                    )}
                    {bankManualEntry && !bankVerifying && (
                      <span className="ml-2 text-amber-500 text-xs font-normal">— type manually below</span>
                    )}
                  </label>
                  <input
                    readOnly={!bankManualEntry}
                    value={bank.account_name}
                    onChange={e => bankManualEntry && setBank(prev => ({ ...prev, account_name: e.target.value }))}
                    placeholder={bankVerifying ? 'Verifying account…' : bankManualEntry ? 'Type your account name…' : 'Auto-filled after verification'}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none transition-colors
                      ${bankManualEntry
                        ? 'border-amber-400 dark:border-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-amber-500 cursor-text'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-default'}`}
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    {bankManualEntry
                      ? 'Verification unavailable — enter the exact account name on your bank card.'
                      : 'Fills automatically when you enter a valid 10-digit account number'}
                  </p>
                </div>

                {!bankOtp ? (
                  <div className="flex justify-end">
                    <button
                      onClick={() => { if (!bank.account_name) { setBankErr('Verify your account first, or enter the account name manually.'); return; } setBankErr(''); setBankOtp(true); }}
                      disabled={bankSaving || !bank.account_name}
                      className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Landmark size={15} />Update Bank Info
                    </button>
                  </div>
                ) : (
                  <OtpStep purpose="bank_details_update" onVerified={handleBankSave} onCancel={() => setBankOtp(false)} />
                )}
              </div>
            </div>
          )}

          {/* Auto-Payout Toggle — only for affiliates and vendors */}
          {!isAdmin && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
              <SectionHeader icon={RefreshCw} title="Auto-Payout" />
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-4 py-2.5">
                  <RefreshCw size={14} className="text-blue-500 flex-shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    When enabled, your balance will be automatically paid to your bank account on the platform&apos;s payout schedule — no need to request manually.
                  </p>
                </div>

                {autopayoutMsg && (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 px-4 py-2.5 text-sm text-green-700 dark:text-green-300">
                    <CheckCircle size={14} className="flex-shrink-0" />{autopayoutMsg}
                  </div>
                )}
                {autopayoutErr && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
                    <AlertTriangle size={14} className="flex-shrink-0" />{autopayoutErr}
                  </div>
                )}

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {autopayoutEnabled ? 'Auto-Payout is ON' : 'Auto-Payout is OFF'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {autopayoutEnabled
                        ? 'Your balance will be sent automatically on the next payout cycle.'
                        : 'Enable to receive automatic payouts when your balance reaches the minimum threshold.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAutopayoutToggle(!autopayoutEnabled)}
                    disabled={autopayoutLoading || !bank.account_number}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
                      ${autopayoutEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform
                      ${autopayoutEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
                  </button>
                </div>

                {!bank.account_number && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Add your bank details above to enable auto-payout.
                  </p>
                )}

                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-3 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <p className="font-medium text-gray-700 dark:text-gray-300">Requirements for auto-payout:</p>
                  <p className={`flex items-center gap-1.5 ${bank.account_number ? 'text-green-600 dark:text-green-400' : ''}`}>
                    {bank.account_number ? <CheckCircle size={11} /> : '○'} Bank details saved
                  </p>
                  <p className={`flex items-center gap-1.5 ${isSubActive ? 'text-green-600 dark:text-green-400' : ''}`}>
                    {isSubActive ? <CheckCircle size={11} /> : '○'} Active subscription
                  </p>
                  <p className="flex items-center gap-1.5">○ Balance meets platform minimum (set by admin)</p>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
            <SectionHeader icon={Lock} title="Security Settings" />
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-4 py-2.5">
                <Lock size={14} className="text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">Change your password below to keep your account secure.</p>
              </div>

              {pwMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 px-4 py-2.5 text-sm text-green-700 dark:text-green-300">
                  <CheckCircle size={14} className="flex-shrink-0" />{pwMsg}
                </div>
              )}
              {pwErr && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
                  <AlertTriangle size={14} className="flex-shrink-0" />{pwErr}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'current' as const, field: 'current_password', label: 'Current Password' },
                  { key: 'new' as const, field: 'password', label: 'New Password' },
                ].map(({ key, field, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
                    <div className="relative">
                      <input
                        type={showPw[key] ? 'text' : 'password'}
                        value={pwForm[field as keyof typeof pwForm]}
                        onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                        placeholder={`Enter ${label.toLowerCase()}`}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2.5 pr-10 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                      />
                      <button type="button" onClick={() => setShowPw(s => ({ ...s, [key]: !s[key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPw[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="sm:w-1/2">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPw.confirm ? 'text' : 'password'}
                    value={pwForm.password_confirmation}
                    onChange={e => setPwForm(p => ({ ...p, password_confirmation: e.target.value }))}
                    placeholder="Confirm new password"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2.5 pr-10 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  />
                  <button type="button" onClick={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {!pwOtp ? (
                <div className="flex justify-end">
                  <button
                    onClick={() => { setPwErr(''); setPwOtp(true); }}
                    disabled={pwSaving}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Lock size={15} />Update Password
                  </button>
                </div>
              ) : (
                <OtpStep purpose="password_change" onVerified={handlePasswordSave} onCancel={() => setPwOtp(false)} />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
