'use client';

import { useState, useLayoutEffect } from 'react';
import Sidebar from './Sidebar';
import AdminSidebar from './AdminSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

interface AppState {
  isAuthenticated: boolean;
  userType: string;
  mounted: boolean;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [state, setState] = useState<AppState>({ 
    isAuthenticated: false, 
    userType: 'customer',
    mounted: false
  });

  // @ts-expect-error - This is a legitimate use of setState in effect for hydration
  useLayoutEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');
    
    let isAuthenticated = false;
    let userType = 'customer';
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        isAuthenticated = true;
        userType = user.user_type || 'customer';
      } catch (err) {
        console.error('Failed to parse user', err);
      }
    }
    
    setState({ isAuthenticated, userType, mounted: true });
  }, []);

  // Show loading state until mounted (prevents hydration mismatch)
  if (!state.mounted) {
    return <main className="w-full">{children}</main>;
  }

  // After mount, show appropriate layout
  if (!state.isAuthenticated) {
    return <main className="w-full">{children}</main>;
  }

  // Admin users get admin sidebar
  if (state.userType?.toLowerCase() === 'admin' || state.userType?.toLowerCase() === 'superadmin') {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="ml-64 flex-1">
          {children}
        </main>
      </div>
    );
  }

  // Regular users get regular sidebar
  return (
    <div className="flex min-h-screen">
      <Sidebar userType={state.userType} />
      <main className="ml-64 flex-1">
        {children}
      </main>
    </div>
  );
}
