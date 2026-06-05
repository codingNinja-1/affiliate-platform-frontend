'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { darkTokens, lightTokens } from '@/design/tokens';

type Theme = 'light' | 'dark';

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'light',
  toggle: () => {},
});

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  const vars: Record<string, string> = {
    '--background': tokens.colors.background,
    '--foreground': tokens.colors.foreground,
    '--primary': tokens.colors.primary,
    '--primary-foreground': tokens.colors.primaryForeground,
    '--secondary': tokens.colors.secondary,
    '--secondary-foreground': tokens.colors.secondaryForeground,
    '--accent': tokens.colors.accent,
    '--accent-foreground': tokens.colors.accentForeground,
    '--success': tokens.colors.success,
    '--warning': tokens.colors.warning,
    '--danger': tokens.colors.danger,
    '--muted': tokens.colors.muted,
    '--muted-foreground': tokens.colors.mutedForeground,
    '--surface': tokens.colors.surface,
    '--border': tokens.colors.border,
  };
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    const preferred: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initial = stored ?? preferred;
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      applyTheme(next);
      return next;
    });
  }, []);

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
