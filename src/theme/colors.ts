export const colors = {
  background: "#ffffff",
  foreground: "#202124",
  surface: "#f5f5f3",
  card: "#ffffff",
  primary: "#92702d",
  primaryForeground: "#ffffff",
  secondary: "#efefec",
  secondaryForeground: "#202124",
  errorForeground: "#ffffff",
  accent: "#f2e4c3",
  accentForeground: "#614712",
  muted: "#f0f0ed",
  mutedForeground: "#616165",
  success: "#15976c",
  error: "#d84b4b",
  warning: "#d99000",
  border: "#deded9",
};

export const radius = { sm: 6, base: 10, md: 14, lg: 18, full: 9999 };

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const shadow = {
  md: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const typography = {
  display: { fontSize: 26, fontWeight: "700" as const, lineHeight: 32 },
  title: { fontSize: 24, fontWeight: "700" as const, lineHeight: 30 },
  heading: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24 },
  subheading: { fontSize: 16, fontWeight: "600" as const, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 21 },
  bodyStrong: { fontSize: 15, fontWeight: "600" as const, lineHeight: 21 },
  small: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: "400" as const, lineHeight: 16 },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 1,
    lineHeight: 16,
  },
  mono: {
    fontSize: 12,
    fontWeight: "600" as const,
    fontVariant: ["tabular-nums" as const],
  },
};

export const tints = {
  error: "#fbe9e9",
  success: "#e3f4ee",
  warning: "#fbf0d9",
  errorBorder: "#f3d2d2",
  successBorder: "#cbeadf",
  warningBorder: "#f4e3bd",
  featured: "#caa24d",
  overlay: "rgba(0, 0, 0, 0.5)",
};
