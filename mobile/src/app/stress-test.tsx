import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { apiCaseService } from '@/services/api-case-service';
import { useCaseState } from '@/context/CaseContext';
import type { StressTestResult, StressTestIssue, StressTestChecklist } from '@/types/proofpath.types';
import { useTranslation } from '@/context/LanguageContext';

export default function StressTestScreen() {
  const { t } = useTranslation();
  const { currentCase } = useCaseState();
  const caseId = currentCase?.id;
  const [data, setData] = useState<StressTestResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const fetchStressTest = useCallback(async () => {
    if (!caseId) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiCaseService.runStressTest(caseId);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Could not connect to FastAPI backend at http://localhost:8000');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchStressTest();
  }, [fetchStressTest]);

  const getSeverityBadgeStyle = (severity: StressTestIssue['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return { bg: BrandColors.dangerLight, border: BrandColors.dangerBorder, text: BrandColors.danger };
      case 'HIGH':
        return { bg: BrandColors.warningLight, border: BrandColors.warningBorder, text: BrandColors.warning };
      case 'MEDIUM':
        return { bg: BrandColors.indigoLight, border: BrandColors.indigoBorder, text: BrandColors.indigo };
      default:
        return { bg: Colors.light.backgroundSubtle, border: Colors.light.border, text: Colors.light.textSecondary };
    }
  };

  const checklistItems = data?.checklist || [];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.desktopScrollContent,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={styles.workspacePill}>
                <ThemedText style={styles.workspacePillText}>ANALYSIS WORKSPACE</ThemedText>
              </View>
              <ThemedText type="small" style={styles.caseBadge}>
                Deterministic Consistency Engine
              </ThemedText>
            </View>
            <ThemedText type="title">{t.stressTest.title}</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              {t.stressTest.subtitle}
            </ThemedText>
          </View>

          {/* Sub-Tabs / Mode Switcher */}
          <View style={styles.modeTabBar}>
            <Pressable
              style={styles.modeTab}
              onPress={() => router.push('/time-machine')}
            >
              <ThemedText type="smallBold" style={styles.modeTabTextInactive}>
                ⏱ Time Machine (Exclusion Simulation)
              </ThemedText>
            </Pressable>
            <View style={[styles.modeTab, styles.modeTabActive]}>
              <ThemedText type="smallBold" style={styles.modeTabTextActive}>
                🔬 Record Stress Test (5-Point Check)
              </ThemedText>
            </View>
          </View>

          {/* Honest Disclaimer Banner */}
          <ThemedView type="backgroundElement" style={styles.disclaimerBanner}>
            <ThemedText type="smallBold" style={styles.disclaimerTitle}>
              {t.stressTest.disclaimerTitle}
            </ThemedText>
            <ThemedText type="small" style={styles.disclaimerBody}>
              {t.stressTest.disclaimerBody}
            </ThemedText>
          </ThemedView>

          {!caseId && !loading ? (
            <View style={styles.centerBox}><ThemedText>Create or select a case to run its stress test.</ThemedText></View>
          ) : null}

          {/* Loading State */}
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={BrandColors.indigo} />
              <ThemedText style={styles.loadingText}>
                Executing 5 deterministic consistency rules across case records...
              </ThemedText>
            </View>
          ) : null}

          {/* Backend Error State */}
          {error ? (
            <View style={styles.errorBox}>
              <ThemedText style={styles.errorTitle}>Backend Connection Notice</ThemedText>
              <ThemedText style={styles.errorMsg}>{error}</ThemedText>
              <ThemedText style={styles.errorDesc}>
                Silent mock fallback is strictly disabled. Please verify the FastAPI backend is running on port 8000.
              </ThemedText>
              <Pressable onPress={fetchStressTest} style={styles.retryButton}>
                <ThemedText style={styles.retryButtonText}>Tap to Retry</ThemedText>
              </Pressable>
            </View>
          ) : null}

          {/* Stress Test Results */}
          {!loading && !error && data ? (
            <View style={styles.resultsContainer}>
              {/* Overall Summary Card */}
              <ThemedView type="backgroundElement" style={styles.summaryCard}>
                <View style={styles.summaryTop}>
                  <ThemedText type="subtitle" style={styles.summaryTitle}>
                    Consistency Evaluation Summary
                  </ThemedText>
                  <View
                    style={[
                      styles.summaryBadge,
                      {
                        backgroundColor:
                          data.total_issues === 0 ? BrandColors.successLight : BrandColors.warningLight,
                        borderColor:
                          data.total_issues === 0 ? BrandColors.successBorder : BrandColors.warningBorder,
                      },
                    ]}
                  >
                    <ThemedText
                      type="smallBold"
                      style={{
                        color: data.total_issues === 0 ? BrandColors.success : BrandColors.warning,
                      }}
                    >
                      {data.total_issues === 0
                        ? 'PASS: 0 CONFLICTS DETECTED'
                        : `${data.total_issues} ISSUE(S) FLAGGED FOR REVIEW`}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <ThemedText style={styles.metricNumber}>{checklistItems.length}</ThemedText>
                    <ThemedText style={styles.metricLabel}>Deterministic Rules</ThemedText>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <ThemedText style={styles.metricNumber}>
                      {checklistItems.filter((r) => r.passed).length}
                    </ThemedText>
                    <ThemedText style={styles.metricLabel}>Passed Checks</ThemedText>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <ThemedText style={[styles.metricNumber, { color: BrandColors.danger }]}>
                      {data.total_issues}
                    </ThemedText>
                    <ThemedText style={styles.metricLabel}>Detected Issues</ThemedText>
                  </View>
                </View>
              </ThemedView>

              {/* 5 Evaluated Rules Grid */}
              <View style={styles.sectionHeaderRow}>
                <ThemedText type="smallBold" style={styles.sectionHeader}>
                  5 DETERMINISTIC CONSISTENCY CHECKS
                </ThemedText>
              </View>

              <View style={styles.rulesList}>
                {checklistItems.map((chk: StressTestChecklist, idx: number) => (
                  <ThemedView key={chk.test || idx} type="backgroundElement" style={styles.ruleCard}>
                    <View style={styles.ruleHeader}>
                      <View style={styles.ruleIdBox}>
                        <ThemedText type="smallBold" style={styles.ruleIdText}>
                          CHECK #{idx + 1}
                        </ThemedText>
                      </View>
                      <View
                        style={[
                          styles.ruleStatusBadge,
                          {
                            backgroundColor: chk.passed ? BrandColors.successLight : BrandColors.dangerLight,
                            borderColor: chk.passed ? BrandColors.successBorder : BrandColors.dangerBorder,
                          },
                        ]}
                      >
                        <ThemedText
                          type="smallBold"
                          style={{
                            color: chk.passed ? BrandColors.success : BrandColors.danger,
                          }}
                        >
                          {chk.passed ? '✓ PASS' : '✕ REVIEW NEEDED'}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText type="subtitle" style={styles.ruleName}>
                      {chk.test}
                    </ThemedText>
                  </ThemedView>
                ))}
              </View>

              {/* Detected Issues Details */}
              {data.issues.length > 0 ? (
                <>
                  <View style={styles.sectionHeaderRow}>
                    <ThemedText type="smallBold" style={styles.sectionHeaderIssues}>
                      ISSUES REQUIRING ATTENTION ({data.issues.length})
                    </ThemedText>
                  </View>

                  <View style={styles.issuesList}>
                    {data.issues.map((issue: StressTestIssue, idx: number) => {
                      const badge = getSeverityBadgeStyle(issue.severity);
                      return (
                        <ThemedView key={idx} type="backgroundElement" style={styles.issueCard}>
                          <View style={styles.issueTop}>
                            <View style={[styles.severityBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                              <ThemedText type="smallBold" style={{ color: badge.text }}>
                                {issue.severity}
                              </ThemedText>
                            </View>
                            <ThemedText type="small" style={styles.issueRuleId}>
                              Rule: {issue.rule}
                            </ThemedText>
                          </View>
                          <ThemedText type="subtitle" style={styles.issueTitle}>
                            {issue.message}
                          </ThemedText>

                          {/* Affected Claims or Artifacts */}
                          <View style={styles.linkRow}>
                            {issue.claim_id ? (
                              <Pressable
                                style={styles.claimLinkBtn}
                                onPress={() => router.push(`/claim/${issue.claim_id}` as any)}
                              >
                                <ThemedText style={styles.claimLinkText}>
                                  Claim #{issue.claim_id} →
                                </ThemedText>
                              </Pressable>
                            ) : null}
                            {issue.artifact_id ? (
                              <Pressable
                                style={styles.artifactLinkBtn}
                                onPress={() => router.push('/evidence')}
                              >
                                <ThemedText style={styles.artifactLinkText}>
                                  Artifact #{issue.artifact_id} →
                                </ThemedText>
                              </Pressable>
                            ) : null}
                          </View>
                        </ThemedView>
                      );
                    })}
                  </View>
                </>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    width: '100%',
  },
  scrollContent: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
    gap: 16,
  },
  desktopScrollContent: {
    paddingHorizontal: 32,
    paddingTop: 24,
    maxWidth: 1080,
  },
  header: {
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  workspacePill: {
    backgroundColor: BrandColors.tealLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
  },
  workspacePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: BrandColors.teal,
    letterSpacing: 0.5,
  },
  caseBadge: {
    color: Colors.light.textSecondary,
  },
  subtitle: {
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  modeTabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 4,
    flexWrap: 'wrap',
  },
  modeTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    minWidth: 200,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modeTabTextActive: {
    color: BrandColors.indigo,
    fontSize: 13,
  },
  modeTabTextInactive: {
    color: Colors.light.textSecondary,
    fontSize: 13,
  },
  disclaimerBanner: {
    backgroundColor: BrandColors.warningLight,
    borderWidth: 1,
    borderColor: BrandColors.warningBorder,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  disclaimerTitle: {
    color: '#92400E',
    letterSpacing: 0.5,
  },
  disclaimerBody: {
    color: '#78350F',
    lineHeight: 18,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    gap: 12,
  },
  loadingText: {
    color: Colors.light.textSecondary,
    fontSize: 13,
  },
  errorBox: {
    backgroundColor: BrandColors.dangerLight,
    borderWidth: 1,
    borderColor: BrandColors.dangerBorder,
    borderRadius: 12,
    padding: 18,
    gap: 8,
  },
  errorTitle: {
    color: BrandColors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
  errorMsg: {
    color: '#7F1D1D',
    fontSize: 13,
  },
  errorDesc: {
    color: '#991B1B',
    fontSize: 12,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: BrandColors.danger,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  resultsContainer: {
    gap: 16,
  },
  summaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 20,
    gap: 14,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryTitle: {
    fontSize: 17,
    color: Colors.light.text,
  },
  summaryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
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
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.light.border,
  },
  sectionHeaderRow: {
    marginTop: 6,
  },
  sectionHeader: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  sectionHeaderIssues: {
    color: BrandColors.danger,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  rulesList: {
    gap: 10,
  },
  ruleCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
    gap: 6,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ruleIdBox: {
    backgroundColor: Colors.light.backgroundSubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ruleIdText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  ruleStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  ruleName: {
    fontSize: 15,
    color: Colors.light.text,
  },
  issuesList: {
    gap: 12,
  },
  issueCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BrandColors.dangerBorder,
    borderLeftWidth: 4,
    borderLeftColor: BrandColors.danger,
    padding: 16,
    gap: 8,
  },
  issueTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  issueRuleId: {
    color: Colors.light.textMuted,
    fontSize: 11,
  },
  issueTitle: {
    fontSize: 16,
    color: Colors.light.text,
  },
  linkRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  claimLinkBtn: {
    backgroundColor: BrandColors.indigoLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  claimLinkText: {
    fontSize: 12,
    color: BrandColors.indigo,
    fontWeight: '600',
  },
  artifactLinkBtn: {
    backgroundColor: Colors.light.backgroundSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  artifactLinkText: {
    fontSize: 12,
    color: Colors.light.text,
    fontWeight: '600',
  },
});
