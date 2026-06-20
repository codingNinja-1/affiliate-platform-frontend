'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

type Step = 'email' | 'otp';

export default function ForgotPasswordPage() {
  const [step, setStep]       = useState<Step>('email');
  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('auth_token')) {
      window.location.href = '/dashboard';
    }
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  /* ── Step 1: send OTP ── */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Failed to send OTP'); return; }
      setStep('otp');
      setResendCountdown(60);
      setSuccess('OTP sent! Check your email.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Resend OTP ── */
  const handleResend = async () => {
    if (resendCountdown > 0) return;
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Failed to resend OTP'); return; }
      setResendCountdown(60);
      setSuccess('New OTP sent!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: verify OTP + set new password ── */
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8)          { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp_code: otp, password, password_confirmation: confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Failed to reset password'); return; }
      setSuccess('Password reset! Redirecting to login…');
      setTimeout(() => { window.location.href = '/login'; }, 2000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0b14]">

      {/* ── Left: form ── */}
      <div className="w-full lg:w-1/2 flex flex-col relative">
        {/* Background mesh */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dp" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M-10,10 l20,-20 M0,40 l40,-40 M30,50 l20,-20" stroke="#ffffff" strokeWidth="1" fill="none"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dp)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center min-h-screen px-6">
          <div className="w-full max-w-md">

            {/* Logo */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-4">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <h1 className="text-2xl font-bold text-white">AffiliateHub</h1>
              <p className="text-gray-400 text-sm mt-1">
                {step === 'email' ? 'Reset your password' : `OTP sent to ${email}`}
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              {(['email', 'otp'] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                    ${step === s ? 'bg-blue-600 text-white' : i < ['email','otp'].indexOf(step) ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                    {i < ['email','otp'].indexOf(step) ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs ${step === s ? 'text-white' : 'text-gray-500'}`}>
                    {s === 'email' ? 'Enter email' : 'Verify & reset'}
                  </span>
                  {i < 1 && <div className="flex-1 h-px bg-gray-700 mx-1 w-8" />}
                </div>
              ))}
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-4 bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            {/* ── STEP 1: Email ── */}
            {step === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full px-4 py-3 bg-[#1a1d2e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
                >
                  {loading ? 'Sending OTP…' : 'Send OTP →'}
                </button>
              </form>
            )}

            {/* ── STEP 2: OTP + new password ── */}
            {step === 'otp' && (
              <form onSubmit={handleReset} className="space-y-4">
                {/* OTP */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">6-Digit OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    required
                    className="w-full px-4 py-3 bg-[#1a1d2e] border border-gray-700 rounded-lg text-white text-center text-xl font-mono tracking-widest placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">Check your email for the 6-digit code</p>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCountdown > 0 || loading}
                      className="text-xs text-blue-400 disabled:text-gray-500 hover:underline disabled:no-underline"
                    >
                      {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min 8 chars, uppercase, number, symbol"
                      required
                      className="w-full px-4 py-3 pr-11 bg-[#1a1d2e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300">
                      {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showCpw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                      className="w-full px-4 py-3 pr-11 bg-[#1a1d2e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                    />
                    <button type="button" onClick={() => setShowCpw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300">
                      {showCpw ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                  {confirmPassword && (
                    <p className={`mt-1 text-xs ${password === confirmPassword ? 'text-green-400' : 'text-red-400'}`}>
                      {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6 || !password || password !== confirmPassword}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
                >
                  {loading ? 'Resetting…' : 'Reset Password ✓'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(''); setSuccess(''); setOtp(''); setPassword(''); setConfirmPassword(''); }}
                  className="w-full text-sm text-gray-400 hover:text-gray-300 py-2"
                >
                  ← Change email
                </button>
              </form>
            )}

            {/* Footer links */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-gray-400 text-sm">
                Remember your password?{' '}
                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">Back to Login</Link>
              </p>
              <p className="text-gray-400 text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium">Sign Up</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: decorative ── */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative z-10 text-center px-8">
          <h2 className="text-4xl font-bold text-white mb-4">Reset Your Password</h2>
          <p className="text-gray-300 text-lg mb-8">
            We&apos;ll send a one-time code to your email.<br/>No links, instant verification.
          </p>
          <div className="space-y-4 text-left max-w-sm">
            {[
              { title: 'No broken links', desc: 'OTP code sent directly to your inbox' },
              { title: 'Expires in 5 min', desc: 'Code is short-lived for your security' },
              { title: 'Instant reset', desc: 'Set your new password right here, right now' },
            ].map(({ title, desc }) => (
              <div key={title} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mt-1">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">{title}</h3>
                  <p className="text-gray-400 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
