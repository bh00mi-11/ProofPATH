import { Slot, usePathname, useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useColorScheme, Linking, Platform } from 'react-native';

import { BrandColors, Colors, MaxContentWidth, Spacing, Radii } from '@/constants/theme';
import { ThemedText } from './themed-text';
import { useTranslation } from '@/context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

export default function AppTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const isDark = false;
  const colors = Colors.light;
  const { t } = useTranslation();

  // Consolidate into 5 core pillars per user directive:
  // 1. Home
  // 2. Evidence
  // 3. Analysis (Time Machine + Stress Test)
  // 4. Share Safely (Privacy Lens + Report)
  // 5. Support (Next Steps + Accountability + Legal Context + Remedies)
  const navItems: { label: string; href: string; path: string; matchPaths: string[] }[] = [
    { label: t.navigation.home, href: '/', path: '/', matchPaths: ['/', '/index'] },
    { label: t.navigation.evidenceTimeline, href: '/evidence', path: '/evidence', matchPaths: ['/evidence'] },
    {
      label: t.navigation.analysis,
      href: '/time-machine',
      path: '/time-machine',
      matchPaths: ['/time-machine', '/stress-test'],
    },
    {
      label: t.navigation.shareSafely,
      href: '/privacy',
      path: '/privacy',
      matchPaths: ['/privacy', '/report/preview'],
    },
    {
      label: t.navigation.supportSection,
      href: '/support',
      path: '/support',
      matchPaths: ['/support', '/accountability', '/legal-context', '/remedies'],
    },
  ];

  const isGuardianActive = pathname === '/guardian';

  const handleQuickCall112 = () => {
    const url = 'tel:112';
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported || Platform.OS === 'web') {
          Linking.openURL(url);
        } else {
          alert('Call 112 directly from your phone in an immediate emergency.');
        }
      })
      .catch(() => {
        alert('Call 112 directly from your phone in an immediate emergency.');
      });
  };

  return (
    <View style={styles.webRoot}>
      {/* Top Header & Navigation Bar */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.backgroundElement,
            borderBottomColor: isDark ? BrandColors.borderDark : BrandColors.border,
          },
        ]}>
        <View style={styles.innerContainer}>
          {/* Left: Clean, professional, authentic enterprise brand identity without AI vibe or version badges */}
          <Pressable
            onPress={() => router.push('/')}
            style={({ pressed }: any) => [
              styles.brandRow,
              pressed && styles.pressed,
            ]}
            accessibilityRole="link"
            accessibilityLabel="ProofPATH Home">
            <View style={styles.brandIcon}>
              <View style={styles.brandCompositeMark}>
                {/* Shield Outline with Safety Node */}
                <View style={styles.symbolShield}>
                  {/* Phone Receiver Node */}
                  <View style={styles.symbolPhoneReceiver} />
                  {/* Route / Map Path Line */}
                  <View style={styles.symbolMapPath} />
                  <View style={styles.symbolMapNode} />
                </View>
              </View>
            </View>
            <View style={styles.brandTextGroup}>
              <Text style={styles.brandName}>
                Proof<Text style={styles.brandNameAccent}>PATH</Text>
              </Text>
              <Text style={styles.brandTagline}>Deterministic Integrity Engine</Text>
            </View>
          </Pressable>

          {/* Center: Consolidated 5-Pillar Navigation with generous professional spacing */}
          <View style={styles.tabLinksRow}>
            {navItems.map((item) => {
              const active = item.matchPaths.some((p) => pathname === p);
              return (
                <Pressable
                  key={item.path}
                  onPress={() => router.push(item.href as any)}
                  style={({ pressed, hovered }: any) => [
                    styles.tabButtonView,
                    active ? styles.tabButtonActive : styles.tabButtonInactive,
                    hovered && !active && styles.tabButtonHovered,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}>
                  <Text
                    style={[
                      styles.tabTextBase,
                      active ? styles.tabTextActive : styles.tabTextInactive,
                    ]}>
                    {item.label}
                  </Text>
                  {active ? <View style={styles.tabActiveIndicator} /> : null}
                </Pressable>
              );
            })}
          </View>

          {/* Right: Guardian Mode, 112 Emergency Shortcut, and Language Selector */}
          <View style={styles.rightActionsRow}>
            {/* Guardian Mode Quick Badge */}
            <Pressable
              onPress={() => router.push('/guardian')}
              style={({ pressed, hovered }: any) => [
                styles.guardianPill,
                isGuardianActive ? styles.guardianPillActive : styles.guardianPillInactive,
                hovered && styles.guardianPillHovered,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Open Guardian Mode">
              <Text style={styles.guardianDot}>●</Text>
              <Text style={styles.guardianText}>{t.navigation.guardianMode}</Text>
            </Pressable>

            {/* Emergency 112 Direct Access Button */}
            <Pressable
              onPress={handleQuickCall112}
              style={({ pressed, hovered }: any) => [
                styles.emergencyBtn,
                hovered && styles.emergencyBtnHovered,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Call 112 Emergency">
              <Text style={styles.emergencyBtnText}>112 SOS</Text>
            </Pressable>

            {/* Global Language Selector */}
            <LanguageSelector />
          </View>
        </View>

        {/* Sub-Navigation Strip (Contextual secondary links when inside Analysis or Support) */}
        {pathname === '/time-machine' || pathname === '/stress-test' ? (
          <View style={styles.subNavBar}>
            <View style={styles.subNavInner}>
              <Text style={styles.subNavCategory}>ANALYSIS TOOLS:</Text>
              <Pressable
                onPress={() => router.push('/time-machine')}
                style={[styles.subNavLink, pathname === '/time-machine' && styles.subNavLinkActive]}>
                <Text style={[styles.subNavText, pathname === '/time-machine' && styles.subNavTextActive]}>
                  {t.navigation.whatIfRemoved}
                </Text>
              </Pressable>
              <Text style={styles.subNavDivider}>•</Text>
              <Pressable
                onPress={() => router.push('/stress-test')}
                style={[styles.subNavLink, pathname === '/stress-test' && styles.subNavLinkActive]}>
                <Text style={[styles.subNavText, pathname === '/stress-test' && styles.subNavTextActive]}>
                  {t.navigation.stressTest}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {pathname === '/privacy' || pathname === '/report/preview' ? (
          <View style={styles.subNavBar}>
            <View style={styles.subNavInner}>
              <Text style={styles.subNavCategory}>SHARE & REPORT:</Text>
              <Pressable
                onPress={() => router.push('/privacy')}
                style={[styles.subNavLink, pathname === '/privacy' && styles.subNavLinkActive]}>
                <Text style={[styles.subNavText, pathname === '/privacy' && styles.subNavTextActive]}>
                  {t.navigation.chooseWhatToShare}
                </Text>
              </Pressable>
              <Text style={styles.subNavDivider}>•</Text>
              <Pressable
                onPress={() => router.push('/report/preview')}
                style={[styles.subNavLink, pathname === '/report/preview' && styles.subNavLinkActive]}>
                <Text style={[styles.subNavText, pathname === '/report/preview' && styles.subNavTextActive]}>
                  {t.reportPreview.title}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {pathname === '/support' ||
        pathname === '/accountability' ||
        pathname === '/legal-context' ||
        pathname === '/remedies' ? (
          <View style={styles.subNavBar}>
            <View style={styles.subNavInner}>
              <Text style={styles.subNavCategory}>SUPPORT & LEGAL:</Text>
              <Pressable
                onPress={() => router.push('/support')}
                style={[styles.subNavLink, pathname === '/support' && styles.subNavLinkActive]}>
                <Text style={[styles.subNavText, pathname === '/support' && styles.subNavTextActive]}>
                  {t.navigation.nextSteps}
                </Text>
              </Pressable>
              <Text style={styles.subNavDivider}>•</Text>
              <Pressable
                onPress={() => router.push('/accountability')}
                style={[styles.subNavLink, pathname === '/accountability' && styles.subNavLinkActive]}>
                <Text style={[styles.subNavText, pathname === '/accountability' && styles.subNavTextActive]}>
                  {t.navigation.accountabilityTrail}
                </Text>
              </Pressable>
              <Text style={styles.subNavDivider}>•</Text>
              <Pressable
                onPress={() => router.push('/legal-context')}
                style={[styles.subNavLink, pathname === '/legal-context' && styles.subNavLinkActive]}>
                <Text style={[styles.subNavText, pathname === '/legal-context' && styles.subNavTextActive]}>
                  {t.navigation.legalContext}
                </Text>
              </Pressable>
              <Text style={styles.subNavDivider}>•</Text>
              <Pressable
                onPress={() => router.push('/remedies')}
                style={[styles.subNavLink, pathname === '/remedies' && styles.subNavLinkActive]}>
                <Text style={[styles.subNavText, pathname === '/remedies' && styles.subNavTextActive]}>
                  {t.navigation.remediesJustice}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      {/* Main Screen Slot Wrapper */}
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
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    width: '100%',
    borderBottomWidth: 1,
    zIndex: 50,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  innerContainer: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer' as any,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  brandCompositeMark: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolShield: {
    width: 20,
    height: 22,
    borderWidth: 2,
    borderColor: '#38BDF8',
    borderRadius: 4,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    position: 'relative',
  },
  symbolPhoneReceiver: {
    position: 'absolute',
    top: 3,
    left: 4,
    width: 5,
    height: 9,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: '#818CF8',
    backgroundColor: '#312E81',
  },
  symbolMapPath: {
    position: 'absolute',
    bottom: 4,
    width: 10,
    height: 2,
    backgroundColor: '#A78BFA',
    borderRadius: 1,
    transform: [{ rotate: '-25deg' }],
  },
  symbolMapNode: {
    position: 'absolute',
    bottom: 6,
    right: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#34D399',
  },
  brandTextGroup: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#0F172A',
  },
  brandNameAccent: {
    color: '#4F46E5',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  versionBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  versionBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4338CA',
  },
  brandTagline: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    letterSpacing: 0.2,
    marginTop: 1,
  },
  tabLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabButtonView: {
    position: 'relative',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
  tabButtonActive: {
    backgroundColor: '#F1F5F9',
  },
  tabButtonHovered: {
    backgroundColor: '#F8FAFC',
  },
  tabButtonInactive: {
    backgroundColor: 'transparent',
  },
  tabActiveIndicator: {
    position: 'absolute',
    bottom: 2,
    left: 16,
    right: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#4F46E5',
  },
  tabTextBase: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  tabTextInactive: {
    color: '#64748B',
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guardianPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.full,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  guardianPillActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  guardianPillHovered: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  guardianPillInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  guardianDot: {
    fontSize: 9,
    color: '#16A34A',
  },
  guardianText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  emergencyBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.full,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    cursor: 'pointer' as any,
  },
  emergencyBtnHovered: {
    backgroundColor: '#B91C1C',
  },
  emergencyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subNavBar: {
    backgroundColor: '#F1F5F9',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 6,
  },
  subNavInner: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  subNavCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  subNavLink: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  subNavLinkActive: {
    backgroundColor: '#E2E8F0',
  },
  subNavText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  subNavTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  subNavDivider: {
    fontSize: 10,
    color: '#94A3B8',
  },
  pressed: {
    opacity: 0.75,
  },
  slotWrapper: {
    flex: 1,
    width: '100%',
  },
});

