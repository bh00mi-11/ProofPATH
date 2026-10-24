import { Link, Slot, usePathname, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { BrandColors, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { ThemedText } from './themed-text';

const navItems: { label: string; href: Href; path: string }[] = [
  { label: 'Home', href: '/', path: '/' },
  { label: 'Evidence timeline', href: '/evidence', path: '/evidence' },
  { label: 'What if removed?', href: '/time-machine', path: '/time-machine' },
  { label: 'Choose what to share', href: '/privacy', path: '/privacy' },
];

export default function AppTabs() {
  const pathname = usePathname();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <View style={styles.webRoot}>
      {/* Top Navigation Bar: rendered in normal document flow so it never overlaps the page title */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.backgroundElement,
            borderBottomColor: isDark ? BrandColors.borderDark : BrandColors.border,
          },
        ]}>
        <View style={styles.innerContainer}>
          {/* Brand Logo & Name */}
          <Link href="/" asChild>
            <Pressable style={styles.brandRow}>
              <View style={styles.brandIcon}>
                <ThemedText style={styles.brandIconText}>✦</ThemedText>
              </View>
              <ThemedText type="smallBold" style={styles.brandName}>
                ProofPath
              </ThemedText>
            </Pressable>
          </Link>

          {/* Tab navigation links */}
          <View style={styles.tabLinksRow}>
            {navItems.map((item) => {
              const active = pathname === item.path || (item.path === '/' && pathname === '/index');
              return (
                <Link key={item.label} href={item.href} asChild>
                  <Pressable
                    style={({ pressed }) => [
                      styles.tabButtonView,
                      active ? styles.tabButtonActive : styles.tabButtonInactive,
                      pressed && styles.pressed,
                    ]}>
                    <Text
                      style={[
                        styles.tabTextBase,
                        active ? styles.tabTextActive : styles.tabTextInactive,
                      ]}>
                      {item.label}
                    </Text>
                  </Pressable>
                </Link>
              );
            })}
          </View>
        </View>
      </View>

      {/* Main Screen Content */}
      <View style={styles.slotWrapper}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    minHeight: '100%',
    width: '100%',
  },
  topBar: {
    width: '100%',
    borderBottomWidth: 1,
    zIndex: 50,
  },
  innerContainer: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  brandIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: BrandColors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  tabLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    flexWrap: 'wrap',
  },
  tabPressable: {
    borderRadius: Spacing.two,
  },
  tabButtonView: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  tabButtonActive: {
    backgroundColor: BrandColors.indigoLight,
  },
  tabButtonInactive: {
    backgroundColor: 'transparent',
  },
  tabTextBase: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: BrandColors.indigo,
    fontWeight: '700',
  },
  tabTextInactive: {
    opacity: 0.75,
  },
  pressed: {
    opacity: 0.7,
  },
  slotWrapper: {
    flex: 1,
    width: '100%',
  },
  slot: {
    flex: 1,
  },
});
