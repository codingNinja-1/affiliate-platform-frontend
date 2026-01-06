'use client';

import { useSyncExternalStore } from 'react';
import Sidebar from './Sidebar';
import AdminSidebar from './AdminSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

interface AuthData {
  isAuthenticated: boolean;
  userType: string;
}

// Cache snapshots to avoid infinite loop
const serverSnapshot: AuthData = { isAuthenticated: false, userType: 'customer' };
let cachedSnapshot: AuthData = serverSnapshot;
let cachedToken: string | null = null;
let cachedUserStr: string | null = null;

function getAuthSnapshot(): AuthData {
  if (typeof window === 'undefined') {
    return serverSnapshot;
  }

  const token = localStorage.getItem('auth_token');
  const userStr = localStorage.getItem('user');
  
  // Return cached snapshot if data hasn't changed
  if (token === cachedToken && userStr === cachedUserStr) {
    return cachedSnapshot;
  }

  // Update cache
  cachedToken = token;
  cachedUserStr = userStr;
  
  if (!token || !userStr) {
    cachedSnapshot = serverSnapshot;
    return cachedSnapshot;
  }

  try {
    const user = JSON.parse(userStr);
    cachedSnapshot = {
      isAuthenticated: true,
      userType: user.user_type || 'customer'
    };
    return cachedSnapshot;
  } catch (err) {
    console.error('Failed to parse user', err);
    cachedSnapshot = serverSnapshot;
    return cachedSnapshot;
  }
}

function getServerSnapshot(): AuthData {
  return serverSnapshot;
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export default function AppLayout({ children }: AppLayoutProps) {
  const authState = useSyncExternalStore(
    subscribe,
    getAuthSnapshot,
    getServerSnapshot
  );

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
