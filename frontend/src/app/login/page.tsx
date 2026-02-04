'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement | null, options: { theme: string; size: string; width?: string }) => void;
        };
      };
    };
  }
}

const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:8000/api`;
  }

  return 'http://127.0.0.1:8000/api';
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      const user = localStorage.getItem('user');
      if (token && user) {
        window.location.href = '/dashboard';
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (!window.google || !window.google.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          await handleGoogleLogin(response.credential);
        },
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        {
          theme: 'outline',
          size: 'large',
          width: '240',
        }
      );
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const apiBase = getApiBase();

    try {
      // Use dev server proxy to avoid CORS/firewall when on mobile
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, remember: rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed');
        return;
      }

      // Store token and user (flatten referral_code for affiliates)
      const userPayload = {
        ...data.data.user,
        referral_code: data.data.user?.affiliate?.referral_code || data.data.user?.referral_code,
      };
      localStorage.setItem('auth_token', data.data.access_token);
      localStorage.setItem('user', JSON.stringify(userPayload));

      // Check if user needs to set up bank details (exclude superadmin/admin)
      const userType = data.data.user.user_type?.toLowerCase();
      if (userType !== 'superadmin' && userType !== 'admin') {
        try {
          // Use dev server proxy for bank details check as well
          const checkRes = await fetch(`/api/settings/check-bank-details`, {
            headers: {
              Authorization: `Bearer ${data.data.access_token}`,
            },
          });

          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.success && checkData.data.requires_setup) {
              window.location.href = '/setup-bank-details';
              return;
            }
          }
        } catch (err) {
          console.warn('Failed to check bank details', err);
        }
      }

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credential: string) => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Google sign-in failed');
        return;
      }

      const userPayload = {
        ...data.data.user,
        referral_code: data.data.user?.affiliate?.referral_code || data.data.user?.referral_code,
      };
      localStorage.setItem('auth_token', data.data.access_token);
      localStorage.setItem('user', JSON.stringify(userPayload));

      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Google sign-in failed', err);
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0b14]">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full">
            {/* Diagonal lines pattern */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="diagonal-lines" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M-10,10 l20,-20 M0,40 l40,-40 M30,50 l20,-20" stroke="#ffffff" strokeWidth="1" fill="none"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#diagonal-lines)" />
            </svg>
          </div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center px-4 sm:px-8 py-4 sm:py-6 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-xl bg-[#6366f1] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-6 sm:h-6">
                <path d="M13 3L4 14H12L11 21L20 10H12L13 3Z" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-white text-base sm:text-xl font-semibold">AffiliateHub</span>
          </div>
          <Link href="/" className="hidden sm:flex items-center gap-2 text-gray-400 hover:text-white transition text-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Go Back</span>
          </Link>
        </div>

        {/* Login Form Container */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-6 sm:py-0 relative z-10">
          <div className="w-full max-w-md">
            <div className="bg-[#12131f] border border-[#1e2035] rounded-2xl p-6 sm:p-8 shadow-2xl">
              <h1 className="text-xl sm:text-2xl font-semibold text-white text-center mb-2">
                Sign In to Your AffiliateHub Account
              </h1>
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4 sm:mb-6 text-xs sm:text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 mt-4 sm:mt-6">
                <div>
                  <label className="block text-gray-400 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#0a0b14] border border-[#1e2035] rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1 sm:mb-2 flex-col sm:flex-row gap-1 sm:gap-0">
                    <label className="block text-gray-400 text-xs sm:text-sm font-medium">
                      Password
                    </label>
                    <Link href="/forgot-password" className="text-[#6366f1] text-xs sm:text-sm hover:text-[#818cf8] transition">
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#0a0b14] border border-[#1e2035] rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3 h-3 sm:w-4 sm:h-4 bg-[#0a0b14] border-[#1e2035] rounded text-[#6366f1] focus:ring-[#6366f1] focus:ring-offset-0"
                  />
                  <label htmlFor="remember" className="ml-2 text-gray-400 text-xs sm:text-sm">
                    Remember me
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#6366f1] hover:bg-[#5558e3] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 sm:py-3 rounded-lg transition flex items-center justify-center text-sm sm:text-base"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>

              {/* Social Login Buttons */}
              <div className="flex gap-2 sm:gap-4 mt-4 sm:mt-6 flex-col sm:flex-row">
                <div
                  id="google-signin-button"
                  className="flex-1 flex items-center justify-center min-h-[44px]"
                />
              </div>

              <p className="text-gray-400 text-center mt-4 sm:mt-6 text-xs sm:text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-[#6366f1] hover:text-[#818cf8] transition">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-4 sm:px-8 py-4 sm:py-6 relative z-10">
          <span className="text-gray-500 text-xs sm:text-sm">© 2025 AffiliateHub </span>
          <button className="hidden sm:flex items-center gap-2 text-gray-400 hover:text-white transition text-xs sm:text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>ENG</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Right Side - Dashboard Preview */}
      <div className="hidden lg:flex w-1/2 bg-linear-to-br from-[#0f1029] via-[#131538] to-[#0a0b14] items-center justify-center p-12 relative overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-[#6366f1]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-[#818cf8]/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold text-white mb-4 text-center">
            Get better with AffiliateHub
          </h2>
          <p className="text-gray-400 text-center mb-10">
            Take your affiliate marketing to the next level with AffiliateHub—optimize tracking, boost efficiency, and maximize your earnings effortlessly.
          </p>

          {/* Dashboard Preview Card */}
          <div className="bg-[#12131f]/80 backdrop-blur-xl border border-[#1e2035] rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#1e2035] flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 20V10M12 20V4M6 20v-6" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-white font-medium">Performance Overview</span>
              </div>
              <button className="flex items-center gap-2 bg-[#1e2035] text-gray-300 px-3 py-1.5 rounded-lg text-sm">
                Last Month
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-[#0a0b14] rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Revenue</p>
                <p className="text-2xl font-bold text-white">$83,302</p>
                <span className="inline-flex items-center gap-1 text-green-400 text-xs mt-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  +8%
                </span>
              </div>
              <div className="bg-[#0a0b14] rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-white">$6,000</p>
                <span className="inline-flex items-center gap-1 text-green-400 text-xs mt-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  +5%
                </span>
              </div>
              <div className="bg-[#0a0b14] rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Total Clicks</p>
                <p className="text-2xl font-bold text-white">$24,000</p>
                <span className="inline-flex items-center gap-1 text-red-400 text-xs mt-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  -3%
                </span>
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="h-32 bg-linear-to-r from-[#6366f1]/5 via-[#6366f1]/10 to-[#6366f1]/5 rounded-xl flex items-end justify-around px-4 pb-4">
              <div className="w-8 h-8 bg-[#6366f1]/30 rounded" />
              <div className="w-8 h-12 bg-[#6366f1]/40 rounded" />
              <div className="w-8 h-16 bg-[#6366f1]/50 rounded" />
              <div className="w-8 h-10 bg-[#6366f1]/40 rounded" />
              <div className="w-8 h-20 bg-[#6366f1]/60 rounded" />
              <div className="w-8 h-24 bg-[#6366f1] rounded" />
              <div className="w-8 h-16 bg-[#6366f1]/50 rounded" />
            </div>

            {/* Month Labels */}
            <div className="flex justify-around mt-2 text-gray-500 text-xs">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-6">
            <div className="w-8 h-2 bg-[#6366f1] rounded-full" />
            <div className="w-2 h-2 bg-[#1e2035] rounded-full" />
            <div className="w-2 h-2 bg-[#1e2035] rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
