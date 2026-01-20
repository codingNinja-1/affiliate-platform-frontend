'use client';

import Link from 'next/link';

export default function AdminSidebar() {
  // Don't conditionally return null - let AppLayout handle the conditional rendering
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-8">
        <Link href="/admin" className="flex items-center gap-2 text-2xl font-bold text-blue-600">
          <span>⚙️</span>
          Admin Panel
        </Link>
      </div>

      <nav className="space-y-2">
        <Link
          href="/admin"
          className="block rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
        >
          📊 Dashboard
        </Link>
        <Link
          href="/admin/users"
          className="block rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
        >
          👥 Users
        </Link>
        <Link
          href="/admin/products"
          className="block rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
        >
          📦 Products
        </Link>
        <Link
          href="/admin/transactions"
          className="block rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
        >
          💳 Transactions
        </Link>
        <Link
          href="/admin/withdrawals"
          className="block rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
        >
          💰 Withdrawals
        </Link>
        <Link
          href="/admin/vendors"
          className="block rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
        >
          🏪 Vendors
        </Link>
        <Link
          href="/admin/affiliates"
          className="block rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
        >
          🤝 Affiliates
        </Link>
      </nav>
    </aside>
  );
}
