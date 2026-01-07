"use client";

import { useEffect } from "react";
import { darkTokens, lightTokens, type DesignTokens } from "@/design/tokens";

export interface ThemeProviderProps {
  tokens?: DesignTokens;
  darkTokensOverride?: DesignTokens;
  children: React.ReactNode;
}

function applyTokens(tokens: DesignTokens) {
  const root = document.documentElement;
  const map: Record<string, string> = {
    "--background": tokens.colors.background,
    "--foreground": tokens.colors.foreground,
    "--primary": tokens.colors.primary,
    "--primary-foreground": tokens.colors.primaryForeground,
    "--secondary": tokens.colors.secondary,
    "--secondary-foreground": tokens.colors.secondaryForeground,
    "--accent": tokens.colors.accent,
    "--accent-foreground": tokens.colors.accentForeground,
    "--success": tokens.colors.success,
    "--warning": tokens.colors.warning,
    "--danger": tokens.colors.danger,
    "--muted": tokens.colors.muted,
    "--muted-foreground": tokens.colors.mutedForeground,
    "--surface": tokens.colors.surface,
    "--border": tokens.colors.border,
    "--radius-sm": tokens.radii.sm,
    "--radius-md": tokens.radii.md,
    "--radius-lg": tokens.radii.lg,
  };
  Object.entries(map).forEach(([key, val]) => root.style.setProperty(key, val));
}

export function ThemeProvider({ tokens, darkTokensOverride, children }: ThemeProviderProps) {
  useEffect(() => {
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const t = prefersDark ? darkTokensOverride ?? darkTokens : tokens ?? lightTokens;
    applyTokens(t);
  }, [tokens, darkTokensOverride]);

  return children as React.ReactElement;
}

export default ThemeProvider;
