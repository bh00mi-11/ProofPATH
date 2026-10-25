import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Linking,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Colors } from '@/constants/theme';
import { useCaseState } from '@/context/CaseContext';
import { useTranslation } from '@/context/LanguageContext';

export default function HomeScreen() {
  const router = useRouter();
  const { currentCase, availableCases, selectCase, evidence, claims, isLoading, backendError, refreshData } = useCaseState();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const isWide = width >= 768;
  const isDesktop = width >= 1024;

  const caseId = currentCase?.id || 'demo-case-001';
  const evidenceCount = evidence?.length || 0;
  const claimsCount = claims?.length || 0;
  const eventsCount = evidenceCount + claimsCount;

  const handleCallEmergency = () => {
    Linking.openURL('tel:112');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.desktopScrollContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Safety Ribbon */}
        <View style={styles.emergencyRibbon}>
          <View style={styles.emergencyLeft}>
            <View style={styles.emergencyBadge}>
              <ThemedText style={styles.emergencyBadgeText}>EMERGENCY HELP</ThemedText>
            </View>
            <ThemedText style={styles.emergencyText}>
              In immediate danger, call 112. Guardian Mode records check-ins but does not automatically notify police or contacts.
            </ThemedText>
          </View>
          <View style={styles.emergencyActions}>
            <Pressable
              style={({ hovered, pressed }: any) => [
                styles.guardianButton,
                hovered && styles.guardianButtonHovered,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/guardian')}
              accessibilityRole="button"
              accessibilityLabel="Open Guardian Mode"
            >
              <ThemedText style={styles.guardianButtonText}>
                🛡 {t.navigation.guardianMode}
              </ThemedText>
            </Pressable>

            <Pressable
              style={({ hovered, pressed }: any) => [
                styles.sosButton,
                hovered && styles.sosButtonHovered,
                pressed && styles.pressed,
              ]}
              onPress={handleCallEmergency}
              accessibilityRole="button"
              accessibilityLabel="Call 112 emergency services"
            >
              <ThemedText style={styles.sosButtonText}>📞 112 SOS</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Hero Section: Clear value proposition */}
        <View style={[styles.heroCard, isDesktop && styles.desktopHeroCard]}>
          <View style={styles.heroContent}>
            <View style={styles.categoryPill}>
              <ThemedText style={styles.categoryPillText}>
                YOUR STORY, YOUR CONTROL
              </ThemedText>
            </View>
            <ThemedText type="display" style={styles.heroTitle}>
              You can start here.
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Save a screenshot or message, see what it shows, and choose your next step. You don't have to do everything at once.
            </ThemedText>

            <View style={styles.heroCtaRow}>
              {currentCase ? (
                <Pressable
                  style={({ hovered, pressed }: any) => [
                    styles.primaryCta,
                    hovered && styles.primaryCtaHovered,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => router.push('/evidence')}
                  accessibilityRole="button"
                  accessibilityLabel="Continue Active Case"
                >
                  <ThemedText style={styles.primaryCtaText}>
                    Continue Case: {currentCase.title ? (currentCase.title.length > 16 ? `${currentCase.title.slice(0, 16)}...` : currentCase.title) : 'Active Case'} →
                  </ThemedText>
                </Pressable>
              ) : (
                <Pressable
                  style={({ hovered, pressed }: any) => [
                    styles.primaryCta,
                    hovered && styles.primaryCtaHovered,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => router.push('/incident/create')}
                  accessibilityRole="button"
                  accessibilityLabel="Create New Incident Record"
                >
                  <ThemedText style={styles.primaryCtaText}>
                    + Start a Private Record
                  </ThemedText>
                </Pressable>
              )}

              <Pressable
                style={({ hovered, pressed }: any) => [
                  styles.secondaryCta,
                  hovered && styles.secondaryCtaHovered,
                  pressed && styles.pressed,
                ]}
                onPress={() => router.push('/incident/create')}
                accessibilityRole="button"
                accessibilityLabel="Create another case"
              >
                <ThemedText style={styles.secondaryCtaText}>
                  + New Case
                </ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Active Case Status Summary */}
          <View style={[styles.statusBox, !isWide && styles.statusBoxMobile]}>
            <View style={styles.statusBoxHeader}>
              <View style={styles.caseIndicator}>
                <View style={styles.liveDot} />
                <ThemedText type="smallBold" style={styles.caseIdText}>
                  {currentCase?.title || `Case #${caseId.slice(0, 10)}`}
                </ThemedText>
              </View>
              <Pressable
                style={styles.refreshButton}
                onPress={() => refreshData()}
                accessibilityRole="button"
                accessibilityLabel="Refresh case status"
              >
                <ThemedText style={styles.refreshIcon}>↻</ThemedText>
              </Pressable>
            </View>

            {availableCases && availableCases.length > 1 && (
              <View style={styles.caseSwitcherHeader}>
                <ThemedText type="small" style={styles.caseSwitchPrompt}>Switch Case:</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.casePillScroll}>
                  {availableCases.map((c) => {
                    const isSelected = c.id === currentCase?.id;
                    const shortId = c.id.replace(/^case_/, '').slice(0, 4);
                    const label = c.title ? (c.title.length > 15 ? `${c.title.slice(0, 15)}...` : c.title) : c.id;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => selectCase(c.id)}
                        style={[styles.homeCasePill, isSelected && styles.homeCasePillActive]}
                      >
                        <ThemedText style={isSelected ? styles.homeCasePillTextActive : styles.homeCasePillTextInactive}>
                          {label} (#{shortId})
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View style={styles.metricGrid}>
              <View style={styles.metricItem}>
                <ThemedText style={styles.metricNumber}>{evidenceCount}</ThemedText>
                <ThemedText style={styles.metricLabel}>Saved files</ThemedText>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <ThemedText style={styles.metricNumber}>{claimsCount}</ThemedText>
                <ThemedText style={styles.metricLabel}>Statements</ThemedText>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <ThemedText style={styles.metricNumber}>{eventsCount}</ThemedText>
                <ThemedText style={styles.metricLabel}>Details</ThemedText>
              </View>
            </View>

            <View style={styles.integrityBadge}>
              <ThemedText style={styles.integrityText}>
                View saved file integrity details in Evidence Vault
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Backend Connectivity / Notice State */}
        {backendError ? (
          <View style={styles.errorNotice}>
            <ThemedText style={styles.errorIcon}>⚠</ThemedText>
            <ThemedText style={styles.errorNoticeText}>
              {t.common.backendOfflineNotice}: {backendError}
            </ThemedText>
          </View>
        ) : null}

        {/* 5-Step Guided Journey */}
        <View style={styles.pillarsSection}>
          <View style={styles.sectionHeader}>
            <ThemedText type="headline" style={styles.sectionTitle}>
              Your 5-Step Documentation Journey
            </ThemedText>
            <ThemedText style={styles.sectionDescription}>
              Follow these continuous steps to build a tamper-resistant record without losing your active case.
            </ThemedText>
          </View>

          <View style={[styles.pillarGrid, isWide && styles.pillarGridWide]}>
            {/* Step 1: Save Evidence */}
            <Pressable
              style={({ hovered, pressed }: any) => [
                styles.pillarCard,
                hovered && styles.pillarCardHovered,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/evidence')}
              accessibilityRole="button"
              accessibilityLabel="Navigate to Evidence Vault"
            >
              <View style={[styles.pillarIconBadge, { backgroundColor: BrandColors.indigoLight }]}>
                <ThemedText style={styles.pillarIconEmoji}>📁</ThemedText>
              </View>
              <ThemedText style={styles.stepCounterText}>STEP 1</ThemedText>
              <ThemedText type="title2" style={styles.pillarTitle}>
                Save Evidence
              </ThemedText>
              <ThemedText style={styles.pillarText}>
                Add messages, screenshots, and call logs. ProofPath computes cryptographic SHA-256 digests instantly.
              </ThemedText>
              <View style={styles.pillarLinkRow}>
                <ThemedText style={[styles.pillarLink, { color: BrandColors.indigo }]}>
                  Open Evidence Vault →
                </ThemedText>
              </View>
            </Pressable>

            {/* Step 2: Review Claims */}
            <Pressable
              style={({ hovered, pressed }: any) => [
                styles.pillarCard,
                hovered && styles.pillarCardHovered,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/evidence')}
              accessibilityRole="button"
              accessibilityLabel="Navigate to Claims Review"
            >
              <View style={[styles.pillarIconBadge, { backgroundColor: BrandColors.purpleLight }]}>
                <ThemedText style={styles.pillarIconEmoji}>⚖</ThemedText>
              </View>
              <ThemedText style={styles.stepCounterText}>STEP 2</ThemedText>
              <ThemedText type="title2" style={styles.pillarTitle}>
                Review Statements
              </ThemedText>
              <ThemedText style={styles.pillarText}>
                Link factual details to your statements and understand what evidence SUPPORTS or CONTRADICTS each claim.
              </ThemedText>
              <View style={styles.pillarLinkRow}>
                <ThemedText style={[styles.pillarLink, { color: BrandColors.purple }]}>
                  Trace Engine Assessment →
                </ThemedText>
              </View>
            </Pressable>

            {/* Step 3: Test Changes (Time Machine & Stress Test) */}
            <Pressable
              style={({ hovered, pressed }: any) => [
                styles.pillarCard,
                hovered && styles.pillarCardHovered,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/time-machine')}
              accessibilityRole="button"
              accessibilityLabel="Navigate to Time Machine & Stress Test"
            >
              <View style={[styles.pillarIconBadge, { backgroundColor: BrandColors.tealLight }]}>
                <ThemedText style={styles.pillarIconEmoji}>⏱</ThemedText>
              </View>
              <ThemedText style={styles.stepCounterText}>STEP 3</ThemedText>
              <ThemedText type="title2" style={styles.pillarTitle}>
                Test Changes
              </ThemedText>
              <ThemedText style={styles.pillarText}>
                Use Time Machine to simulate leaving out disputed evidence and check whether your case holds up under stress.
              </ThemedText>
              <View style={styles.pillarLinkRow}>
                <ThemedText style={[styles.pillarLink, { color: BrandColors.teal }]}>
                  Time Machine & Stress Test →
                </ThemedText>
              </View>
            </Pressable>

            {/* Step 4: Share Safely (Privacy Lens & PDF) */}
            <Pressable
              style={({ hovered, pressed }: any) => [
                styles.pillarCard,
                hovered && styles.pillarCardHovered,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/privacy')}
              accessibilityRole="button"
              accessibilityLabel="Navigate to Privacy Lens"
            >
              <View style={[styles.pillarIconBadge, { backgroundColor: BrandColors.roseLight }]}>
                <ThemedText style={styles.pillarIconEmoji}>🛡</ThemedText>
              </View>
              <ThemedText style={styles.stepCounterText}>STEP 4</ThemedText>
              <ThemedText type="title2" style={styles.pillarTitle}>
                Share Safely
              </ThemedText>
              <ThemedText style={styles.pillarText}>
                Apply role allowlists (Trusted Contact, Legal Professional) to redact private details before generating your report.
              </ThemedText>
              <View style={styles.pillarLinkRow}>
                <ThemedText style={[styles.pillarLink, { color: BrandColors.rose }]}>
                  Privacy Lens & PDF Export →
                </ThemedText>
              </View>
            </Pressable>

            {/* Step 5: Track Progress & Next Steps */}
            <Pressable
              style={({ hovered, pressed }: any) => [
                styles.pillarCard,
                hovered && styles.pillarCardHovered,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/support')}
              accessibilityRole="button"
              accessibilityLabel="Navigate to Support and Remedies"
            >
              <View style={[styles.pillarIconBadge, { backgroundColor: '#E2E8F0' }]}>
                <ThemedText style={styles.pillarIconEmoji}>📋</ThemedText>
              </View>
              <ThemedText style={styles.stepCounterText}>STEP 5</ThemedText>
              <ThemedText type="title2" style={styles.pillarTitle}>
                Track Progress
              </ThemedText>
              <ThemedText style={styles.pillarText}>
                Log institutional interactions in the Accountability Trail and access localized helplines and legal remedies.
              </ThemedText>
              <View style={styles.pillarLinkRow}>
                <ThemedText style={[styles.pillarLink, { color: Colors.light.text }]}>
                  Accountability & Next Steps →
                </ThemedText>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Technical Explanations Card for First-Time Users */}
        <View style={styles.guideCard}>
          <ThemedText type="title2" style={styles.guideTitle}>
            📖 Understanding Assessment Labels & Tools
          </ThemedText>
          <View style={styles.guideGrid}>
            <View style={styles.guideItem}>
              <ThemedText type="smallBold" style={{ color: '#059669' }}>✓ SUPPORTED</ThemedText>
              <ThemedText type="small" style={styles.guideText}>Active evidence files corroborate the recorded statement.</ThemedText>
            </View>
            <View style={styles.guideItem}>
              <ThemedText type="smallBold" style={{ color: '#DC2626' }}>✕ CONFLICTED</ThemedText>
              <ThemedText type="small" style={styles.guideText}>Contradictory timestamps or conflicting records exist across active sources.</ThemedText>
            </View>
            <View style={styles.guideItem}>
              <ThemedText type="smallBold" style={{ color: '#475569' }}>○ UNVERIFIED</ThemedText>
              <ThemedText type="small" style={styles.guideText}>No active evidence sources currently back this statement.</ThemedText>
            </View>
            <View style={styles.guideItem}>
              <ThemedText type="smallBold" style={{ color: '#D97706' }}>⚠ REVIEW_NEEDED</ThemedText>
              <ThemedText type="small" style={styles.guideText}>Cryptographic hash mismatch or only contradictory observations found.</ThemedText>
            </View>
          </View>
        </View>

        {/* Responsible Safety Notice / Legal Boundary */}
        <View style={styles.disclaimerContainer}>
          <View style={styles.disclaimerHeader}>
            <ThemedText style={styles.disclaimerIcon}>ℹ</ThemedText>
            <ThemedText style={styles.disclaimerTitle}>
              {t.common.disclaimerPrefix}
            </ThemedText>
          </View>
          <ThemedText style={styles.disclaimerText}>
            {t.home.systemIntegrityNotice}
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
  },
  desktopScrollContent: {
    paddingHorizontal: 32,
    paddingTop: 24,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },

  // Emergency Ribbon
  emergencyRibbon: {
    backgroundColor: BrandColors.roseLight,
    borderWidth: 1,
    borderColor: BrandColors.roseBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  emergencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 260,
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BrandColors.roseBorder,
  },
  emergencyBadgeIcon: {
    fontSize: 12,
  },
  emergencyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: BrandColors.rose,
    letterSpacing: 0.5,
  },
  emergencyText: {
    fontSize: 13,
    color: '#881337',
    fontWeight: '500',
    flex: 1,
  },
  emergencyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guardianButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BrandColors.tealBorder,
  },
  guardianButtonHovered: {
    backgroundColor: BrandColors.tealLight,
  },
  guardianButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.teal,
  },
  sosButton: {
    backgroundColor: BrandColors.rose,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sosButtonHovered: {
    backgroundColor: '#BE123C',
  },
  sosButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Hero Card
  heroCard: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 24,
    marginBottom: 28,
    flexDirection: 'column',
    gap: 20,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        }
      : {
          elevation: 2,
        }),
  },
  desktopHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 32,
  },
  heroContent: {
    flex: 1,
    gap: 12,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: BrandColors.indigoLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.indigo,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.textSecondary,
    maxWidth: 600,
  },
  heroCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  primaryCta: {
    backgroundColor: BrandColors.indigo,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryCtaHovered: {
    backgroundColor: BrandColors.indigoHover,
  },
  primaryCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryCta: {
    backgroundColor: Colors.light.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  secondaryCtaHovered: {
    backgroundColor: Colors.light.border,
  },
  secondaryCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },

  // Status Box
  statusBox: {
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
    minWidth: 280,
    gap: 14,
  },
  statusBoxMobile: {
    width: '100%',
  },
  statusBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  caseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandColors.success,
  },
  caseIdText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  refreshButton: {
    padding: 4,
  },
  refreshIcon: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  metricGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: BrandColors.indigo,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.light.border,
  },
  integrityBadge: {
    backgroundColor: BrandColors.tealLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BrandColors.tealBorder,
    alignItems: 'center',
  },
  integrityText: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.teal,
  },

  // Error Notice
  errorNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: BrandColors.dangerLight,
    borderWidth: 1,
    borderColor: BrandColors.dangerBorder,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorIcon: {
    fontSize: 16,
    color: BrandColors.danger,
  },
  errorNoticeText: {
    fontSize: 13,
    color: BrandColors.danger,
    fontWeight: '500',
    flex: 1,
  },

  // Pillars Section
  pillarsSection: {
    gap: 18,
    marginBottom: 32,
  },
  sectionHeader: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.3,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  pillarGrid: {
    gap: 16,
  },
  pillarGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pillarCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 20,
    gap: 12,
    ...(Platform.OS === 'web'
      ? {
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        }
      : {
          elevation: 1,
        }),
  },
  pillarCardHovered: {
    borderColor: BrandColors.indigoBorder,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 8px 16px -4px rgba(67, 56, 202, 0.1)',
          transform: 'translateY(-2px)',
        }
      : {}),
  },
  pillarIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarIconEmoji: {
    fontSize: 20,
  },
  pillarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
  },
  pillarText: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  pillarLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pillarLink: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Legal Notice
  disclaimerContainer: {
    backgroundColor: Colors.light.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disclaimerIcon: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  disclaimerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.light.textSecondary,
  },

  pressed: {
    opacity: 0.85,
  },

  // 5-Step Journey & Contextual Guide additions
  stepCounterText: {
    fontSize: 10,
    fontWeight: '800',
    color: BrandColors.indigo,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  caseSwitcherHeader: {
    marginTop: 10,
    gap: 4,
  },
  caseSwitchPrompt: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  casePillScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  homeCasePill: {
    backgroundColor: Colors.light.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  homeCasePillActive: {
    backgroundColor: BrandColors.indigoLight,
    borderColor: BrandColors.indigoBorder,
  },
  homeCasePillTextActive: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.indigo,
  },
  homeCasePillTextInactive: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  guideCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    gap: 12,
    marginBottom: 20,
  },
  guideTitle: {
    fontSize: 15,
    color: Colors.light.text,
  },
  guideGrid: {
    gap: 10,
  },
  guideItem: {
    gap: 2,
  },
  guideText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
});
