import React from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View,
  Text,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, BrandColors, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCaseState } from '@/context/CaseContext';

export default function HomeScreen() {
  const { currentCase, claims, evidence, isLoading } = useCaseState();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Calming, pastel-accented palette for a polished women's-safety dashboard
  const cardPalettes = {
    records: {
      bg: isDark ? '#062E20' : '#F0FDF4',
      border: isDark ? '#047857' : '#BBF7D0',
      iconBg: isDark ? '#064E3B' : '#DCFCE7',
      title: isDark ? '#6EE7B7' : '#14532D',
      subtext: isDark ? '#A7F3D0' : '#166534',
      accent: isDark ? '#34D399' : '#059669',
    },
    evidence: {
      bg: isDark ? '#1E1B4B' : '#EEF2FF',
      border: isDark ? '#4338CA' : '#C7D2FE',
      iconBg: isDark ? '#312E81' : '#E0E7FF',
      title: isDark ? '#C7D2FE' : '#312E81',
      subtext: isDark ? '#E0E7FF' : '#3730A3',
      accent: isDark ? '#818CF8' : '#4F46E5',
    },
    timeMachine: {
      bg: isDark ? '#451A03' : '#FFFBEB',
      border: isDark ? '#92400E' : '#FDE68A',
      iconBg: isDark ? '#78350F' : '#FEF3C7',
      title: isDark ? '#FCD34D' : '#78350F',
      subtext: isDark ? '#FDE68A' : '#92400E',
      accent: isDark ? '#FBBF24' : '#D97706',
    },
    privacy: {
      bg: isDark ? '#4C0519' : '#FFF1F2',
      border: isDark ? '#9F1239' : '#FECDD3',
      iconBg: isDark ? '#881337' : '#FFE4E6',
      title: isDark ? '#FDA4AF' : '#881337',
      subtext: isDark ? '#FECDD3' : '#9F1239',
      accent: isDark ? '#FB7185' : '#E11D48',
    },
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header area - clean, calm, and compact to fit in first mobile view */}
          <View style={styles.headerRow}>
            <View style={styles.headerTextGroup}>
              <View style={styles.brandBadgeRow}>
                <ThemedText style={styles.brandTitle}>ProofPath</ThemedText>
                <View style={styles.safetyPill}>
                  <ThemedText style={styles.safetyPillText}>Safe & Confidential</ThemedText>
                </View>
              </View>
              <ThemedText style={styles.subtitle}>
                Your secure record and privacy companion.
              </ThemedText>
            </View>
          </View>

          {/* 1-Sentence Demo Notice */}
          <View style={styles.demoNotice}>
            <ThemedText style={styles.demoNoticeText}>
              Sample demo: Evidence, simulations, and reports are fictional examples.
            </ThemedText>
          </View>

          {/* Primary Action: Create a record */}
          <Pressable
            onPress={() => router.push('/incident/create')}
            style={({ pressed }) => [
              styles.createRecordButton,
              pressed && styles.createRecordButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Create a record">
            <View style={styles.createRecordLeft}>
              <View style={styles.createRecordIconCircle}>
                <SymbolView
                  tintColor="#FFFFFF"
                  name={{ ios: 'plus', android: 'add', web: 'add' }}
                  size={18}
                  fallback={<Text style={styles.iconFallbackWhite}>+</Text>}
                />
              </View>
              <View>
                <ThemedText style={styles.createRecordTitle}>Create a record</ThemedText>
                <ThemedText style={styles.createRecordSubtitle}>
                  Start a new incident entry
                </ThemedText>
              </View>
            </View>
            <View style={styles.createRecordArrow}>
              <ThemedText style={styles.createRecordArrowText}>→</ThemedText>
            </View>
          </Pressable>

          {/* Four Large Colorful Menu Cards in a Neat 2-by-2 Grid */}
          <View style={styles.gridSection}>
            <View style={styles.gridRow}>
              {/* Card 1: My Records */}
              <Pressable
                onPress={() => router.push(`/incident/${currentCase?.id ?? 'case-demo-01'}`)}
                style={({ pressed }) => [
                  styles.gridCard,
                  {
                    backgroundColor: cardPalettes.records.bg,
                    borderColor: cardPalettes.records.border,
                  },
                  pressed && styles.cardPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="My Records">
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: cardPalettes.records.iconBg },
                    ]}>
                    <SymbolView
                      tintColor={cardPalettes.records.accent}
                      name={{ ios: 'folder.fill', android: 'folder', web: 'folder' }}
                      size={20}
                      fallback={<Text style={styles.emojiFallback}>📁</Text>}
                    />
                  </View>
                  <ThemedText style={[styles.cardArrow, { color: cardPalettes.records.accent }]}>
                    →
                  </ThemedText>
                </View>

                <View style={styles.cardBody}>
                  <ThemedText
                    style={[styles.cardTitle, { color: cardPalettes.records.title }]}>
                    My Records
                  </ThemedText>
                  <ThemedText
                    style={[styles.cardDesc, { color: cardPalettes.records.subtext }]}>
                    {isLoading
                      ? 'Loading case...'
                      : `${claims.length} claims • Active case`}
                  </ThemedText>
                </View>
              </Pressable>

              {/* Card 2: Evidence */}
              <Pressable
                onPress={() => router.push('/evidence')}
                style={({ pressed }) => [
                  styles.gridCard,
                  {
                    backgroundColor: cardPalettes.evidence.bg,
                    borderColor: cardPalettes.evidence.border,
                  },
                  pressed && styles.cardPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Evidence timeline">
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: cardPalettes.evidence.iconBg },
                    ]}>
                    <SymbolView
                      tintColor={cardPalettes.evidence.accent}
                      name={{
                        ios: 'camera.fill',
                        android: 'photo_camera',
                        web: 'photo_camera',
                      }}
                      size={20}
                      fallback={<Text style={styles.emojiFallback}>📷</Text>}
                    />
                  </View>
                  <ThemedText style={[styles.cardArrow, { color: cardPalettes.evidence.accent }]}>
                    →
                  </ThemedText>
                </View>

                <View style={styles.cardBody}>
                  <ThemedText
                    style={[styles.cardTitle, { color: cardPalettes.evidence.title }]}>
                    Evidence
                  </ThemedText>
                  <ThemedText
                    style={[styles.cardDesc, { color: cardPalettes.evidence.subtext }]}>
                    {isLoading
                      ? 'Loading items...'
                      : `${evidence.length} items • Timeline`}
                  </ThemedText>
                </View>
              </Pressable>
            </View>

            <View style={styles.gridRow}>
              {/* Card 3: What if this item is removed? (Time Machine) */}
              <Pressable
                onPress={() => router.push('/time-machine')}
                style={({ pressed }) => [
                  styles.gridCard,
                  {
                    backgroundColor: cardPalettes.timeMachine.bg,
                    borderColor: cardPalettes.timeMachine.border,
                  },
                  pressed && styles.cardPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="What if this item is removed?">
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: cardPalettes.timeMachine.iconBg },
                    ]}>
                    <SymbolView
                      tintColor={cardPalettes.timeMachine.accent}
                      name={{
                        ios: 'clock.arrow.circlepath',
                        android: 'history',
                        web: 'history',
                      }}
                      size={20}
                      fallback={<Text style={styles.emojiFallback}>↻</Text>}
                    />
                  </View>
                  <ThemedText
                    style={[styles.cardArrow, { color: cardPalettes.timeMachine.accent }]}>
                    →
                  </ThemedText>
                </View>

                <View style={styles.cardBody}>
                  <ThemedText
                    style={[styles.cardTitle, { color: cardPalettes.timeMachine.title }]}>
                    What if this item is removed?
                  </ThemedText>
                  <ThemedText
                    style={[styles.cardDesc, { color: cardPalettes.timeMachine.subtext }]}>
                    Time Machine • Test changes
                  </ThemedText>
                </View>
              </Pressable>

              {/* Card 4: Choose what to share (Privacy) */}
              <Pressable
                onPress={() => router.push('/privacy')}
                style={({ pressed }) => [
                  styles.gridCard,
                  {
                    backgroundColor: cardPalettes.privacy.bg,
                    borderColor: cardPalettes.privacy.border,
                  },
                  pressed && styles.cardPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Choose what to share">
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: cardPalettes.privacy.iconBg },
                    ]}>
                    <SymbolView
                      tintColor={cardPalettes.privacy.accent}
                      name={{ ios: 'shield.fill', android: 'shield', web: 'shield' }}
                      size={20}
                      fallback={<Text style={styles.emojiFallback}>🛡️</Text>}
                    />
                  </View>
                  <ThemedText style={[styles.cardArrow, { color: cardPalettes.privacy.accent }]}>
                    →
                  </ThemedText>
                </View>

                <View style={styles.cardBody}>
                  <ThemedText
                    style={[styles.cardTitle, { color: cardPalettes.privacy.title }]}>
                    Choose what to share
                  </ThemedText>
                  <ThemedText
                    style={[styles.cardDesc, { color: cardPalettes.privacy.subtext }]}>
                    Privacy • Sample report
                  </ThemedText>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Detailed Section Below - Accessible via natural scroll */}
          <ThemedText style={styles.sectionHeader}>
            CURRENT RECORD DETAILS
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.activeCaseCard}>
            <View style={styles.caseHeaderRow}>
              <ThemedText style={styles.caseBadge}>Active Incident</ThemedText>
              <ThemedText style={styles.caseIdText}>
                {currentCase?.id ?? 'case-demo-01'}
              </ThemedText>
            </View>

            <ThemedText style={styles.caseTitle}>
              {currentCase?.title ?? 'Workplace Incident'}
            </ThemedText>
            <ThemedText style={styles.caseDesc} numberOfLines={2}>
              {currentCase?.description}
            </ThemedText>

            <View style={styles.caseStatsRow}>
              <View style={styles.caseStatBox}>
                <ThemedText style={styles.caseStatNumber}>{evidence.length}</ThemedText>
                <ThemedText style={styles.caseStatLabel}>Evidence items</ThemedText>
              </View>
              <View style={styles.caseStatDivider} />
              <View style={styles.caseStatBox}>
                <ThemedText style={styles.caseStatNumber}>{claims.length}</ThemedText>
                <ThemedText style={styles.caseStatLabel}>Tracked claims</ThemedText>
              </View>
            </View>

            <Pressable
              onPress={() => router.push(`/incident/${currentCase?.id ?? 'case-demo-01'}`)}
              style={({ pressed }) => [
                styles.viewCaseButton,
                pressed && styles.buttonPressed,
              ]}>
              <ThemedText style={styles.viewCaseButtonText}>
                View full record details →
              </ThemedText>
            </Pressable>
          </ThemedView>

          {/* Support and Safety Future-Work Placeholders */}
          <ThemedText style={styles.sectionHeader}>
            SAFETY & SUPPORT PREVIEWS
          </ThemedText>

          <View style={styles.supportRow}>
            <Pressable
              onPress={() => router.push('/guardian')}
              style={({ pressed }) => [
                styles.supportCard,
                pressed && styles.cardPressed,
              ]}>
              <View style={styles.supportCardTop}>
                <Text style={styles.supportEmoji}>👥</Text>
                <ThemedText style={styles.supportCardTitle}>Guardian access</ThemedText>
              </View>
              <ThemedText style={styles.supportCardDesc}>
                Read-only view for a trusted family member or advocate.
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => router.push('/support')}
              style={({ pressed }) => [
                styles.supportCard,
                pressed && styles.cardPressed,
              ]}>
              <View style={styles.supportCardTop}>
                <Text style={styles.supportEmoji}>💜</Text>
                <ThemedText style={styles.supportCardTitle}>Support network</ThemedText>
              </View>
              <ThemedText style={styles.supportCardDesc}>
                Confidential connection to counselors and support teams.
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  scroll: {
    width: '100%',
  },
  scrollContent: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.six,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.one,
  },
  headerTextGroup: {
    gap: 2,
  },
  brandBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: BrandColors.indigo,
  },
  safetyPill: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  safetyPillText: {
    color: BrandColors.purple,
    fontSize: 11,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 2,
  },
  demoNotice: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  demoNoticeText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  createRecordButton: {
    backgroundColor: BrandColors.indigo,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: BrandColors.indigo,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  createRecordButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  createRecordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  createRecordIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createRecordTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  createRecordSubtitle: {
    color: '#EEF2FF',
    fontSize: 12,
    opacity: 0.9,
  },
  createRecordArrow: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createRecordArrowText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  gridSection: {
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gridCard: {
    flex: 1,
    minHeight: 116,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiFallback: {
    fontSize: 18,
  },
  iconFallbackWhite: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 20,
  },
  cardArrow: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardBody: {
    gap: 2,
    marginTop: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 19,
  },
  cardDesc: {
    fontSize: 11.5,
    fontWeight: '500',
    lineHeight: 15,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    marginTop: 6,
  },
  activeCaseCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BrandColors.border,
    gap: 10,
  },
  caseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caseBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  caseIdText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  caseDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  caseStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 2,
  },
  caseStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  caseStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  caseStatNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.indigo,
  },
  caseStatLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  viewCaseButton: {
    backgroundColor: BrandColors.indigoLight,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewCaseButtonText: {
    color: BrandColors.indigo,
    fontSize: 13,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  supportRow: {
    flexDirection: 'row',
    gap: 10,
  },
  supportCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    padding: 12,
    gap: 4,
  },
  supportCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  supportEmoji: {
    fontSize: 16,
  },
  supportCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  supportCardDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
});
