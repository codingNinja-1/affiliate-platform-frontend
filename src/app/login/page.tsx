'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Zap, TrendingUp, Users, ShoppingBag, ArrowUpRight, Star } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [idleMsg, setIdleMsg] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      const user = localStorage.getItem('user');
      if (token && user) window.location.href = '/dashboard';
      if (new URLSearchParams(window.location.search).get('reason') === 'idle') setIdleMsg(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember: rememberMe }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message || 'Login failed'); return; }

      const userPayload = {
        ...data.data.user,
        referral_code: data.data.user?.affiliate?.referral_code || data.data.user?.referral_code,
      };
      localStorage.setItem('auth_token', data.data.access_token);
      localStorage.setItem('user', JSON.stringify(userPayload));

      const userType = data.data.user.user_type?.toLowerCase();
      if (userType !== 'superadmin' && userType !== 'admin') {
        try {
          const checkRes = await fetch('/api/settings/check-bank-details', {
            headers: { Authorization: `Bearer ${data.data.access_token}` },
          });
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.success && checkData.data.requires_setup) {
              window.location.href = '/settings';
              return;
            }
          }
        } catch (err) {
          console.warn('Failed to check bank details', err);
        }
      }
      window.location.href = '/dashboard';
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const bars = [35, 55, 40, 70, 50, 85, 60, 90, 65, 100, 75, 88];
  const months = ['J','F','M','A','M','J','J','A','S','O','N','D'];

  return (
    <div className="min-h-screen flex">

      {/* ══════════════════════════════════════════
          LEFT — Form panel
      ══════════════════════════════════════════ */}
      <div className="w-full lg:w-[48%] flex flex-col bg-[#06070f] relative overflow-hidden">

        {/* Mesh background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(139,92,246,0.08) 0%, transparent 60%)',
            }}
          />
          {/* Dot grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="#fff" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </Link>
        </div>

        {/* Form */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6 sm:px-12 py-10">
          <div className="w-full max-w-[420px]">

            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-[2rem] font-bold text-white leading-tight mb-2">
                Welcome back 👋
              </h1>
              <p className="text-gray-500 text-sm">
                New here?{' '}
                <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
                  Create a free account
                </Link>
              </p>
            </div>

            {/* Alerts */}
            {idleMsg && (
              <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-3 rounded-xl mb-6 text-sm">
                <span>⏱</span>
                <span>Logged out after 10 min of inactivity.</span>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
                <span className="text-base">✕</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500/70 focus:bg-white/[0.06] focus:ring-2 focus:ring-indigo-500/15 transition-all"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••"
                    className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500/70 focus:bg-white/[0.06] focus:ring-2 focus:ring-indigo-500/15 transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                    rememberMe
                      ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-500/30'
                      : 'bg-white/5 border-white/15 hover:border-white/30'
                  }`}
                >
                  {rememberMe && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="text-sm text-gray-500 hover:text-gray-400 transition">Remember me for 30 days</span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full overflow-hidden group bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 text-sm mt-1"
              >
                {/* Shimmer */}
                <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Signing in…
                  </>
                ) : 'Sign in →'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[11px] text-gray-600 font-medium uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Google',
                  icon: (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  ),
                },
                {
                  label: 'Microsoft',
                  icon: (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                      <path d="M11.4 2H2v9.4h9.4V2z" fill="#F25022"/>
                      <path d="M22 2h-9.4v9.4H22V2z" fill="#7FBA00"/>
                      <path d="M11.4 12.6H2V22h9.4v-9.4z" fill="#00A4EF"/>
                      <path d="M22 12.6h-9.4V22H22v-9.4z" fill="#FFB900"/>
                    </svg>
                  ),
                },
              ].map((s) => (
                <button
                  key={s.label}
                  className="flex items-center justify-center gap-2.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] text-gray-300 py-3 rounded-xl transition-all text-sm font-medium"
                >
                  {s.icon}
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="relative z-10 text-gray-700 text-xs text-center pb-6">
          © 2025 AffiliateHub. All rights reserved.
        </p>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT — Visual panel
      ══════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center p-10"
        style={{
          background: 'linear-gradient(135deg, #0d0e1f 0%, #111330 40%, #0a0b1a 100%)',
        }}
      >
        {/* Gradient blobs */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.05) 0%, transparent 60%)' }} />

        {/* Border line */}
        <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent" />

        <div className="relative z-10 w-full max-w-[500px] flex flex-col gap-6">

          {/* Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-indigo-300 text-xs font-medium">Trusted by 2,400+ affiliates</span>
            </div>
          </div>

          {/* Headline */}
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white leading-[1.15] mb-3">
              Earn more.<br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                Track everything.
              </span>
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
              The affiliate platform built for serious marketers. Real-time data, multi-currency payouts, zero hassle.
            </p>
          </div>

          {/* Main stats card */}
          <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-5"
            style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)' }}
          >
            {/* Card header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/30 to-violet-500/30 flex items-center justify-center border border-indigo-500/20">
                  <TrendingUp size={15} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Revenue Dashboard</p>
                  <p className="text-gray-600 text-[10px]">June 2025</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-full px-2.5 py-1">
                <ArrowUpRight size={11} className="text-green-400" />
                <span className="text-green-400 text-[11px] font-semibold">+24% MoM</span>
              </div>
            </div>

            {/* Big number */}
            <div className="mb-5">
              <p className="text-[11px] text-gray-600 uppercase tracking-wider mb-1">Total Revenue</p>
              <p className="text-4xl font-bold text-white tracking-tight">₦4,820,000</p>
            </div>

            {/* Stat pills */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {[
                { icon: ShoppingBag, label: 'Sales', value: '3,920', color: 'indigo' },
                { icon: Users, label: 'Affiliates', value: '1,284', color: 'violet' },
                { icon: TrendingUp, label: 'Conv. rate', value: '8.4%', color: 'purple' },
              ].map((s) => {
                const colors: Record<string, string> = {
                  indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
                  violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
                  purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
                };
                return (
                  <div key={s.label} className={`border rounded-xl p-3 ${colors[s.color]}`}>
                    <s.icon size={13} className="mb-2 opacity-80" />
                    <p className="text-[10px] text-gray-500 mb-0.5">{s.label}</p>
                    <p className="text-white font-bold text-sm">{s.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Bar chart */}
            <div className="bg-black/20 rounded-xl px-4 pt-4 pb-3 border border-white/[0.04]">
              <div className="flex items-end gap-1.5 h-16 mb-2">
                {bars.map((h, i) => {
                  const isActive = i === 10;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end">
                      <div
                        className="w-full rounded-sm"
                        style={{
                          height: `${h}%`,
                          background: isActive
                            ? 'linear-gradient(to top, #6366f1, #a78bfa)'
                            : 'rgba(99,102,241,0.25)',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between">
                {months.map((m, i) => (
                  <span key={i} className={`flex-1 text-center text-[9px] font-medium ${i === 10 ? 'text-indigo-400' : 'text-gray-700'}`}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              A
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={10} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                "AffiliateHub made it ridiculously easy to track my sales and withdraw earnings. Best platform I've used."
              </p>
              <p className="text-gray-600 text-[10px] mt-1.5 font-medium">Adewale O. · Top Affiliate, Q1 2025</p>
            </div>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {['Real-time analytics', 'Multi-currency', 'Instant withdrawals', 'Affiliate tracking', 'Dark mode'].map((f) => (
              <span key={f} className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-full px-3 py-1 text-[11px] text-gray-500 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/70" />
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
