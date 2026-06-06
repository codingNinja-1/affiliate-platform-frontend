'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Eye, EyeOff, Zap, TrendingUp, Users, ShoppingBag,
  ArrowRight, ArrowLeft, Check, Star, ArrowUpRight,
  Link2, Package, User,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────────────── */
type Step = 1 | 2 | 3;

type FormData = {
  user_type: 'affiliate' | 'vendor' | 'customer';
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  business_name: string;
  business_description: string;
  password: string;
  password_confirmation: string;
};

/* ─── Password strength ─────────────────────────────────────────────────── */
function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: '', color: 'bg-white/10' },
    { label: 'Weak', color: 'bg-red-500' },
    { label: 'Fair', color: 'bg-amber-500' },
    { label: 'Good', color: 'bg-blue-500' },
    { label: 'Strong', color: 'bg-emerald-500' },
  ];
  return { score, ...map[score] };
}

/* ─── Shared input style ────────────────────────────────────────────────── */
const inputCls =
  'w-full px-4 py-3.5 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 transition-all';
const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
};

/* ─── Right visual panel (reused from login) ────────────────────────────── */
function RightPanel() {
  const bars   = [35, 55, 40, 70, 50, 85, 60, 90, 65, 100, 75, 88];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const revenues = ['₦1.2M','₦1.9M','₦1.4M','₦2.4M','₦1.7M','₦2.9M','₦2.1M','₦3.1M','₦2.2M','₦3.4M','₦2.6M','₦3.0M'];
  const [hovered, setHovered] = useState<number | null>(null);
  const CHART_H = 110;

  return (
    <div
      className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center p-10"
      style={{ background: 'linear-gradient(135deg,#0d0e1f 0%,#111330 40%,#0a0b1a 100%)' }}
    >
      {/* Blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 70%)' }} />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full"
        style={{ background: 'radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 70%)' }} />
      <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent" />

      <div className="relative z-10 w-full max-w-[480px] flex flex-col gap-5">
        {/* Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-indigo-300 text-xs font-medium">Trusted by 2,400+ affiliates</span>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white leading-[1.15] mb-2">
            Earn more.<br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Track everything.
            </span>
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
            Real-time data, multi-currency payouts, zero hassle. Built for serious marketers.
          </p>
        </div>

        {/* Stats card */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5"
          style={{ boxShadow:'0 25px 50px -12px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-indigo-500/20 flex items-center justify-center">
                <TrendingUp size={15} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Revenue Dashboard</p>
                <p className="text-gray-600 text-[10px]">June 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 rounded-full px-2.5 py-1">
              <ArrowUpRight size={11} className="text-green-400" />
              <span className="text-green-400 text-[11px] font-semibold">+24% MoM</span>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-[11px] text-gray-600 uppercase tracking-wider mb-0.5">Total Revenue</p>
            <p className="text-4xl font-bold text-white tracking-tight">₦4,820,000</p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { icon: ShoppingBag, label: 'Sales',      value: '3,920', cls: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' },
              { icon: Users,       label: 'Affiliates', value: '1,284', cls: 'bg-violet-500/10 border-violet-500/20 text-violet-400' },
              { icon: TrendingUp,  label: 'Conv. rate', value: '8.4%',  cls: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
            ].map(({ icon: Icon, label, value, cls }) => (
              <div key={label} className={`border rounded-xl p-3 ${cls}`}>
                <Icon size={13} className="mb-1.5 opacity-80" />
                <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
                <p className="text-white font-bold text-sm">{value}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-black/30 rounded-xl px-4 pt-4 pb-3 border border-white/[0.06]">
            <div className="flex items-end gap-1" style={{ height: `${CHART_H}px`, marginBottom: 8 }}>
              {bars.map((h, i) => {
                const barH = Math.round((h / 100) * CHART_H);
                const active = i === 10, hov = hovered === i;
                return (
                  <div key={i} className="relative flex-1 cursor-pointer"
                    style={{ height: CHART_H, display: 'flex', alignItems: 'flex-end' }}
                    onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                  >
                    {hov && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none">
                        <div className="bg-[#1e1f3a] border border-indigo-500/30 rounded-lg px-2.5 py-1.5 shadow-xl whitespace-nowrap">
                          <p className="text-[10px] text-gray-400 font-medium">{months[i]}</p>
                          <p className="text-xs text-white font-bold">{revenues[i]}</p>
                        </div>
                        <div className="w-2 h-2 bg-[#1e1f3a] border-r border-b border-indigo-500/30 rotate-45 mx-auto -mt-1" />
                      </div>
                    )}
                    <div className="w-full rounded-t-sm transition-all duration-150" style={{
                      height: barH,
                      background: active || hov ? 'linear-gradient(to top,#6366f1,#a78bfa)' : 'rgba(139,120,240,0.45)',
                      boxShadow: active ? '0 0 12px rgba(99,102,241,0.5)' : hov ? '0 0 8px rgba(139,120,240,0.4)' : 'none',
                    }} />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1">
              {months.map((m, i) => (
                <span key={i} className="flex-1 text-center transition-colors duration-150" style={{
                  fontSize: 9, fontWeight: hovered === i || i === 10 ? 700 : 500,
                  color: hovered === i ? '#a78bfa' : i === 10 ? '#818cf8' : '#374151',
                }}>{m.slice(0, 1)}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">N</div>
          <div>
            <div className="flex gap-0.5 mb-1">
              {[...Array(5)].map((_, i) => <Star key={i} size={10} className="text-yellow-400 fill-yellow-400" />)}
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">"Signing up took 2 minutes. I made my first commission the same day. Best decision I made for my online income."</p>
            <p className="text-gray-600 text-[10px] mt-1.5 font-medium">Ngozi A. · Affiliate, Lagos</p>
          </div>
        </div>

        {/* Pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {['Real-time analytics','Multi-currency','Instant withdrawals','OTP security'].map((f) => (
            <span key={f} className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-full px-3 py-1 text-[11px] text-gray-500 font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/70" />{f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function RegisterPage() {
  const [step, setStep]   = useState<Step>(1);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const [form, setForm] = useState<FormData>({
    user_type: 'affiliate',
    first_name: '', last_name: '', email: '', phone: '',
    business_name: '', business_description: '',
    password: '', password_confirmation: '',
  });

  useEffect(() => {
    if (localStorage.getItem('auth_token')) {
      setBlocked(true);
      setError('You are already logged in. Please log out first.');
    }
  }, []);

  const set = (field: keyof FormData, val: string) => {
    setForm((f) => ({ ...f, [field]: val }));
    setFieldErrors((e) => { const n = { ...e }; delete n[field]; return n; });
    setError('');
  };

  /* ── Step validation ── */
  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!form.first_name.trim()) errs.first_name = 'First name is required';
    if (!form.last_name.trim())  errs.last_name  = 'Last name is required';
    if (!form.email.trim())      errs.email      = 'Email is required';
    if (!form.phone.trim())      errs.phone      = 'Phone is required';
    if (form.user_type === 'vendor' && !form.business_name.trim()) errs.business_name = 'Business name is required';
    return errs;
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Min 8 characters';
    if (form.password !== form.password_confirmation) errs.password_confirmation = 'Passwords do not match';
    return errs;
  };

  const goNext = () => {
    if (step === 2) {
      const errs = validateStep2();
      if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    }
    setStep((s) => (s < 3 ? (s + 1) as Step : s));
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    const errs = validateStep3();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    if (blocked) return;
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.errors) {
          const msgs = Object.values(data.errors as Record<string, string[]>).flat().join('\n');
          setError(msgs || data.message || 'Registration failed');
        } else {
          setError(data?.message || 'Registration failed');
        }
        return;
      }
      if (data.data?.access_token) {
        localStorage.setItem('auth_token', data.data.access_token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        window.location.href = '/dashboard';
        return;
      }
      setSuccess('Registration submitted! Please check your email or wait for approval.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength(form.password);

  /* ── Render ── */
  return (
    <div className="min-h-screen flex">

      {/* ════════════════════════════════════════════
          LEFT — form panel
      ════════════════════════════════════════════ */}
      <div
        className="w-full lg:w-[48%] flex flex-col relative overflow-hidden"
        style={{ background: '#06070f' }}
      >
        {/* Mesh */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 60% at 20% 0%,rgba(99,102,241,0.12) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 80% 100%,rgba(139,92,246,0.08) 0%,transparent 60%)',
          }} />
          <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="reg-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="#fff" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#reg-dots)" />
          </svg>
        </div>

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-8 pt-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/40">
              <Zap size={17} className="text-white" fill="white" />
            </div>
            <span className="text-white text-lg font-bold tracking-tight">AffiliateHub</span>
          </div>
          <Link href="/" className="text-gray-600 hover:text-gray-400 transition text-sm flex items-center gap-1.5">
            <ArrowLeft size={14} /> Back
          </Link>
        </div>

        {/* Form area */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6 sm:px-12 py-10">
          <div className="w-full max-w-[420px]">

            {/* Progress steps */}
            <div className="flex items-center gap-2 mb-8">
              {([1,2,3] as Step[]).map((s) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 flex-shrink-0 ${
                    step > s  ? 'bg-indigo-600 text-white' :
                    step === s ? 'bg-indigo-600 text-white ring-4 ring-indigo-600/20' :
                                 'bg-white/5 text-gray-600 border border-white/10'
                  }`}>
                    {step > s ? <Check size={13} /> : s}
                  </div>
                  <span className={`text-xs font-medium transition-colors ${step === s ? 'text-white' : 'text-gray-600'}`}>
                    {s === 1 ? 'Account type' : s === 2 ? 'Your info' : 'Password'}
                  </span>
                  {s < 3 && <div className={`flex-1 h-px transition-colors ${step > s ? 'bg-indigo-600/50' : 'bg-white/[0.06]'}`} />}
                </div>
              ))}
            </div>

            {/* Heading */}
            <div className="mb-7">
              <h1 className="text-[1.9rem] font-bold text-white leading-tight mb-1.5">
                {step === 1 ? 'Choose your role' :
                 step === 2 ? 'Tell us about you' :
                              'Secure your account'}
              </h1>
              <p className="text-gray-500 text-sm">
                {step === 1 ? 'Pick how you want to use AffiliateHub' :
                 step === 2 ? 'Fill in your personal details to continue' :
                              'Create a strong password to protect your account'}
              </p>
            </div>

            {/* Alerts */}
            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm">
                <span className="text-base mt-0.5">✕</span>
                <span className="whitespace-pre-line">{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl mb-5 text-sm">
                <Check size={16} className="mt-0.5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* ── STEP 1: Account type ── */}
            {step === 1 && (
              <div className="space-y-3">
                {([
                  { value: 'affiliate', icon: Link2,   label: 'Affiliate',  desc: 'Promote products and earn commissions on every sale you drive.' },
                  { value: 'vendor',    icon: Package,  label: 'Vendor',     desc: 'List your digital products and build an affiliate sales network.' },
                  { value: 'customer',  icon: User,     label: 'Customer',   desc: 'Browse and purchase digital products from verified vendors.' },
                ] as const).map(({ value, icon: Icon, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set('user_type', value)}
                    className="w-full text-left rounded-xl p-4 border transition-all duration-200 flex items-center gap-4 group"
                    style={{
                      background: form.user_type === value ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                      borderColor: form.user_type === value ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)',
                    }}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                      form.user_type === value
                        ? 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30'
                        : 'bg-white/5 border border-white/10'
                    }`}>
                      <Icon size={20} className={form.user_type === value ? 'text-white' : 'text-gray-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${form.user_type === value ? 'text-white' : 'text-gray-300'}`}>{label}</p>
                      <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      form.user_type === value ? 'border-indigo-500 bg-indigo-600' : 'border-white/20'
                    }`}>
                      {form.user_type === value && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* ── STEP 2: Personal info ── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {(['first_name','last_name'] as const).map((f) => (
                    <div key={f}>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                        {f === 'first_name' ? 'First name' : 'Last name'}
                      </label>
                      <input
                        type="text"
                        value={form[f]}
                        onChange={(e) => set(f, e.target.value)}
                        placeholder={f === 'first_name' ? 'John' : 'Doe'}
                        className={inputCls}
                        style={{ ...inputStyle, borderColor: fieldErrors[f] ? 'rgba(239,68,68,0.5)' : undefined }}
                      />
                      {fieldErrors[f] && <p className="text-red-400 text-[11px] mt-1">{fieldErrors[f]}</p>}
                    </div>
                  ))}
                </div>

                {[
                  { field: 'email' as const, label: 'Email address', type: 'email', placeholder: 'you@example.com' },
                  { field: 'phone' as const, label: 'Phone number',  type: 'tel',   placeholder: '+234 800 000 0000' },
                ].map(({ field, label, type, placeholder }) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                    <input
                      type={type}
                      value={form[field]}
                      onChange={(e) => set(field, e.target.value)}
                      placeholder={placeholder}
                      className={inputCls}
                      style={{ ...inputStyle, borderColor: fieldErrors[field] ? 'rgba(239,68,68,0.5)' : undefined }}
                    />
                    {fieldErrors[field] && <p className="text-red-400 text-[11px] mt-1">{fieldErrors[field]}</p>}
                  </div>
                ))}

                {form.user_type === 'vendor' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Business name</label>
                      <input
                        type="text"
                        value={form.business_name}
                        onChange={(e) => set('business_name', e.target.value)}
                        placeholder="Acme Digital Co."
                        className={inputCls}
                        style={{ ...inputStyle, borderColor: fieldErrors.business_name ? 'rgba(239,68,68,0.5)' : undefined }}
                      />
                      {fieldErrors.business_name && <p className="text-red-400 text-[11px] mt-1">{fieldErrors.business_name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Business description</label>
                      <textarea
                        value={form.business_description}
                        onChange={(e) => set('business_description', e.target.value)}
                        placeholder="Briefly describe what you sell…"
                        rows={3}
                        className={`${inputCls} resize-none`}
                        style={inputStyle}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── STEP 3: Password ── */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => set('password', e.target.value)}
                      placeholder="••••••••••"
                      className={`${inputCls} pr-12`}
                      style={{ ...inputStyle, borderColor: fieldErrors.password ? 'rgba(239,68,68,0.5)' : undefined }}
                    />
                    <button type="button" onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="text-red-400 text-[11px] mt-1">{fieldErrors.password}</p>}

                  {/* Strength bar */}
                  {form.password && (
                    <div className="mt-2.5">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : 'bg-white/10'}`} />
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-500">Strength: <span className="font-semibold text-gray-300">{strength.label}</span></p>
                    </div>
                  )}

                  {/* Requirements */}
                  <div className="mt-3 grid grid-cols-2 gap-1.5">
                    {[
                      { label: '8+ characters',    ok: form.password.length >= 8           },
                      { label: 'Uppercase letter',  ok: /[A-Z]/.test(form.password)         },
                      { label: 'Number',            ok: /[0-9]/.test(form.password)         },
                      { label: 'Special character', ok: /[^A-Za-z0-9]/.test(form.password)  },
                    ].map(({ label, ok }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${ok ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                          {ok && <Check size={8} className="text-emerald-400" />}
                        </div>
                        <span className={`text-[10px] transition-colors ${ok ? 'text-emerald-400' : 'text-gray-600'}`}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Confirm password</label>
                  <div className="relative">
                    <input
                      type={showCPw ? 'text' : 'password'}
                      value={form.password_confirmation}
                      onChange={(e) => set('password_confirmation', e.target.value)}
                      placeholder="••••••••••"
                      className={`${inputCls} pr-12`}
                      style={{ ...inputStyle, borderColor: fieldErrors.password_confirmation ? 'rgba(239,68,68,0.5)' : undefined }}
                    />
                    <button type="button" onClick={() => setShowCPw((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition">
                      {showCPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.password_confirmation && <p className="text-red-400 text-[11px] mt-1">{fieldErrors.password_confirmation}</p>}
                  {form.password_confirmation && form.password === form.password_confirmation && (
                    <p className="text-emerald-400 text-[11px] mt-1 flex items-center gap-1">
                      <Check size={10} /> Passwords match
                    </p>
                  )}
                </div>

                <p className="text-[11px] text-gray-600 leading-relaxed pt-1">
                  By creating an account you agree to our{' '}
                  <span className="text-indigo-400 cursor-pointer hover:underline">Terms of Service</span>{' '}
                  and{' '}
                  <span className="text-indigo-400 cursor-pointer hover:underline">Privacy Policy</span>.
                </p>
              </div>
            )}

            {/* ── Navigation buttons ── */}
            {!success && (
              <div className={`flex gap-3 mt-7 ${step > 1 ? 'flex-row' : ''}`}>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s > 1 ? (s - 1) as Step : s))}
                    className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all text-sm font-medium"
                  >
                    <ArrowLeft size={15} /> Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={step < 3 ? goNext : handleSubmit}
                  disabled={loading}
                  className="relative flex-1 overflow-hidden group bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 text-sm"
                >
                  <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Creating account…
                    </>
                  ) : step < 3 ? (
                    <>Continue <ArrowRight size={15} /></>
                  ) : (
                    <>Create account <Check size={15} /></>
                  )}
                </button>
              </div>
            )}

            {success && (
              <div className="mt-5 text-center">
                <Link href="/login" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition">
                  Go to login <ArrowRight size={14} />
                </Link>
              </div>
            )}

            <p className="text-gray-600 text-center text-sm mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="relative z-10 text-gray-700 text-xs text-center pb-6">
          © 2026 AffiliateHub. All rights reserved.
        </p>
      </div>

      {/* RIGHT */}
      <RightPanel />
    </div>
  );
}
