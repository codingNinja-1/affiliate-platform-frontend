'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState('customer');

  useEffect(() => {
    // Read from localStorage and update state in callback
    const token = localStorage.getItem('auth_token');
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

    // This pattern is safe - we're only updating state once on mount after hydration
    // eslint-disable-next-line
    setUserType(type);
    setIsAuthenticated(authenticated);
    setHasMounted(true);
  }, []);

  // Prevent rendering sidebar on server; only show after hydration
  if (!hasMounted) {
    return <main className="w-full">{children}</main>;
  }

  if (!isAuthenticated) {
    return <main className="w-full">{children}</main>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userType={userType} />
      <main className="ml-64 flex-1">
        {children}
      </main>
    </div>
  );
}
