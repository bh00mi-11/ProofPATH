import type { Href } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, MaxContentWidth, Spacing } from '@/constants/theme';
import { apiCaseService } from '@/services/api-case-service';
import { useCaseState } from '@/context/CaseContext';
import {
  RemediesResult,
  RemedyPathway,
  RemedyEligibilityState,
} from '@/types/proofpath.types';
import { useTranslation } from '@/context/LanguageContext';
import { safeBack } from '@/utils/navigation';

const ELIGIBILITY_CONFIG: Record<
  RemedyEligibilityState,
  { label: string; bg: string; border: string; text: string }
> = {
  POTENTIALLY_ELIGIBLE: {
    label: 'POTENTIALLY ELIGIBLE',
    bg: '#DCFCE7',
    border: '#86EFAC',
    text: '#166534',
  },
  MORE_INFORMATION_NEEDED: {
    label: 'MORE INFO NEEDED',
    bg: '#FEF3C7',
    border: '#FDE68A',
    text: '#B45309',
  },
  REQUIRES_PROFESSIONAL_REVIEW: {
    label: 'REQUIRES STATUTORY REVIEW',
    bg: '#EDE9FE',
    border: '#C4B5FD',
    text: '#5B21B6',
  },
  NOT_APPLICABLE: {
    label: 'NOT APPLICABLE',
    bg: '#F1F5F9',
    border: '#CBD5E1',
    text: '#64748B',
  },
};

export default function VictimJusticeRemediesScreen() {
  const { t } = useTranslation();
  const { currentCase } = useCaseState();
  const caseId = currentCase?.id || 'case_demo_01';

  const [data, setData] = useState<RemediesResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRemedies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiCaseService.getRemedies(caseId);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load victim justice and remedies pathways.');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchRemedies();
  }, [fetchRemedies]);

  const openOfficialPortal = (url: string) => {
    // Pure verified static URLs without case tokens or personal identifiers
    Linking.openURL(url).catch(() => {
      alert(`Could not open external portal link: ${url}`);
    });
  };

  const dialHelpline = (num: string) => {
    Linking.openURL(`tel:${num}`).catch(() => {
      alert(`Direct helpline: ${num}`);
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
            <ThemedText type="title">{t.remedies.title}</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              {t.remedies.subtitle}
            </ThemedText>
          </View>

          {/* Neutrality & Statutory Disclaimer Banner */}
          <ThemedView type="backgroundElement" style={styles.disclaimerBanner}>
            <View style={styles.disclaimerHeader}>
              <ThemedText style={styles.disclaimerBadge}>{t.remedies.disclaimerTitle}</ThemedText>
              <ThemedText style={styles.disclaimerSubtitle}>Statutory Scrutiny Boundary</ThemedText>
            </View>
            <ThemedText style={styles.disclaimerText}>
              {t.remedies.disclaimerBody}
            </ThemedText>
          </ThemedView>

          {/* Loading State */}
          {loading && (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color={BrandColors.indigo} />
              <ThemedText style={styles.stateText}>
                Evaluating incident record against official Indian victim support and remedy schemes...
              </ThemedText>
            </View>
          )}

          {/* Error State */}
          {!loading && error && (
            <ThemedView type="backgroundElement" style={styles.errorBox}>
              <ThemedText style={styles.errorTitle}>Remedies Unavailable</ThemedText>
              <ThemedText style={styles.errorDesc}>{error}</ThemedText>
              <Pressable
                onPress={fetchRemedies}
                style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}>
                <ThemedText style={styles.retryBtnText}>Retry</ThemedText>
              </Pressable>
            </ThemedView>
          )}

          {/* Main Loaded Content */}
          {!loading && !error && data && (
            <>
              {/* Incident Context Overview Card */}
              <ThemedView type="backgroundElement" style={styles.summaryCard}>
                <View style={styles.summaryHeaderRow}>
                  <View>
                    <ThemedText style={styles.summaryLabel}>ASSESSED RECORD</ThemedText>
                    <ThemedText style={styles.summaryTitle}>{data.case_title}</ThemedText>
                  </View>
                  <View style={styles.categoryPill}>
                    <ThemedText style={styles.categoryPillText}>
                      {data.incident_categories.join(' • ').toUpperCase()}
                    </ThemedText>
                  </View>
                </View>

                {/* Quick Evidence State */}
                <View style={styles.factsRow}>
                  <ThemedText style={styles.factsText}>
                    <ThemedText style={{ fontWeight: '700' }}>Known Record:</ThemedText> {data.evidence_summary.supported_claims} supported claim(s),{' '}
                    {data.evidence_summary.total_artifacts} evidence artifact(s) in vault.
                    {data.evidence_summary.conflicted_claims > 0
                      ? ` (${data.evidence_summary.conflicted_claims} conflict(s) require resolution)`
                      : ''}
                  </ThemedText>
                </View>
              </ThemedView>

              {/* Remedy Pathways List */}
              <ThemedView type="backgroundElement" style={styles.pathwaysSection}>
                <ThemedText type="smallBold" style={styles.sectionTitle}>
                  CURATED REMEDY PATHWAYS ({data.total_pathways})
                </ThemedText>
                <ThemedText type="small" style={styles.sectionSub}>
                  Eligibility is assessed deterministically based solely on facts in your incident record.
                </ThemedText>

                <View style={styles.pathwaysList}>
                  {data.pathways.map((pathway: RemedyPathway) => {
                    const eligConf =
                      ELIGIBILITY_CONFIG[pathway.eligibility_state] ||
                      ELIGIBILITY_CONFIG.REQUIRES_PROFESSIONAL_REVIEW;

                    return (
                      <View key={pathway.id} style={styles.pathwayCard}>
                        {/* Card Header */}
                        <View style={styles.pathwayHeader}>
                          <View style={{ flex: 1 }}>
                            <ThemedText style={styles.pathwayTitle}>
                              {pathway.title}
                            </ThemedText>
                            <ThemedText style={styles.pathwayAuthority}>
                              {pathway.authority}
                            </ThemedText>
                            <ThemedText style={styles.pathwayLaw}>
                              Law: {pathway.governing_law}
                            </ThemedText>
                          </View>

                          <View
                            style={[
                              styles.eligibilityBadge,
                              { backgroundColor: eligConf.bg, borderColor: eligConf.border },
                            ]}>
                            <ThemedText
                              style={[styles.eligibilityBadgeText, { color: eligConf.text }]}>
                              {eligConf.label}
                            </ThemedText>
                          </View>
                        </View>

                        {/* Summary */}
                        <ThemedText style={styles.pathwaySummary}>
                          {pathway.summary}
                        </ThemedText>

                        {/* Eligibility Reason */}
                        <View style={styles.eligibilityReasonBox}>
                          <ThemedText style={styles.reasonLabel}>Eligibility Assessment:</ThemedText>
                          <ThemedText style={styles.reasonText}>
                            {pathway.eligibility_reason}
                          </ThemedText>
                        </View>

                        {/* Statutory Criteria */}
                        <View style={styles.criteriaBox}>
                          <ThemedText style={styles.boxHeading}>Statutory Criteria:</ThemedText>
                          {pathway.statutory_criteria.map((crit, cIdx) => (
                            <View key={cIdx} style={styles.bulletRow}>
                              <ThemedText style={styles.bulletDot}>•</ThemedText>
                              <ThemedText style={styles.bulletText}>{crit}</ThemedText>
                            </View>
                          ))}
                        </View>

                        {/* Known Facts */}
                        {pathway.known_facts.length > 0 && (
                          <View style={styles.knownFactsBox}>
                            <ThemedText style={styles.knownFactsHeading}>Known Facts in Record:</ThemedText>
                            {pathway.known_facts.map((kf, kIdx) => (
                              <View key={kIdx} style={styles.bulletRow}>
                                <ThemedText style={styles.knownDot}>✓</ThemedText>
                                <ThemedText style={styles.knownText}>{kf}</ThemedText>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Missing Information */}
                        {pathway.missing_info.length > 0 && (
                          <View style={styles.missingInfoBox}>
                            <ThemedText style={styles.missingHeading}>Missing Information to Clarify:</ThemedText>
                            {pathway.missing_info.map((mi, mIdx) => (
                              <View key={mIdx} style={styles.bulletRow}>
                                <ThemedText style={styles.missingDot}>?</ThemedText>
                                <ThemedText style={styles.missingText}>{mi}</ThemedText>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Required Documents */}
                        <View style={styles.docsBox}>
                          <ThemedText style={styles.boxHeading}>Required Documents:</ThemedText>
                          {pathway.required_documents.map((doc, dIdx) => (
                            <View key={dIdx} style={styles.bulletRow}>
                              <ThemedText style={styles.docDot}>📎</ThemedText>
                              <ThemedText style={styles.docText}>{doc}</ThemedText>
                            </View>
                          ))}
                        </View>

                        {/* Card Footer Actions */}
                        <View style={styles.pathwayFooter}>
                          <View>
                            <ThemedText style={styles.verifiedText}>
                              Verified: {pathway.last_verified}
                            </ThemedText>
                            {pathway.helpline && (
                              <Pressable
                                onPress={() => dialHelpline(pathway.helpline!)}
                                style={styles.helplineBtn}>
                                <ThemedText style={styles.helplineBtnText}>
                                  📞 Helpline: {pathway.helpline}
                                </ThemedText>
                              </Pressable>
                            )}
                          </View>

                          <Pressable
                            onPress={() => openOfficialPortal(pathway.official_portal_url)}
                            style={({ pressed }) => [styles.portalBtn, pressed && styles.pressed]}>
                            <ThemedText style={styles.portalBtnText}>
                              Official Portal ↗
                            </ThemedText>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ThemedView>
            </>
          )}

          {/* Quick Navigation Footer */}
          <ThemedView type="backgroundElement" style={styles.nextActionCard}>
            <ThemedText type="smallBold" style={styles.nextActionTag}>
              INTEGRATED WORKFLOWS
            </ThemedText>
            <ThemedText type="subtitle" style={styles.nextActionTitle}>
              Cross-reference incident data
            </ThemedText>
            <View style={styles.actionButtonsRow}>
              <Pressable
                style={styles.actionBtnSecondary}
                onPress={() => router.push('/legal-context' as Href)}>
                <ThemedText style={styles.actionBtnSecondaryText}>⚖️ Legal Context</ThemedText>
              </Pressable>
              <Pressable
                style={styles.actionBtnSecondary}
                onPress={() => router.push('/accountability' as Href)}>
                <ThemedText style={styles.actionBtnSecondaryText}>📋 Trail</ThemedText>
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
    gap: 10,
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
  factsRow: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
  },
  factsText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  pathwaysSection: {
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
  pathwaysList: {
    gap: 16,
  },
  pathwayCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  pathwayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  pathwayTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  pathwayAuthority: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '600',
    marginTop: 2,
  },
  pathwayLaw: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  eligibilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  eligibilityBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  pathwaySummary: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  eligibilityReasonBox: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 3,
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.indigo,
  },
  reasonText: {
    fontSize: 11.5,
    color: '#3730A3',
    lineHeight: 16,
  },
  criteriaBox: {
    gap: 4,
  },
  boxHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  bulletDot: {
    color: BrandColors.indigo,
    fontSize: 12,
    lineHeight: 16,
  },
  bulletText: {
    fontSize: 11.5,
    color: '#475569',
    flex: 1,
    lineHeight: 16,
  },
  knownFactsBox: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  knownFactsHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  knownDot: {
    color: '#16A34A',
    fontWeight: '800',
    fontSize: 11,
    lineHeight: 16,
  },
  knownText: {
    fontSize: 11.5,
    color: '#14532D',
    flex: 1,
    lineHeight: 16,
  },
  missingInfoBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  missingHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
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
  docsBox: {
    gap: 4,
  },
  docDot: {
    fontSize: 11,
    lineHeight: 16,
  },
  docText: {
    fontSize: 11.5,
    color: '#475569',
    flex: 1,
    lineHeight: 16,
  },
  pathwayFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  helplineBtn: {
    marginTop: 2,
  },
  helplineBtnText: {
    fontSize: 11,
    color: BrandColors.indigo,
    fontWeight: '700',
  },
  portalBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: BrandColors.indigoLight,
  },
  portalBtnText: {
    color: BrandColors.indigo,
    fontSize: 11.5,
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
    fontSize: 11,
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
    fontSize: 11,
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
