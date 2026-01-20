export type DesignTokens = {
  colors: {
    background: string;
    foreground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    success: string;
    warning: string;
    danger: string;
    muted: string;
    mutedForeground: string;
    surface: string;
    border: string;
  };
  radii: {
    sm: string;
    md: string;
    lg: string;
  };
  typography: {
    fontSans: string;
    fontMono: string;
  };
};

// Default tokens (placeholder). Replace with values from the Figma Style Guide.
export const lightTokens: DesignTokens = {
  colors: {
    background: "#ffffff",
    foreground: "#0f172a",
    primary: "#5B8DEF", // Figma Primary
    primaryForeground: "#ffffff",
    secondary: "#64748B",
    secondaryForeground: "#ffffff",
    accent: "#A855F7",
    accentForeground: "#ffffff",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    muted: "#F1F5F9",
    mutedForeground: "#475569",
    surface: "#FFFFFF",
    border: "#E2E8F0",
  },
  radii: { sm: "6px", md: "8px", lg: "12px" },
  typography: { fontSans: "var(--font-geist-sans)", fontMono: "var(--font-geist-mono)" },
};

export const darkTokens: DesignTokens = {
  colors: {
    background: "#0B1220",
    foreground: "#EDEFF4",
    primary: "#5B8DEF",
    primaryForeground: "#ffffff",
    secondary: "#64748B",
    secondaryForeground: "#ffffff",
    accent: "#A855F7",
    accentForeground: "#ffffff",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    muted: "#0F172A",
    mutedForeground: "#94A3B8",
    surface: "#0B1220",
    border: "#1F2937",
  },
  radii: { sm: "6px", md: "8px", lg: "12px" },
  typography: { fontSans: "var(--font-geist-sans)", fontMono: "var(--font-geist-mono)" },
};
