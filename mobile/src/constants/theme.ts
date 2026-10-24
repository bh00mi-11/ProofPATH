/**
 * ProofPath Theme & Color Palette
 * -------------------------------------------------------------
 * Calm Indigo/Purple palette with clean white cards and readable text.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A',
    background: '#F8FAFC',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EEF2FF',
    textSecondary: '#475569',
  },
  dark: {
    text: '#F8FAFC',
    background: '#0B0F19',
    backgroundElement: '#151D2F',
    backgroundSelected: '#232D48',
    textSecondary: '#94A3B8',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const BrandColors = {
  indigo: '#4F46E5',
  indigoHover: '#4338CA',
  indigoLight: '#EEF2FF',
  purple: '#7C3AED',
  purpleLight: '#F5F3FF',
  border: '#E2E8F0',
  borderDark: '#232D48',
  success: '#059669',
  successLight: '#ECFDF5',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  muted: '#64748B',
  mutedLight: '#F1F5F9',
} as const;

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
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 0 }) ?? 0;
export const MaxContentWidth = 840;
