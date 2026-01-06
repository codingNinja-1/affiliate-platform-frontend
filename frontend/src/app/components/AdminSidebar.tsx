'use client';

import Link from 'next/link';

interface SidebarProps {
  userType?: string;
}

export default function AdminSidebar({ userType }: SidebarProps) {
  const isAdmin = userType?.toLowerCase() === 'admin' || userType?.toLowerCase() === 'superadmin';

  if (!isAdmin) {
    return null;
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-slate-700 bg-slate-900 p-4 text-white">
      <div className="mb-8">
        <Link href="/admin" className="flex items-center gap-2 text-2xl font-bold text-blue-400">
          <span>⚙️</span>
          Admin Panel
        </Link>
      </div>

      <nav className="space-y-2">
        <Link
          href="/admin"
          className="block rounded-lg px-4 py-2 hover:bg-slate-800 transition"
        >
          📊 Dashboard
        </Link>
        <Link
          href="/admin/users"
          className="block rounded-lg px-4 py-2 hover:bg-slate-800 transition"
        >
          👥 Users
        </Link>
        <Link
          href="/admin/products"
          className="block rounded-lg px-4 py-2 hover:bg-slate-800 transition"
        >
          📦 Products
        </Link>
        <Link
          href="/admin/transactions"
          className="block rounded-lg px-4 py-2 hover:bg-slate-800 transition"
        >
          💳 Transactions
        </Link>
        <Link
          href="/admin/withdrawals"
          className="block rounded-lg px-4 py-2 hover:bg-slate-800 transition"
        >
          💰 Withdrawals
        </Link>
        <Link
          href="/admin/vendors"
          className="block rounded-lg px-4 py-2 hover:bg-slate-800 transition"
        >
          🏪 Vendors
        </Link>
        <Link
          href="/admin/affiliates"
          className="block rounded-lg px-4 py-2 hover:bg-slate-800 transition"
        >
          🤝 Affiliates
        </Link>
      </nav>
    </aside>
  );
}
