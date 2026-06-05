'use client';

import { useEffect, useRef } from 'react';

const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

export function useIdleLogout() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only run for authenticated users
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('auth_token')) return;

    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login?reason=idle';
      }, IDLE_TIMEOUT_MS);
    };

    // Start timer and attach activity listeners
    reset();
    EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));

    return () => {
      if (timer.current) clearTimeout(timer.current);
      EVENTS.forEach((e) => window.removeEventListener(e, reset));
    };
  }, []);
}
