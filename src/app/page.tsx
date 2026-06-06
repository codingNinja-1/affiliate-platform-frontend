'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Menu, X, ArrowRight, CheckCircle, Star,
  TrendingUp, Users, DollarSign, Shield,
  Zap, BarChart3,
} from 'lucide-react';

/* ─── Floating stat cards inside the hero ──────────────────────────────── */
function SaleCard() {
  return (
    <div className="absolute -left-28 top-20 w-40 rounded-2xl bg-white shadow-xl border border-gray-100 p-4">
      <p className="text-[10px] font-bold text-green-600 uppercase tracking-wide">New Sale!</p>
      <p className="text-sm font-semibold text-gray-800 mt-1">Jose Mourinho</p>
      <p className="text-[10px] text-gray-400">Today</p>
      <p className="text-base font-extrabold text-gray-900 mt-1">560 USD</p>
    </div>
  );
}

function RevenueCard() {
  const bars = [3, 5, 4, 7, 6, 8, 9];
  return (
    <div className="absolute -right-24 top-10 w-36 rounded-2xl bg-white shadow-xl border border-gray-100 p-4">
      <p className="text-[10px] text-gray-400 font-medium">Monthly Revenue</p>
      <p className="text-base font-extrabold text-gray-900">$4,721</p>
      <div className="mt-2 flex items-end gap-0.5 h-10">
        {bars.map((h, i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm ${i === bars.length - 1 ? 'bg-blue-500' : 'bg-blue-200'}`}
            style={{ height: `${h * 11}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function TransactionsCard() {
  const colors = ['#f97316', '#3b82f6', '#10b981', '#a855f7'];
  return (
    <div className="absolute -right-24 bottom-28 w-40 rounded-2xl bg-white shadow-xl border border-gray-100 p-4">
      <p className="text-[10px] text-gray-400">Transactions</p>
      <p className="text-2xl font-extrabold text-gray-900">37</p>
      <p className="text-[10px] text-gray-400">This month</p>
      <div className="mt-2 flex -space-x-1.5">
        {colors.map((c) => (
          <div key={c} className="h-6 w-6 rounded-full border-2 border-white" style={{ backgroundColor: c }} />
        ))}
        <div className="h-6 w-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center">
          <span className="text-[8px] font-bold text-gray-500">+7</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Phone mockup ──────────────────────────────────────────────────────── */
function PhoneMockup() {
  const stats = [
    { label: 'TOTAL EARNINGS', value: '$1,003.10', emoji: '💰', accent: false },
    { label: "TODAY'S EARNINGS", value: '$43.08', emoji: '📈', accent: false },
    { label: "TODAY'S SALES", value: '6', emoji: '🛒', accent: false },
    { label: 'WALLET BALANCE', value: '$54.74', emoji: '💳', accent: true },
  ];

  return (
    <div className="relative mx-auto w-64 sm:w-72">
      {/* Phone shell */}
      <div className="relative rounded-[40px] bg-gray-900 p-2 shadow-2xl ring-1 ring-white/10">
        {/* Notch */}
        <div className="absolute top-3 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-gray-900" />
        {/* Screen */}
        <div className="overflow-hidden rounded-[32px] bg-white" style={{ height: 540 }}>
          {/* Status bar */}
          <div className="flex items-center justify-between bg-gray-900 px-5 py-2">
            <span className="text-[10px] text-white">9:41</span>
            <div className="flex items-center gap-1">
              <div className="h-2 w-4 rounded-sm border border-white/60">
                <div className="h-full w-3/4 rounded-sm bg-white/80" />
              </div>
            </div>
          </div>
          {/* App top bar */}
          <div className="bg-gray-900 px-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-600">
                  <span className="text-[10px] font-extrabold text-white">A</span>
                </div>
                <span className="text-[11px] font-bold text-white">AffiliateHub</span>
              </div>
              <div className="h-7 w-7 rounded-full bg-gray-600" />
            </div>
            {/* Welcome banner */}
            <div className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-2.5">
              <p className="text-[11px] font-bold text-yellow-300">👋 Hello, Aruajii</p>
              <p className="text-[10px] text-blue-100 mt-0.5">Welcome to your affiliate dashboard</p>
            </div>
          </div>
          {/* Stats list */}
          <div className="bg-gray-50 px-3 py-3 space-y-2.5">
            {stats.map((s) => (
              <div
                key={s.label}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 shadow-sm border ${
                  s.accent
                    ? 'bg-amber-50 border-amber-100'
                    : 'bg-white border-gray-100'
                }`}
              >
                <div>
                  <p className="text-[8px] font-bold tracking-widest text-gray-400 uppercase">{s.label}</p>
                  <p className={`mt-0.5 text-sm font-extrabold ${s.accent ? 'text-amber-600' : 'text-gray-900'}`}>
                    {s.value}
                  </p>
                </div>
                <span className="text-lg">{s.emoji}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating cards */}
      <SaleCard />
      <RevenueCard />
      <TransactionsCard />
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* ── NAVBAR ── */}
      <nav
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
              <span className="font-extrabold text-white">A</span>
            </div>
            <span className="text-lg font-extrabold text-gray-900">AffiliateHub</span>
          </div>

          {/* Desktop links */}
          <div className="hidden items-center gap-8 md:flex">
            {['#affiliates', '#vendors', '#how-it-works', '#features'].map((href) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 capitalize"
              >
                {href.replace('#', '').replace(/-/g, ' ')}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className="text-sm font-semibold text-gray-700 transition-colors hover:text-gray-900 px-3 py-2">
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
            >
              Create Account
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="border-t border-gray-100 bg-white px-4 py-4 space-y-1 md:hidden">
            {[
              { href: '#affiliates', label: 'Affiliates' },
              { href: '#vendors', label: 'Vendors' },
              { href: '#how-it-works', label: 'How it works' },
              { href: '#features', label: 'Features' },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {label}
              </a>
            ))}
            <div className="flex flex-col gap-2 border-t border-gray-100 pt-3 mt-2">
              <Link href="/login" className="rounded-lg border border-gray-300 px-4 py-2.5 text-center text-sm font-semibold text-gray-700">
                Sign In
              </Link>
              <Link href="/register" className="rounded-lg bg-gray-900 px-4 py-2.5 text-center text-sm font-semibold text-white">
                Create Account
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative flex min-h-screen items-center overflow-hidden bg-white pt-16">
        {/* Glow blob */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <div
            className="h-[700px] w-[700px] rounded-full blur-3xl"
            style={{
              background:
                'radial-gradient(circle, rgba(254,240,138,0.55) 0%, rgba(187,247,208,0.35) 40%, transparent 70%)',
            }}
          />
        </div>

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:px-8">
          {/* Left — headline + CTA */}
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700">
              🚀 Africa&apos;s leading affiliate platform
            </div>
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-6xl lg:text-[64px]">
              Earn more.
              <br />
              Scale faster.
              <br />
              <span className="text-blue-600">AffiliateHub.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-gray-500 lg:mx-0">
              Connect vendors with top-performing affiliates. Track sales in real-time,
              automate payouts, and grow your digital product business — all in one place.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-7 py-3.5 text-base font-bold text-white transition-colors hover:bg-gray-700"
              >
                Start Earning <ArrowRight size={16} />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-7 py-3.5 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Right — phone mockup */}
          <div className="flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="border-y border-gray-100 bg-gray-50 py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-4 text-center md:grid-cols-4">
          {[
            { value: '2,400+', label: 'Affiliates' },
            { value: '300+', label: 'Vendors' },
            { value: '$1.2M+', label: 'Commissions Paid' },
            { value: '15,000+', label: 'Sales Tracked' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-extrabold text-gray-900">{value}</p>
              <p className="mt-1 text-sm font-medium text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-white py-28">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-14 text-center">
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-blue-600">Simple process</p>
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Start in 3 easy steps</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                icon: Users,
                title: 'Create an account',
                desc: 'Sign up as an affiliate or vendor in minutes. Approval is fast.',
                bg: 'bg-blue-50',
                iconColor: 'text-blue-600',
              },
              {
                step: '02',
                icon: TrendingUp,
                title: 'Promote & sell',
                desc: 'Affiliates share unique links. Vendors list their digital products.',
                bg: 'bg-violet-50',
                iconColor: 'text-violet-600',
              },
              {
                step: '03',
                icon: DollarSign,
                title: 'Get paid',
                desc: 'Commissions credit instantly to your wallet. Withdraw anytime.',
                bg: 'bg-green-50',
                iconColor: 'text-green-600',
              },
            ].map(({ step, icon: Icon, title, desc, bg, iconColor }) => (
              <div key={step} className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
                <span className="pointer-events-none absolute right-5 top-4 select-none text-6xl font-black text-gray-100">
                  {step}
                </span>
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
                  <Icon size={22} className={iconColor} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR AFFILIATES ── */}
      <section
        id="affiliates"
        className="py-28"
        style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 60%)' }}
      >
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-16 px-4 md:grid-cols-2">
          {/* Text */}
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-blue-600">For Affiliates</p>
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Promote great products.
              <br />
              Earn real commissions.
            </h2>
            <p className="mt-4 text-gray-500">
              Browse hundreds of digital products from verified vendors, grab your unique referral
              link, and earn a commission every time someone buys through you.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Browse & join vendor programmes instantly',
                'Real-time commission and click tracking',
                'Leaderboard & full performance analytics',
                'Withdraw to any African bank account',
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                  <CheckCircle size={16} className="shrink-0 text-green-500" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
            >
              Join as Affiliate <ArrowRight size={14} />
            </Link>
          </div>
          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { emoji: '🔗', title: 'Unique Links', desc: 'Per-product referral links with click tracking' },
              { emoji: '💸', title: 'Auto Payouts', desc: 'Commissions hit your wallet the moment a sale closes' },
              { emoji: '📊', title: 'Analytics', desc: 'Clicks, conversions & earnings in one dashboard' },
              { emoji: '🏆', title: 'Leaderboard', desc: 'Compete with top affiliates platform-wide' },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="text-2xl">{emoji}</span>
                <h4 className="mt-2 text-sm font-bold text-gray-900">{title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR VENDORS ── */}
      <section id="vendors" className="bg-white py-28">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-16 px-4 md:grid-cols-2">
          {/* Feature grid (left on desktop) */}
          <div className="order-2 grid grid-cols-2 gap-4 md:order-1">
            {[
              { emoji: '📦', title: 'Product Listings', desc: 'Upload digital products with custom commission rates' },
              { emoji: '🤝', title: 'Affiliate Network', desc: 'Thousands of affiliates ready to promote you' },
              { emoji: '🔒', title: 'Fraud Protection', desc: 'Duplicate detection & webhook signature verification' },
              { emoji: '💰', title: 'Revenue Reports', desc: 'Full transaction history with conversion data' },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
                <span className="text-2xl">{emoji}</span>
                <h4 className="mt-2 text-sm font-bold text-gray-900">{title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
          {/* Text (right on desktop) */}
          <div className="order-1 md:order-2">
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-violet-600">For Vendors</p>
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Scale your product
              <br />
              with an army of affiliates.
            </h2>
            <p className="mt-4 text-gray-500">
              List your digital product, set your commission rate, and let affiliates drive
              sales while you focus on building a great product.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Set custom commission rates per product',
                'Paystack-powered secure checkout',
                'Automated commission splitting',
                'Full withdrawal control and reports',
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                  <CheckCircle size={16} className="shrink-0 text-green-500" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-700"
            >
              Start selling <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES / WHY AFFILIATEHUB ── */}
      <section id="features" className="bg-gray-950 py-28 text-white">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-14 text-center">
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-blue-400">
              Why AffiliateHub
            </p>
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              Built for trust, speed, and scale
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Shield,
                color: 'text-green-400',
                title: 'OTP Security',
                desc: 'Every sensitive action — profile updates, bank changes, password resets — requires OTP verification.',
              },
              {
                icon: Zap,
                color: 'text-yellow-400',
                title: 'Real-time Tracking',
                desc: 'Affiliate clicks and sales are tracked the moment they happen, with zero data lag.',
              },
              {
                icon: BarChart3,
                color: 'text-blue-400',
                title: 'Analytics Dashboard',
                desc: 'Conversion rates, earnings graphs, and leaderboards give full visibility into performance.',
              },
              {
                icon: DollarSign,
                color: 'text-emerald-400',
                title: 'Instant Payouts',
                desc: 'Commissions credit to wallets immediately. Withdraw directly to any African bank.',
              },
              {
                icon: Users,
                color: 'text-violet-400',
                title: 'Affiliate Discovery',
                desc: 'Vendors see which affiliates drive the most conversions and can build direct relationships.',
              },
              {
                icon: TrendingUp,
                color: 'text-orange-400',
                title: 'Subscription Access',
                desc: 'Simple annual subscription unlocks all features — no hidden per-transaction platform fees.',
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-800 bg-gray-900 p-6 transition-colors hover:border-gray-700"
              >
                <Icon size={24} className={color} />
                <h3 className="mt-3 font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-white py-28">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-14 text-center">
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-blue-600">Testimonials</p>
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Loved by affiliates and vendors
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: 'Ngozi A.',
                role: 'Affiliate · Lagos',
                text: 'I made my first ₦50,000 commission in the first week. The dashboard is clean and payouts are instant.',
              },
              {
                name: 'Emeka O.',
                role: 'Vendor · Abuja',
                text: 'My sales tripled after listing on AffiliateHub. The affiliate network is incredible for digital products.',
              },
              {
                name: 'Aisha M.',
                role: 'Affiliate · Accra',
                text: 'The OTP security gives me peace of mind. I love tracking every click and conversion in real time.',
              },
            ].map(({ name, role, text }) => (
              <div
                key={name}
                className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-7 shadow-sm"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="flex-1 text-sm italic leading-relaxed text-gray-600">&ldquo;{text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-extrabold text-blue-600">
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{name}</p>
                    <p className="text-xs text-gray-400">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="bg-blue-600 py-24">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to start earning?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Join thousands of affiliates and vendors already growing with AffiliateHub.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="rounded-full bg-white px-9 py-3.5 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-50"
            >
              Create Free Account
            </Link>
            <Link
              href="/login"
              className="rounded-full border-2 border-white/40 px-9 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 py-12 text-gray-400">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
                <span className="text-xs font-extrabold text-white">A</span>
              </div>
              <span className="font-bold text-white">AffiliateHub</span>
            </div>
            {/* Nav */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a href="#affiliates" className="transition-colors hover:text-white">Affiliates</a>
              <a href="#vendors" className="transition-colors hover:text-white">Vendors</a>
              <a href="#how-it-works" className="transition-colors hover:text-white">How it works</a>
              <a href="#features" className="transition-colors hover:text-white">Features</a>
              <Link href="/login" className="transition-colors hover:text-white">Sign In</Link>
            </div>
            {/* Copyright */}
            <p className="text-xs text-gray-600">© 2026 AffiliateHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
