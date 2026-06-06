'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, TrendingUp, Users, DollarSign, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';

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

  return (
    <div className="min-h-screen flex bg-[#080912]">

      {/* ─── LEFT: Form ─────────────────────────────────── */}
      <div className="w-full lg:w-[45%] flex flex-col relative overflow-hidden">

        {/* Ambient glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top nav */}
        <div className="flex justify-between items-center px-8 py-6 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap size={18} className="text-white" fill="white" />
            </div>
            <span className="text-white text-lg font-bold tracking-tight">AffiliateHub</span>
          </div>
          <Link href="/" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </Link>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-8 relative z-10">
          <div className="w-full max-w-[400px]">

            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome back 👋</h1>
              <p className="text-gray-400 text-sm">Sign in to your AffiliateHub account</p>
            </div>

            {/* Alerts */}
            {idleMsg && (
              <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-3 rounded-xl mb-5 text-sm">
                <span className="mt-0.5">⚠️</span>
                <span>You were logged out after 10 minutes of inactivity.</span>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm">
                <span className="mt-0.5">✕</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-300">Password</label>
                  <Link href="/forgot-password" className="text-indigo-400 text-xs hover:text-indigo-300 transition">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition p-1"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 rounded-md border border-white/20 bg-white/5 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition flex items-center justify-center">
                    {rememberMe && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-400 group-hover:text-gray-300 transition">Remember me for 30 days</span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 text-sm"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Signing in...
                  </>
                ) : 'Sign in'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-gray-600 text-xs">or continue with</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 py-2.5 rounded-xl transition text-sm font-medium">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button className="flex items-center justify-center gap-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 py-2.5 rounded-xl transition text-sm font-medium">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M11.4 2H2v9.4h9.4V2z" fill="#F25022"/>
                  <path d="M22 2h-9.4v9.4H22V2z" fill="#7FBA00"/>
                  <path d="M11.4 12.6H2V22h9.4v-9.4z" fill="#00A4EF"/>
                  <path d="M22 12.6h-9.4V22H22v-9.4z" fill="#FFB900"/>
                </svg>
                Microsoft
              </button>
            </div>

            <p className="text-gray-500 text-center mt-6 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
                Create one free
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 relative z-10">
          <p className="text-gray-600 text-xs text-center">© 2025 AffiliateHub. All rights reserved.</p>
        </div>
      </div>

      {/* ─── RIGHT: Preview panel ────────────────────────── */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#0d0e24] via-[#0f1130] to-[#080912] items-center justify-center p-12 relative overflow-hidden border-l border-white/5">

        {/* Decorative orbs */}
        <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-56 h-56 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/3 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 w-full max-w-[480px]">

          {/* Headline */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-indigo-300 text-xs font-medium">Live platform stats</span>
            </div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-3">
              Grow your income<br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">on autopilot</span>
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Track sales, manage affiliates, and withdraw earnings — all from one clean dashboard.
            </p>
          </div>

          {/* Stats card */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 mb-4 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <TrendingUp size={16} className="text-indigo-400" />
                </div>
                <span className="text-white font-semibold text-sm">Performance Overview</span>
              </div>
              <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">This month</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Total Revenue', value: '₦480K', icon: DollarSign, trend: '+24%', up: true, color: 'text-green-400', bg: 'bg-green-500/10' },
                { label: 'Active Affiliates', value: '1,284', icon: Users, trend: '+12%', up: true, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { label: 'Total Sales', value: '3,920', icon: TrendingUp, trend: '+8%', up: true, color: 'text-violet-400', bg: 'bg-violet-500/10' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/[0.04] rounded-xl p-3.5 border border-white/5">
                  <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                    <stat.icon size={14} className={stat.color} />
                  </div>
                  <p className="text-gray-500 text-[10px] mb-1">{stat.label}</p>
                  <p className="text-white font-bold text-base">{stat.value}</p>
                  <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium mt-1 ${stat.up ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {stat.trend}
                  </span>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
              <div className="flex items-end justify-between h-20 gap-1.5 mb-2">
                {[40, 65, 45, 80, 55, 95, 70, 85, 60, 100, 75, 90].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                    <div
                      className={`w-full rounded-sm transition-all ${i === 10 ? 'bg-indigo-500' : 'bg-indigo-500/30'}`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-gray-600">
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => (
                  <span key={m}>{m.slice(0,1)}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {['Real-time analytics', 'Multi-currency', 'Instant payouts', 'Affiliate tracking'].map((f) => (
              <span key={f} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
