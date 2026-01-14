"use client";

import { useEffect, useState } from "react";
import { darkTokens as defaultDark, lightTokens as defaultLight, type DesignTokens } from "@/design/tokens";

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
  const [loadedLight, setLoadedLight] = useState<DesignTokens | null>(null);
  const [loadedDark, setLoadedDark] = useState<DesignTokens | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch("/design-tokens.json", { signal: controller.signal });
        if (!res.ok) return;
        const json = await res.json();
        if (json?.light && json?.dark) {
          setLoadedLight(json.light as DesignTokens);
          setLoadedDark(json.dark as DesignTokens);
        }
      } catch (_) {
        // ignore network errors; fall back to defaults
      }
    };
    load();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const chosenLight = tokens ?? loadedLight ?? defaultLight;
    const chosenDark = darkTokensOverride ?? loadedDark ?? defaultDark;
    const t = prefersDark ? chosenDark : chosenLight;
    applyTokens(t);
  }, [tokens, darkTokensOverride, loadedLight, loadedDark]);

  return children as React.ReactElement;
}

export default ThemeProvider;
