import type { Href } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, MaxContentWidth, Spacing } from '@/constants/theme';
import { apiCaseService } from '@/services/api-case-service';
import { useCaseState } from '@/context/CaseContext';
import { LegalContextResult, LegalProvision } from '@/types/proofpath.types';
import { useTranslation } from '@/context/LanguageContext';
import { safeBack } from '@/utils/navigation';

export default function LegalContextScreen() {
  const { t } = useTranslation();
  const { currentCase } = useCaseState();
  const caseId = currentCase?.id;

  const [data, setData] = useState<LegalContextResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLegalContext = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!caseId) { setError('Create or select a case first.'); return; }
      const res = await apiCaseService.getLegalContext(caseId);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load Indian legal context mapping.');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchLegalContext();
  }, [fetchLegalContext]);

  const openSourceUrl = (url: string) => {
    // Verified pure static India Code URLs containing zero case or user parameters
    Linking.openURL(url).catch(() => {
      alert(`Could not open source link: ${url}`);
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => safeBack('/support')} style={styles.backButton}>
              <ThemedText type="smallBold" style={styles.backButtonText}>
                ← {t.common.backToOverview}
              </ThemedText>
            </Pressable>
            <ThemedText type="title">{t.legalContext.title}</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              {t.legalContext.subtitle}
            </ThemedText>
          </View>

          {/* Mandatory Non-Legal-Advice Disclaimer Banner */}
          <ThemedView type="backgroundElement" style={styles.disclaimerBanner}>
            <View style={styles.disclaimerHeader}>
              <ThemedText style={styles.disclaimerBadge}>{t.legalContext.disclaimerTitle}</ThemedText>
              <ThemedText style={styles.disclaimerSubtitle}>Statutory Reference Boundary</ThemedText>
            </View>
            <ThemedText style={styles.disclaimerText}>
              {t.legalContext.disclaimerBody}
            </ThemedText>
          </ThemedView>

          {/* Loading State */}
          {loading && (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color={BrandColors.indigo} />
              <ThemedText style={styles.stateText}>
                Evaluating recorded incident claims against verified Indian legislation...
              </ThemedText>
            </View>
          )}

          {/* Error State */}
          {!loading && error && (
            <ThemedView type="backgroundElement" style={styles.errorBox}>
              <ThemedText style={styles.errorTitle}>Legal Context Unavailable</ThemedText>
              <ThemedText style={styles.errorDesc}>{error}</ThemedText>
              <Pressable
                onPress={fetchLegalContext}
                style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}>
                <ThemedText style={styles.retryBtnText}>Retry</ThemedText>
              </Pressable>
            </ThemedView>
          )}

          {/* Main Loaded Content */}
          {!loading && !error && data && (
            <>
              {/* Evidence & Case Overview Card */}
              <ThemedView type="backgroundElement" style={styles.summaryCard}>
                <View style={styles.summaryHeaderRow}>
                  <View>
                    <ThemedText style={styles.summaryLabel}>EVALUATED INCIDENT RECORD</ThemedText>
                    <ThemedText style={styles.summaryTitle}>{data.case_title}</ThemedText>
                  </View>
                  <View style={styles.categoryPill}>
                    <ThemedText style={styles.categoryPillText}>
                      {data.incident_categories.join(' • ').toUpperCase()}
                    </ThemedText>
                  </View>
                </View>

                {/* Trace Correlation Metrics */}
                <View style={styles.traceMetricsGrid}>
                  <View style={styles.traceMetricBox}>
                    <ThemedText style={styles.metricNumber}>
                      {data.evidence_summary.supported_claims_count}
                    </ThemedText>
                    <ThemedText style={styles.metricLabel}>Supported Claims</ThemedText>
                  </View>
                  <View style={styles.traceMetricBox}>
                    <ThemedText
                      style={[
                        styles.metricNumber,
                        data.evidence_summary.conflicted_claims_count > 0 && { color: '#B45309' },
                      ]}>
                      {data.evidence_summary.conflicted_claims_count}
                    </ThemedText>
                    <ThemedText style={styles.metricLabel}>Conflicts Found</ThemedText>
                  </View>
                  <View style={styles.traceMetricBox}>
                    <ThemedText style={styles.metricNumber}>
                      {data.evidence_summary.unverified_claims_count}
                    </ThemedText>
                    <ThemedText style={styles.metricLabel}>Unverified Claims</ThemedText>
                  </View>
                </View>

                <ThemedText style={styles.traceNeutralNote}>
                  ℹ️ Claims supported in ProofPath reflect internal evidence consistency; they do not substantiate a court-proven legal finding.
                </ThemedText>
              </ThemedView>

              {/* Potentially Relevant Statutory Frameworks */}
              <ThemedView type="backgroundElement" style={styles.provisionsSection}>
                <ThemedText type="smallBold" style={styles.sectionTitle}>
                  POTENTIALLY RELEVANT STATUTORY FRAMEWORKS ({data.relevant_provisions_count})
                </ThemedText>
                <ThemedText type="small" style={styles.sectionSub}>
                  Deterministic mapping based on user-recorded claims. Official provisions sourced directly from India Code.
                </ThemedText>

                <View style={styles.provisionsList}>
                  {data.provisions.map((prov: LegalProvision) => (
                    <View key={prov.id} style={styles.provisionCard}>
                      {/* Provision Header */}
                      <View style={styles.provisionHeader}>
                        <View style={{ flex: 1 }}>
                          <View style={styles.lawPillRow}>
                            <View style={styles.shortLawBadge}>
                              <ThemedText style={styles.shortLawBadgeText}>
                                {prov.short_law}
                              </ThemedText>
                            </View>
                            <ThemedText style={styles.sectionBadge}>
                              {prov.section}
                            </ThemedText>
                          </View>
                          <ThemedText style={styles.provisionTitle}>
                            {prov.title}
                          </ThemedText>
                          <ThemedText style={styles.lawFullName}>
                            {prov.law_name}
                          </ThemedText>
                        </View>

                        <View style={styles.verifiedBadge}>
                          <ThemedText style={styles.verifiedBadgeText}>
                            ✓ VERIFIED
                          </ThemedText>
                        </View>
                      </View>

                      {/* Plain Language Summary */}
                      <ThemedText style={styles.plainDescription}>
                        {prov.plain_description}
                      </ThemedText>

                      {/* Why Relevant */}
                      <View style={styles.relevanceBox}>
                        <ThemedText style={styles.relevanceLabel}>Why it may be relevant:</ThemedText>
                        <ThemedText style={styles.relevanceText}>{prov.why_relevant}</ThemedText>
                      </View>

                      {/* Conditions to Establish */}
                      <View style={styles.conditionsBox}>
                        <ThemedText style={styles.conditionsLabel}>
                          Conditions that must be established:
                        </ThemedText>
                        {prov.statutory_conditions.map((cond, cIdx) => (
                          <View key={cIdx} style={styles.conditionBullet}>
                            <ThemedText style={styles.conditionDot}>•</ThemedText>
                            <ThemedText style={styles.conditionText}>{cond}</ThemedText>
                          </View>
                        ))}
                      </View>

                      {/* Potential Missing Information */}
                      <View style={styles.missingFactsBox}>
                        <ThemedText style={styles.missingFactsLabel}>
                          Missing information or facts to clarify:
                        </ThemedText>
                        {prov.missing_facts.map((fact, fIdx) => (
                          <View key={fIdx} style={styles.missingBullet}>
                            <ThemedText style={styles.missingDot}>?</ThemedText>
                            <ThemedText style={styles.missingText}>{fact}</ThemedText>
                          </View>
                        ))}
                      </View>

                      {/* Source Link & Verification Timestamp */}
                      <View style={styles.provisionFooter}>
                        <ThemedText style={styles.verifiedTimestamp}>
                          Verified on India Code: {prov.last_verified}
                        </ThemedText>
                        <Pressable
                          onPress={() => openSourceUrl(prov.official_source_url)}
                          style={({ pressed }) => [styles.sourceLinkBtn, pressed && styles.pressed]}>
                          <ThemedText style={styles.sourceLinkText}>
                            View Statutory Text ↗
                          </ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </ThemedView>

              {/* Legal Consultation Advisory Card */}
              <ThemedView type="backgroundElement" style={styles.advisoryCard}>
                <ThemedText style={styles.advisoryTitle}>Seeking Professional Assistance</ThemedText>
                <ThemedText style={styles.advisoryText}>
                  Statutory interpretation in India depends on procedural compliance, jurisdiction, and judicial assessment.
                  If you are planning to file a formal complaint, consider consulting with an advocate, workplace committee member, or verified legal aid organization.
                </ThemedText>
                <Pressable
                  onPress={() => router.push('/support')}
                  style={({ pressed }) => [styles.supportLinkBtn, pressed && styles.pressed]}>
                  <ThemedText style={styles.supportLinkBtnText}>
                    View Verified Legal Aid & Support Resources →
                  </ThemedText>
                </Pressable>
              </ThemedView>
            </>
          )}

          {/* Quick Navigation Footer */}
          <ThemedView type="backgroundElement" style={styles.nextActionCard}>
            <ThemedText type="smallBold" style={styles.nextActionTag}>
              INTEGRATED ACTIONS
            </ThemedText>
            <ThemedText type="subtitle" style={styles.nextActionTitle}>
              Navigate incident workflows
            </ThemedText>
            <View style={styles.actionButtonsRow}>
              <Pressable
                style={styles.actionBtnSecondary}
                onPress={() => router.push('/accountability' as Href)}>
                <ThemedText style={styles.actionBtnSecondaryText}>📋 Trail</ThemedText>
              </Pressable>
              <Pressable
                style={styles.actionBtnSecondary}
                onPress={() => router.push('/stress-test' as Href)}>
                <ThemedText style={styles.actionBtnSecondaryText}>⚡ Stress Test</ThemedText>
              </Pressable>
              <Pressable
                style={styles.actionBtnSecondary}
                onPress={() => router.push('/support')}>
                <ThemedText style={styles.actionBtnSecondaryText}>🧭 Next Steps</ThemedText>
              </Pressable>
              <Pressable
                style={styles.actionBtnPrimary}
                onPress={() => router.push('/privacy')}>
                <ThemedText style={styles.actionBtnPrimaryText}>Share Pack →</ThemedText>
              </Pressable>
            </View>
          </ThemedView>
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
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: 40,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  header: {
    gap: 6,
    marginBottom: 4,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  backButtonText: {
    color: BrandColors.indigo,
  },
  subtitle: {
    color: '#64748B',
    lineHeight: 20,
  },
  disclaimerBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disclaimerBadge: {
    backgroundColor: '#B45309',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  disclaimerSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 17,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BrandColors.border,
    gap: 12,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: BrandColors.indigo,
    letterSpacing: 0.8,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  categoryPill: {
    backgroundColor: BrandColors.indigoLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryPillText: {
    color: BrandColors.indigo,
    fontSize: 11,
    fontWeight: '800',
  },
  traceMetricsGrid: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  traceMetricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.indigo,
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  traceNeutralNote: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  provisionsSection: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BrandColors.border,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 0.8,
    color: BrandColors.indigo,
  },
  sectionSub: {
    color: '#64748B',
    marginTop: 2,
  },
  provisionsList: {
    gap: 16,
  },
  provisionCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  provisionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  lawPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  shortLawBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shortLawBadgeText: {
    color: '#3730A3',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  provisionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  lawFullName: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  verifiedBadgeText: {
    color: '#166534',
    fontSize: 9.5,
    fontWeight: '800',
  },
  plainDescription: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  relevanceBox: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  relevanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.indigo,
  },
  relevanceText: {
    fontSize: 11.5,
    color: '#3730A3',
    lineHeight: 16,
  },
  conditionsBox: {
    gap: 4,
  },
  conditionsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  conditionBullet: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  conditionDot: {
    color: BrandColors.indigo,
    fontSize: 12,
    lineHeight: 16,
  },
  conditionText: {
    fontSize: 11.5,
    color: '#475569',
    flex: 1,
    lineHeight: 16,
  },
  missingFactsBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  missingFactsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  missingBullet: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  missingDot: {
    color: '#D97706',
    fontWeight: '800',
    fontSize: 11,
    lineHeight: 16,
  },
  missingText: {
    fontSize: 11.5,
    color: '#92400E',
    flex: 1,
    lineHeight: 16,
  },
  provisionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 4,
  },
  verifiedTimestamp: {
    fontSize: 10,
    color: '#94A3B8',
  },
  sourceLinkBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  sourceLinkText: {
    color: BrandColors.indigo,
    fontSize: 11.5,
    fontWeight: '700',
  },
  advisoryCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  advisoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  advisoryText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  supportLinkBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  supportLinkBtnText: {
    color: BrandColors.indigo,
    fontSize: 12,
    fontWeight: '700',
  },
  nextActionCard: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BrandColors.border,
    gap: 8,
  },
  nextActionTag: {
    color: BrandColors.indigo,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  nextActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  actionBtnSecondary: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BrandColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  actionBtnSecondaryText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  actionBtnPrimary: {
    flex: 1.2,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: BrandColors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimaryText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stateContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  stateText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
  },
  errorBox: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    gap: 8,
  },
  errorTitle: {
    color: '#991B1B',
    fontWeight: '700',
    fontSize: 14,
  },
  errorDesc: {
    color: '#7F1D1D',
    fontSize: 12,
    lineHeight: 16,
  },
  retryBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
