'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import NotificationBar from './NotificationBar';

interface AppLayoutProps {
  children: React.ReactNode;
}

interface AppState {
  isAuthenticated: boolean;
  userType: string;
  userName: string;
  mounted: boolean;
}

type NotificationItem = {
  id: number;
  title: string;
  body: string;
  level?: 'info' | 'success' | 'warning' | 'error';
  created_at?: string;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [state, setState] = useState<AppState>({ 
    isAuthenticated: false, 
    userType: 'customer',
    userName: 'User',
    mounted: false
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useLayoutEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');
    
    let isAuthenticated = false;
    let userType = 'customer';
    let userName = 'User';
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        isAuthenticated = true;
        userType = user.user_type || 'customer';
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
        userName = fullName || user.name || user.email || 'User';
      } catch (err) {
        console.error('Failed to parse user', err);
      }
    }
    
    // Using queueMicrotask to avoid React compiler warning
    queueMicrotask(() => {
      setState({ isAuthenticated, userType, userName, mounted: true });
    });
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsNotificationsOpen(false);
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!state.isAuthenticated) return;

    const loadNotifications = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      setNotificationsLoading(true);
      try {
        const res = await fetch('/api/notifications', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        });

        const data = await res.json();
        if (data?.success && Array.isArray(data.data)) {
          setNotifications(data.data as NotificationItem[]);
        }
      } catch (err) {
        console.error('Failed to load notifications', err);
      } finally {
        setNotificationsLoading(false);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [state.isAuthenticated]);

  const markNotificationRead = async (id: number) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    } finally {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }, []);

  useEffect(() => {
    if (!state.isAuthenticated) return;

    const inactivityLimitMs = 5 * 60 * 1000;
    const activityKey = 'last_activity_at';
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const markActivity = () => {
      localStorage.setItem(activityKey, String(Date.now()));
    };

    const checkInactivity = () => {
      const lastActivity = Number(localStorage.getItem(activityKey)) || Date.now();
      if (Date.now() - lastActivity >= inactivityLimitMs) {
        handleLogout();
      }
    };

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
    });

    window.addEventListener('focus', checkInactivity);
    document.addEventListener('visibilitychange', checkInactivity);

    markActivity();
    intervalId = setInterval(checkInactivity, 30 * 1000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      events.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });
      window.removeEventListener('focus', checkInactivity);
      document.removeEventListener('visibilitychange', checkInactivity);
    };
  }, [handleLogout, state.isAuthenticated]);

  const renderTopBar = () => (
    <div className="md:sticky md:top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="flex h-14 items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex items-center gap-3 md:hidden">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 shadow-sm"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              A
            </div>
            <span className="text-sm font-bold text-gray-900">AffiliateHub</span>
          </div>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className="relative rounded-full border border-gray-200 bg-white p-2 text-gray-600 hover:text-gray-900"
            aria-label="Notifications"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-5-5.9V4a1 1 0 1 0-2 0v1.1A6 6 0 0 0 6 11v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
              <path d="M9 17a3 3 0 0 0 6 0" />
            </svg>
            {notifications.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white">
                {notifications.length}
              </span>
            )}
          </button>
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
              <div className="border-b border-gray-100 px-4 py-2 text-sm font-semibold text-gray-900">
                Notifications
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notificationsLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-500">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => markNotificationRead(item.id)}
                      className="w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50"
                    >
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="mt-1 text-sm text-gray-600">{item.body}</p>
                      {item.created_at && (
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
                  Click a notification to mark as read.
                </div>
              )}
            </div>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
              {state.userName.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden sm:block">{state.userName}</span>
            <span className="hidden sm:block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {state.userType.toUpperCase()}
            </span>
            <svg className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-lg">
              <a
                href="/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Profile
              </a>
              <a
                href="/settings"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Settings
              </a>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Show loading state until mounted (prevents hydration mismatch)
  if (!state.mounted) {
    return <main className="w-full">{children}</main>;
  }

  // After mount, show appropriate layout
  if (!state.isAuthenticated) {
    return <main className="w-full">{children}</main>;
  }

  const content = (
    <>
      {renderTopBar()}
      <NotificationBar />
      {children}
    </>
  );

  // Let admin routes manage their own layout to avoid double sidebars
  if (pathname?.startsWith('/admin')) {
    return <main className="w-full">{content}</main>;
  }

  // Admin users use responsive Sidebar
  if (state.userType?.toLowerCase() === 'admin' || state.userType?.toLowerCase() === 'superadmin') {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-white">
        <Sidebar
          userType={state.userType}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="w-full md:ml-60 flex-1 bg-white">
          {content}
        </main>
      </div>
    );
  }

  // Regular users get regular sidebar
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white">
      <Sidebar
        userType={state.userType}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="w-full md:ml-60 flex-1 bg-white">
        {content}
      </main>
    </div>
  );
}
