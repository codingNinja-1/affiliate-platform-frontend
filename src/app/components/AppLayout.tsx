'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import AdminSidebar from './AdminSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [authState] = useState(() => {
    if (typeof window === 'undefined') {
      return { isAuthenticated: false, userType: 'customer', isClient: false };
    }

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    let authenticated = false;
    let type = 'customer';

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        type = user.user_type || 'customer';
        authenticated = true;
      } catch (err) {
        console.error('Failed to parse user', err);
      }
    }

    return { isAuthenticated: authenticated, userType: type, isClient: true };
  });

  // Prevent rendering sidebar on server; only show after hydration
  if (!authState.isClient) {
    return <main className="w-full">{children}</main>;
  }

  if (!authState.isAuthenticated) {
    return <main className="w-full">{children}</main>;
  }

  // Admin users get admin sidebar
  if (authState.userType?.toLowerCase() === 'admin' || authState.userType?.toLowerCase() === 'superadmin') {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar userType={authState.userType} />
        <main className="ml-64 flex-1">
          {children}
        </main>
      </div>
    );
  }

  // Regular users get regular sidebar
  return (
    <div className="flex min-h-screen">
      <Sidebar userType={authState.userType} />
      <main className="ml-64 flex-1">
        {children}
      </main>
    </div>
  );
}
