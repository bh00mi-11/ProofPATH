import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet, useColorScheme } from 'react-native';

import { BrandColors, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { ThemedText } from './themed-text';
import { ThemedView } from '@/components/themed-view';

export default function AppTabs() {
  return (
    <Tabs style={styles.webRoot}>
      {/* Top Navigation Bar: rendered in normal document flow so it never overlaps the page title */}
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Overview</TabButton>
          </TabTrigger>
          <TabTrigger name="evidence" href="/evidence" asChild>
            <TabButton>Evidence timeline</TabButton>
          </TabTrigger>
          <TabTrigger name="time-machine" href="/time-machine" asChild>
            <TabButton>What if removed?</TabButton>
          </TabTrigger>
          <TabTrigger name="privacy" href="/privacy" asChild>
            <TabButton>Choose what to share</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>

      {/* Main Screen Content: starts cleanly below the top navigation bar */}
      <View style={styles.slotWrapper}>
        <TabSlot style={styles.slot} />
      </View>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  ref: _ref,
  ...props
}: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabPressable, pressed && styles.pressed]}>
      <View
        style={[
          styles.tabButtonView,
          isFocused ? styles.tabButtonActive : styles.tabButtonInactive,
        ]}>
        <ThemedText
          type="smallBold"
          style={isFocused ? styles.tabTextActive : styles.tabTextInactive}>
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <View
      {...props}
      style={[
        styles.topBar,
        {
          backgroundColor: colors.backgroundElement,
          borderBottomColor: isDark ? BrandColors.borderDark : BrandColors.border,
        },
      ]}>
      <View style={styles.innerContainer}>
        {/* Brand Logo & Name */}
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <ThemedText style={styles.brandIconText}>✦</ThemedText>
          </View>
          <ThemedText type="smallBold" style={styles.brandName}>
            ProofPath
          </ThemedText>
        </View>

        {/* Tab navigation links */}
        <View style={styles.tabLinksRow}>
          {props.children}
        </View>
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
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
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
