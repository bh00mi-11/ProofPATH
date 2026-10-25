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
  const { currentCase, evidence, claims, isLoading, backendError, refreshData } = useCaseState();
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
        {/* Top Executive Platform Safety Ribbon */}
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

        {/* Hero Section: Clean, cohesive executive presentation */}
        <View style={[styles.heroCard, isDesktop && styles.desktopHeroCard]}>
          <View style={styles.heroContent}>
            <View style={styles.categoryPill}>
              <ThemedText style={styles.categoryPillText}>
                YOUR STORY, YOUR CONTROL
              </ThemedText>
            </View>
            <ThemedText type="display" style={styles.heroTitle}>
              Your evidence. Your story. Your control.
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Save what happened, understand what your records show, and decide what to share.
            </ThemedText>

            <View style={styles.heroCtaRow}>
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
                  + Create New Record
                </ThemedText>
              </Pressable>

              <Pressable
                style={({ hovered, pressed }: any) => [
                  styles.secondaryCta,
                  hovered && styles.secondaryCtaHovered,
                  pressed && styles.pressed,
                ]}
                onPress={() => router.push('/evidence')}
                accessibilityRole="button"
                accessibilityLabel="View evidence vault"
              >
                <ThemedText style={styles.secondaryCtaText}>
                  🗄 {t.home.evidenceVaultTitle}
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

            <View style={styles.metricGrid}>
              <View style={styles.metricItem}>
                <ThemedText style={styles.metricNumber}>{evidenceCount}</ThemedText>
                <ThemedText style={styles.metricLabel}>{t.navigation.evidenceTimeline}</ThemedText>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <ThemedText style={styles.metricNumber}>{claimsCount}</ThemedText>
                <ThemedText style={styles.metricLabel}>Claims</ThemedText>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <ThemedText style={styles.metricNumber}>{eventsCount}</ThemedText>
                <ThemedText style={styles.metricLabel}>Entries</ThemedText>
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

        {/* 4 Core Workflow Pillars */}
        <View style={styles.pillarsSection}>
          <View style={styles.sectionHeader}>
            <ThemedText type="headline" style={styles.sectionTitle}>
              Your next steps
            </ThemedText>
            <ThemedText style={styles.sectionDescription}>
              Save evidence, review what it shows, share carefully, and find support.
            </ThemedText>
          </View>

          <View style={[styles.pillarGrid, isWide && styles.pillarGridWide]}>
            {/* Pillar 1: Evidence */}
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
                <ThemedText style={styles.pillarIconEmoji}>🗄</ThemedText>
              </View>
              <ThemedText type="title2" style={styles.pillarTitle}>
                {t.navigation.evidenceTimeline}
              </ThemedText>
              <ThemedText style={styles.pillarText}>
                {t.home.evidenceVaultDesc}
              </ThemedText>
              <View style={styles.pillarLinkRow}>
                <ThemedText style={[styles.pillarLink, { color: BrandColors.indigo }]}>
                  {t.common.view} {t.navigation.evidenceTimeline} →
                </ThemedText>
              </View>
            </Pressable>

            {/* Pillar 2: Analysis */}
            <Pressable
              style={({ hovered, pressed }: any) => [
                styles.pillarCard,
                hovered && styles.pillarCardHovered,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/time-machine')}
              accessibilityRole="button"
              accessibilityLabel="Navigate to Analysis"
            >
              <View style={[styles.pillarIconBadge, { backgroundColor: BrandColors.tealLight }]}>
                <ThemedText style={styles.pillarIconEmoji}>⏱</ThemedText>
              </View>
              <ThemedText type="title2" style={styles.pillarTitle}>
                {t.navigation.analysis}
              </ThemedText>
              <ThemedText style={styles.pillarText}>
                {t.home.timeMachineDesc}
              </ThemedText>
              <View style={styles.pillarLinkRow}>
                <ThemedText style={[styles.pillarLink, { color: BrandColors.teal }]}>
                  {t.navigation.whatIfRemoved} & {t.navigation.stressTest} →
                </ThemedText>
              </View>
            </Pressable>

            {/* Pillar 3: Share Safely */}
            <Pressable
              style={({ hovered, pressed }: any) => [
                styles.pillarCard,
                hovered && styles.pillarCardHovered,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/privacy')}
              accessibilityRole="button"
              accessibilityLabel="Navigate to Privacy & Sharing"
            >
              <View style={[styles.pillarIconBadge, { backgroundColor: BrandColors.roseLight }]}>
                <ThemedText style={styles.pillarIconEmoji}>🛡</ThemedText>
              </View>
              <ThemedText type="title2" style={styles.pillarTitle}>
                {t.navigation.shareSafely}
              </ThemedText>
              <ThemedText style={styles.pillarText}>
                {t.home.privacyLensDesc}
              </ThemedText>
              <View style={styles.pillarLinkRow}>
                <ThemedText style={[styles.pillarLink, { color: BrandColors.rose }]}>
                  {t.navigation.chooseWhatToShare} →
                </ThemedText>
              </View>
            </Pressable>

            {/* Pillar 4: Support & Remedies */}
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
              <View style={[styles.pillarIconBadge, { backgroundColor: BrandColors.mutedLight }]}>
                <ThemedText style={styles.pillarIconEmoji}>⚖</ThemedText>
              </View>
              <ThemedText type="title2" style={styles.pillarTitle}>
                {t.navigation.supportSection}
              </ThemedText>
              <ThemedText style={styles.pillarText}>
                {t.home.navigatorDesc}
              </ThemedText>
              <View style={styles.pillarLinkRow}>
                <ThemedText style={[styles.pillarLink, { color: Colors.light.text }]}>
                  {t.navigation.nextSteps} & {t.navigation.remediesJustice} →
                </ThemedText>
              </View>
            </Pressable>
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
});
