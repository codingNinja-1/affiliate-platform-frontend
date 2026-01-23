'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CurrencySelector from '../components/CurrencySelector';
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';
import { useVendorCurrencyConversion } from '@/hooks/useVendorCurrencyConversion';

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
      }
    } catch (err) {
      console.error('Failed to parse stored user', err);
    }

    const loadSummary = async () => {
      try {
        const res = await fetch('/api/dashboard/summary', {
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
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <header className="mb-4 sm:mb-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <p className="text-xs sm:text-sm text-gray-600">{greeting}, {fullName ?? 'there'}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-500">Account overview and quick actions</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link
              href="/profile"
              className="rounded-lg border border-gray-200 bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              Profile
            </Link>
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-4 sm:mb-6 rounded-lg border border-amber-200 bg-amber-50 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-amber-800">
          {error}
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const handleCurrencyChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const { amounts, loading: conversionLoading, formatAmount } = useCurrencyConversion(refreshTrigger);
  const { amounts: vendorAmounts, loading: vendorConversionLoading, formatAmount: vendorFormatAmount } = useVendorCurrencyConversion(refreshTrigger);

  if (type === 'vendor') {
    // Use converted amounts if available, otherwise fall back to summary
    const displayBalance = vendorAmounts?.balance ?? summary?.balance ?? 0;
    const displayEarnings = vendorAmounts?.total_earnings ?? summary?.totalEarnings ?? 0;
    const displayWithdrawn = vendorAmounts?.total_withdrawn ?? summary?.totalWithdrawn ?? 0;
    const displayCurrency = vendorAmounts?.currency || 'NGN';
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
          {vendorAmounts?.original_currency && vendorAmounts.original_currency !== displayCurrency && (
            <p className="text-xs text-gray-500">
              Conversion rate: 1 {vendorAmounts.original_currency} = {vendorAmounts.conversion_rate?.toFixed(6)} {displayCurrency}
            </p>
          )}
        </div>

        <StatsGrid
          items={[ 
            { title: 'Balance', value: displayBalance, prefix: currencySymbol },
            { title: 'Total earnings', value: displayEarnings, prefix: currencySymbol },
            { title: 'Total withdrawn', value: displayWithdrawn, prefix: currencySymbol },
            { title: 'Total sales', value: summary?.totalSales ?? 0 },
            { title: 'Pending payouts', value: vendorAmounts?.pending_balance ?? 0, prefix: currencySymbol },
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
    // Use converted amounts if available, otherwise fall back to summary
    const displayBalance = amounts?.balance ?? summary?.balance ?? 0;
    const displayEarnings = amounts?.total_earnings ?? summary?.totalEarnings ?? 0;
    const displayWithdrawn = amounts?.total_withdrawn ?? summary?.totalWithdrawn ?? 0;
    const displayCurrency = amounts?.currency || 'NGN';
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
          {amounts?.original_currency && amounts.original_currency !== displayCurrency && (
            <p className="text-xs text-gray-500">
              Conversion rate: 1 {amounts.original_currency} = {amounts.conversion_rate?.toFixed(6)} {displayCurrency}
            </p>
          )}
        </div>
        
        <StatsGrid
          items={[ 
            { title: 'Balance', value: displayBalance, prefix: currencySymbol },
            { title: 'Pending balance', value: amounts?.pending_balance ?? 0, prefix: currencySymbol },
            { title: 'Total earnings', value: displayEarnings, prefix: currencySymbol },
            { title: 'Total withdrawn', value: displayWithdrawn, prefix: currencySymbol },
            { title: 'Total sales', value: summary?.totalSales ?? 0 },
            { title: 'Total clicks', value: summary?.totalClicks ?? 0 },
          ]}
          loading={loading || conversionLoading}
        />

        <AffiliatePerformance formatAmount={formatAmount} currency={displayCurrency} />
      </>
    );
  }

  // Superadmin / admin default
  return (
    <>
      <StatsGrid
        items={[
          { title: 'Platform balance', value: summary?.balance ?? 0, prefix: '₦' },
          { title: 'Total payouts', value: summary?.totalWithdrawn ?? 0, prefix: '₦' },
          { title: 'Pending liabilities', value: summary?.pendingBalance ?? 0, prefix: '₦' },
          { title: 'Total sales', value: summary?.totalSales ?? 0 },
          { title: 'Total clicks', value: summary?.totalClicks ?? 0 },
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

function StatsGrid({
  items,
  loading,
}: {
  items: { title: string; value: number; prefix?: string }[];
  loading: boolean;
}) {
  return (
    <section className="mb-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <StatCard
          key={item.title}
          title={item.title}
          value={item.value}
          prefix={item.prefix}
          loading={loading}
        />
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
      <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{primaryTitle}</h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">Coming soon</span>
        </div>
        <p className="mt-3 text-sm text-gray-600">{primaryHint}</p>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick actions</h2>
        <div className="flex flex-col gap-2">
          {actions.map((action) => (
            <Link
              key={action.href}
              className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
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
  title,
  value,
  prefix,
  loading,
}: {
  title: string;
  value: number;
  prefix?: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
      {loading ? (
        <div className="mt-2 sm:mt-3 h-7 sm:h-8 w-24 sm:w-32 animate-pulse rounded bg-gray-100" />
      ) : (
        <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-gray-900">
          {prefix ?? ''}
          {value.toLocaleString()}
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
      <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Sales</h2>
          <Link href="/products" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-8">No sales yet</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{transaction.product_name}</p>
                  <p className="text-xs text-gray-500">
                    {transaction.customer_name} • {transaction.created_at_human}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatAmount ? formatAmount(transaction.vendor_amount, currency) : transaction.vendor_amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">from {formatAmount ? formatAmount(transaction.amount, currency) : transaction.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdrawal Queue */}
      <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Withdrawals</h2>
          <Link href="/withdrawals" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Manage →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-3">No withdrawal requests</p>
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
                className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{formatAmount ? formatAmount(withdrawal.amount, currency) : withdrawal.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{withdrawal.withdrawal_ref}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    withdrawal.status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : withdrawal.status === 'approved' || withdrawal.status === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {withdrawal.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
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
      <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Commissions</h2>
          <Link href="/analytics" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View analytics →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ) : commissions.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-8">No commissions yet</p>
        ) : (
          <div className="space-y-3">
            {commissions.map((commission) => (
              <div
                key={commission.id}
                className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{commission.product_name}</p>
                  <p className="text-xs text-gray-500">
                    {commission.transaction_ref} • {commission.created_at_human}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatAmount ? formatAmount(commission.amount, currency) : commission.amount.toLocaleString()}</p>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      commission.status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : commission.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {commission.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdrawal Queue */}
      <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Withdrawals</h2>
          <Link href="/withdrawals" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Manage →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-3">No withdrawal requests</p>
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
                className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{formatAmount ? formatAmount(withdrawal.amount, currency) : withdrawal.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{withdrawal.withdrawal_ref}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    withdrawal.status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : withdrawal.status === 'approved' || withdrawal.status === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {withdrawal.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
