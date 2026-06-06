'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Wallet, TrendingUp, ArrowDownLeft, DollarSign, ShoppingCart, MousePointerClick, Clock, AlertTriangle } from 'lucide-react';
import CurrencySelector from '../components/CurrencySelector';
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';
import { useVendorCurrencyConversion } from '@/hooks/useVendorCurrencyConversion';
import { useCurrency } from '@/context/CurrencyContext';

type User = {
  id: number;
  first_name?: string;
  last_name?: string;
  email: string;
  user_type?: string;
};

type DashboardSummary = {
  balance: number;
  totalEarnings: number;
  totalWithdrawn: number;
  pendingBalance: number;
  totalSales: number;
  totalClicks: number;
};

type Transaction = {
  id: number;
  transaction_ref: string;
  product_name: string;
  customer_name: string;
  amount: number;
  vendor_amount: number;
  created_at_human: string;
};

type Withdrawal = {
  id: number;
  withdrawal_ref: string;
  amount: number;
  status: string;
  created_at: string;
};

type Commission = {
  id: number;
  product_name: string;
  amount: number;
  status: string;
  transaction_ref: string;
  created_at_human: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'past_due' | 'suspended' | null>(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');

    if (!storedUser || !token) {
      window.location.href = '/login';
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Redirect admins to admin dashboard
      const userType = parsedUser?.user_type?.toLowerCase();
      if (userType === 'admin' || userType === 'superadmin') {
        window.location.href = '/admin';
        return;
      }

      // Check if non-admin users have set up bank details
      if (userType !== 'superadmin' && userType !== 'admin') {
        fetch('/api/settings/check-bank-details', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data.requires_setup) {
              window.location.href = '/settings';
            }
          })
          .catch((err) => {
            console.warn('Failed to check bank details', err);
          });

        // Fetch subscription status for vendors and affiliates
        if (userType === 'vendor' || userType === 'affiliate') {
          fetch('/api/subscriptions', {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success && data.data) {
                setSubscriptionStatus(data.data.status);
              }
            })
            .catch(() => {});
        }
      }
    } catch (err) {
      console.error('Failed to parse stored user', err);
    }

    const loadSummary = async () => {
      try {
        const parsedForType = JSON.parse(storedUser);
        const userTypeParam = parsedForType?.user_type?.toLowerCase() || 'vendor';
        const res = await fetch(`/api/dashboard/summary?user_type=${userTypeParam}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Unable to load dashboard data');
        }

        const data = await res.json();

        setSummary({
          balance: Number(data?.data?.balance ?? 0),
          totalEarnings: Number(data?.data?.total_earnings ?? 0),
          totalWithdrawn: Number(data?.data?.total_withdrawn ?? 0),
          pendingBalance: Number(data?.data?.pending_balance ?? 0),
          totalSales: Number(data?.data?.total_sales ?? 0),
          totalClicks: Number(data?.data?.total_clicks ?? 0),
        });
      } catch (err) {
        console.warn('Dashboard summary fallback', err);
        setError('Live dashboard data is unavailable. Showing placeholders.');
        // Fallback placeholders so the page is not empty
        setSummary({
          balance: 0,
          totalEarnings: 0,
          totalWithdrawn: 0,
          pendingBalance: 0,
          totalSales: 0,
          totalClicks: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const fullName = user?.first_name || user?.last_name
    ? `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim()
    : user?.email;

  return (
    <main className="bg-gray-50 dark:bg-gray-950 min-h-screen p-4 sm:p-6 md:p-8">
      <header className="mb-6 sm:mb-8">
        <p className="text-sm text-gray-500 dark:text-gray-400">{greeting},</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-0.5">{fullName ?? 'there'} 👋</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Here's what's happening with your account</p>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-400">
          {error}
        </div>
      )}

      {subscriptionStatus && subscriptionStatus !== 'active' && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-red-800 dark:text-red-300">
            <AlertTriangle size={16} className="flex-shrink-0" />
            <span>
              Your subscription has expired. Withdrawals{user?.user_type === 'vendor' ? ' and product management' : ''} are locked.
            </span>
          </div>
          <Link
            href="/subscriptions"
            className="flex-shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
          >
            Subscribe Now
          </Link>
        </div>
      )}

      <RoleSections userType={user?.user_type} summary={summary} loading={loading} />
    </main>
  );
}

function RoleSections({
  userType,
  summary,
  loading,
}: {
  userType?: string;
  summary: DashboardSummary | null;
  loading: boolean;
}) {
  const type = userType?.toLowerCase();
  const [refreshTrigger] = useState(0);
  const { currency: selectedCurrency } = useCurrency();

  const handleCurrencyChange = (_currency: string) => {
    // Currency is managed globally via CurrencyContext — no local state needed
  };

  const { amounts, loading: conversionLoading, formatAmount } = useCurrencyConversion(refreshTrigger, selectedCurrency);
  const { amounts: vendorAmounts, loading: vendorConversionLoading, formatAmount: vendorFormatAmount } = useVendorCurrencyConversion(refreshTrigger, selectedCurrency);

  if (type === 'vendor') {
    const displayBalance = vendorAmounts?.balance ?? summary?.balance ?? 0;
    const displayEarnings = vendorAmounts?.total_earnings ?? summary?.totalEarnings ?? 0;
    const displayWithdrawn = vendorAmounts?.total_withdrawn ?? summary?.totalWithdrawn ?? 0;
    const displayCurrency = vendorAmounts?.currency || selectedCurrency || 'NGN';
    const currencySymbol = displayCurrency === 'NGN' ? '₦' : 
                          displayCurrency === 'USD' ? '$' :
                          displayCurrency === 'GBP' ? '£' :
                          displayCurrency === 'EUR' ? '€' :
                          displayCurrency + ' ';

    return (
      <>
        <div className="mb-4 flex justify-between items-center flex-wrap gap-3">
          <CurrencySelector 
            onCurrencyChange={handleCurrencyChange}
            isVendor={true}
            showLabel={false}
          />
          <Link href="/withdrawals" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
            <Wallet size={18} />
            Withdraw
          </Link>
          {vendorAmounts?.original_currency && vendorAmounts.original_currency !== displayCurrency && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Conversion rate: 1 {vendorAmounts.original_currency} = {Number(vendorAmounts.conversion_rate).toFixed(6)} {displayCurrency}
            </p>
          )}
        </div>

        <StatsGrid
          items={[
            { title: 'Balance', value: displayBalance, prefix: currencySymbol, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
            { title: 'Total earnings', value: displayEarnings, prefix: currencySymbol, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/30' },
            { title: 'Total withdrawn', value: displayWithdrawn, prefix: currencySymbol, icon: ArrowDownLeft, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30' },
            { title: 'Total sales', value: summary?.totalSales ?? 0, icon: ShoppingCart, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/30' },
            { title: 'Pending payouts', value: vendorAmounts?.pending_balance ?? 0, prefix: currencySymbol, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' },
          ]}
          loading={loading || vendorConversionLoading}
        />

        <VendorSalesPayouts 
          formatAmount={vendorFormatAmount}
          currency={displayCurrency}
        />
      </>
    );
  }

  if (type === 'affiliate') {
    const displayBalance = amounts?.balance ?? summary?.balance ?? 0;
    const displayEarnings = amounts?.total_earnings ?? summary?.totalEarnings ?? 0;
    const displayWithdrawn = amounts?.total_withdrawn ?? summary?.totalWithdrawn ?? 0;
    const displayCurrency = amounts?.currency || selectedCurrency || 'NGN';
    const currencySymbol = displayCurrency === 'NGN' ? '₦' : 
                          displayCurrency === 'USD' ? '$' :
                          displayCurrency === 'GBP' ? '£' :
                          displayCurrency === 'EUR' ? '€' :
                          displayCurrency + ' ';

    return (
      <>
        <div className="mb-4 flex justify-between items-center flex-wrap gap-3">
          <CurrencySelector 
            onCurrencyChange={handleCurrencyChange}
            showLabel={false}
          />
          <Link href="/withdrawals" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
            <Wallet size={18} />
            Withdraw
          </Link>
          {amounts?.original_currency && amounts.original_currency !== displayCurrency && (
            <p className="text-xs text-gray-500">
              Conversion rate: 1 {amounts.original_currency} = {Number(amounts.conversion_rate).toFixed(6)} {displayCurrency}
            </p>
          )}
        </div>
        
        <StatsGrid
          items={[
            { title: 'Balance', value: displayBalance, prefix: currencySymbol, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
            { title: 'Pending balance', value: amounts?.pending_balance ?? 0, prefix: currencySymbol, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' },
            { title: 'Total earnings', value: displayEarnings, prefix: currencySymbol, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/30' },
            { title: 'Total withdrawn', value: displayWithdrawn, prefix: currencySymbol, icon: ArrowDownLeft, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30' },
            { title: 'Total sales', value: summary?.totalSales ?? 0, icon: ShoppingCart, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/30' },
            { title: 'Total clicks', value: summary?.totalClicks ?? 0, icon: MousePointerClick, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
          ]}
          loading={loading || conversionLoading}
        />

        <HotProducts currency={displayCurrency} formatAmount={formatAmount} />

        <AffiliatePerformance formatAmount={formatAmount} currency={displayCurrency} />
      </>
    );
  }

  // Superadmin / admin default
  return (
    <>
      <StatsGrid
        items={[
          { title: 'Platform balance', value: summary?.balance ?? 0, prefix: '₦', icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
          { title: 'Total payouts', value: summary?.totalWithdrawn ?? 0, prefix: '₦', icon: ArrowDownLeft, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30' },
          { title: 'Pending liabilities', value: summary?.pendingBalance ?? 0, prefix: '₦', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' },
          { title: 'Total sales', value: summary?.totalSales ?? 0, icon: ShoppingCart, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/30' },
          { title: 'Total clicks', value: summary?.totalClicks ?? 0, icon: MousePointerClick, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
        ]}
        loading={loading}
      />

      <Panels
        primaryTitle="Operations overview"
        primaryHint="Attach admin metrics: top vendors, top affiliates, dispute queue."
        actions={[
          { href: '/admin/users', label: 'Manage users' },
          { href: '/admin/payouts', label: 'Payout approvals' },
          { href: '/admin/reports', label: 'Reports & audits' },
        ]}
      />
    </>
  );
}

type StatItem = {
  title: string;
  value: number;
  prefix?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
};

function StatsGrid({ items, loading }: { items: StatItem[]; loading: boolean }) {
  return (
    <section className="mb-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <StatCard key={item.title} {...item} loading={loading} />
      ))}
    </section>
  );
}

function Panels({
  primaryTitle,
  primaryHint,
  actions,
}: {
  primaryTitle: string;
  primaryHint: string;
  actions: { href: string; label: string }[];
}) {
  return (
    <section className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-3">
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{primaryTitle}</h2>
          <span className="rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">Coming soon</span>
        </div>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{primaryHint}</p>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Quick actions</h2>
        <div className="flex flex-col gap-2">
          {actions.map((action) => (
            <Link
              key={action.href}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              href={action.href}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({
  title, value, prefix, icon: Icon, color, bg, loading,
}: StatItem & { loading?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md dark:hover:shadow-gray-900 transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-2.5 ${bg}`}>
          <Icon size={20} className={color} />
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      {loading ? (
        <div className="mt-2 h-8 w-32 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
      ) : (
        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          {prefix ?? ''}{value.toLocaleString()}
        </p>
      )}
    </div>
  );
}

function VendorSalesPayouts({ formatAmount, currency }: { formatAmount?: (amount: number, currency?: string) => string, currency?: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const fetchData = async () => {
      try {
        const [transRes, withdrawRes] = await Promise.all([
          fetch('/api/vendor/transactions?limit=5', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/vendor/withdrawals', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (transRes.ok) {
          const transData = await transRes.json();
          setTransactions(transData.data || []);
        }

        if (withdrawRes.ok) {
          const withdrawData = await withdrawRes.json();
          setWithdrawals((withdrawData.data || []).slice(0, 5));
        }
      } catch (error) {
        console.error('Failed to load sales data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {/* Recent Sales */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Sales</h2>
          <Link href="/products" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <ShoppingCart size={36} className="mb-3 opacity-30" />
            <p className="text-sm">No sales yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <TrendingUp size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{transaction.product_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {transaction.customer_name} · {transaction.created_at_human}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{formatAmount ? formatAmount(transaction.vendor_amount, currency) : transaction.vendor_amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">of {formatAmount ? formatAmount(transaction.amount, currency) : transaction.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdrawal Queue */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Withdrawals</h2>
          <Link href="/withdrawals" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
            Manage →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No withdrawal requests</p>
            <Link
              href="/withdrawals"
              className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Request payout
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="flex items-center justify-between rounded-lg px-2 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatAmount ? formatAmount(withdrawal.amount, currency) : withdrawal.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{withdrawal.withdrawal_ref}</p>
                </div>
                <StatusBadge status={withdrawal.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === 'pending'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      : status === 'approved' || status === 'paid'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${styles}`}>
      {status}
    </span>
  );
}

function HotProducts({ currency: _currency, formatAmount: _formatAmount }: { currency?: string, formatAmount?: (amount: number, currency?: string) => string } = {}) {
  const { formatAmount: ctxFormat } = useCurrency();
  // CurrencyContext.formatAmount handles NGN→selected currency conversion automatically
  const fmt = (amount: number) => ctxFormat(amount);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const fetchHotProducts = async () => {
      try {
        const res = await fetch('/api/affiliate/products?limit=6&sort=commission_desc', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setProducts((data.data || []).slice(0, 6));
        }
      } catch (error) {
        console.error('Failed to load hot products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHotProducts();
  }, []);

  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">🔥 Hot Products</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Highest commission products</p>
        </div>
        <Link href="/products" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
          Browse all →
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-12">No products available yet</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all"
            >
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 p-4 h-28 flex items-center justify-center">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-10 h-10 bg-blue-200 dark:bg-blue-800 rounded-lg" />
                )}
              </div>
              <div className="p-4 bg-white dark:bg-gray-900">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Commission</p>
                <p className="text-base font-bold text-green-600 dark:text-green-400 mt-0.5">
                  {fmt(product.commission_amount || product.commission || 0)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function AffiliatePerformance({ formatAmount, currency }: { formatAmount?: (amount: number, currency?: string) => string, currency?: string } = {}) {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const fetchData = async () => {
      try {
        const [commRes, withdrawRes] = await Promise.all([
          fetch('/api/affiliate/commissions?limit=5', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/affiliate/withdrawals', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (commRes.ok) {
          const commData = await commRes.json();
          setCommissions(commData.data || []);
        }

        if (withdrawRes.ok) {
          const withdrawData = await withdrawRes.json();
          setWithdrawals((withdrawData.data || []).slice(0, 5));
        }
      } catch (error) {
        console.error('Failed to load affiliate data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {/* Recent Commissions */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Commissions</h2>
          <Link href="/analytics" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
            View analytics →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : commissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <DollarSign size={36} className="mb-3 opacity-30" />
            <p className="text-sm">No commissions yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {commissions.map((commission) => (
              <div
                key={commission.id}
                className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <DollarSign size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{commission.product_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {commission.transaction_ref} · {commission.created_at_human}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{formatAmount ? formatAmount(commission.amount, currency) : commission.amount.toLocaleString()}</p>
                  <StatusBadge status={commission.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdrawal Queue */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Withdrawals</h2>
          <Link href="/withdrawals" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
            Manage →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No withdrawal requests</p>
            <Link
              href="/withdrawals"
              className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Request withdrawal
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="flex items-center justify-between rounded-lg px-2 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatAmount ? formatAmount(withdrawal.amount, currency) : withdrawal.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{withdrawal.withdrawal_ref}</p>
                </div>
                <StatusBadge status={withdrawal.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
