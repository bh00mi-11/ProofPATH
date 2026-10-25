/**
 * ProofPath Theme & Visual Design Tokens
 * -------------------------------------------------------------
 * Premium, calm, modern, and trustworthy women's safety design system.
 * Warm neutrals, deep indigo accents, soft tinted surfaces, accessible contrast.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A', // Slate 900
    textSecondary: '#475569', // Slate 600
    textMuted: '#64748B', // Slate 500
    background: '#F8FAFC', // Slate 50
    backgroundElement: '#FFFFFF',
    backgroundSubtle: '#F1F5F9', // Slate 100
    backgroundSecondary: '#F1F5F9',
    backgroundSelected: '#EEF2FF', // Indigo 50
    border: '#E2E8F0', // Slate 200
    borderSubtle: '#F1F5F9',
  },
  dark: {
    text: '#F8FAFC', // Slate 50
    textSecondary: '#94A3B8', // Slate 400
    textMuted: '#64748B', // Slate 500
    background: '#090D16', // Deep Obsidian
    backgroundElement: '#121826', // Elevated Card
    backgroundSubtle: '#1E293B', // Slate 800
    backgroundSelected: '#1E1B4B', // Deep Indigo
    border: '#1E293B', // Slate 800
    borderSubtle: '#0F172A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const BrandColors = {
  // Primary Trust Anchor (Deep Indigo)
  indigo: '#4338CA',
  indigoHover: '#3730A3',
  indigoLight: '#EEF2FF',
  indigoBorder: '#C7D2FE',
  purple: '#4338CA',
  purpleLight: '#EEF2FF',

  // Accent & Clarity
  teal: '#0D9488',
  tealLight: '#F0FDFA',
  tealBorder: '#99F6E4',

  // Safety & Emergency
  rose: '#E11D48',
  roseLight: '#FFF1F2',
  roseBorder: '#FECDD3',

  // Semantic Statuses
  success: '#059669',
  successLight: '#ECFDF5',
  successBorder: '#A7F3D0',

  warning: '#D97706',
  warningLight: '#FFFBEB',
  warningBorder: '#FDE68A',

  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  dangerBorder: '#FECACA',

  // Neutral Accents
  border: '#E2E8F0',
  borderDark: '#1E293B',
  muted: '#64748B',
  mutedLight: '#F1F5F9',
} as const;

export const Typography = {
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
    letterSpacing: -0.8,
  },
  title1: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  title2: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  headline: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  captionBold: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600' as const,
  },
  tag: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace, monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
} as const;

export const Radii = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 0 }) ?? 0;
export const MaxContentWidth = 920;

