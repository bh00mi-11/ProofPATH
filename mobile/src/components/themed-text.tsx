import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'title2'
    | 'headline'
    | 'small'
    | 'smallBold'
    | 'subtitle'
    | 'link'
    | 'linkPrimary'
    | 'code'
    | 'display'
    | 'caption'
    | 'tag';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={StyleSheet.flatten([{ color: theme[themeColor ?? 'text'] }, styles[type], style])}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  title: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  title2: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  headline: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  default: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  small: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  smallBold: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  tag: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  link: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  linkPrimary: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#4338CA',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: '700' }) ?? '500',
    fontSize: 12,
  },
});
