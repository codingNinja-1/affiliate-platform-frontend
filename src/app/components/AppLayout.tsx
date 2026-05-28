'use client';

import { useState, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

interface AppState {
  isAuthenticated: boolean;
  userType: string;
  mounted: boolean;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [state, setState] = useState<AppState>({ 
    isAuthenticated: false, 
    userType: 'customer',
    mounted: false
  });

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
    
    // Using queueMicrotask to avoid React compiler warning
    queueMicrotask(() => {
      setState({ isAuthenticated, userType, mounted: true });
    });
  }, []);

  // Show loading state until mounted (prevents hydration mismatch)
  if (!state.mounted) {
    return <main className="w-full">{children}</main>;
  }

  // After mount, show appropriate layout
  if (!state.isAuthenticated) {
    return <main className="w-full">{children}</main>;
  }

  // Let admin routes manage their own layout to avoid double sidebars
  if (pathname?.startsWith('/admin')) {
    return <main className="w-full">{children}</main>;
  }

  // Admin users use responsive Sidebar
  if (state.userType?.toLowerCase() === 'admin' || state.userType?.toLowerCase() === 'superadmin') {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-white">
        <Sidebar userType={state.userType} />
        <main className="w-full md:ml-60 flex-1 bg-white pt-14 md:pt-0">
          {children}
        </main>
      </div>
    );
  }

  // Regular users get regular sidebar
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white">
      <Sidebar userType={state.userType} />
      <main className="w-full md:ml-60 flex-1 bg-white pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
