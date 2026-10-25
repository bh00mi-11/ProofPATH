import React, { useMemo } from 'react';
import { StyleSheet, ScrollView, View, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCaseState } from '@/context/CaseContext';
import { EvidenceTimelineCard, ClaimChangeCard } from '@/components/proofpath';
import { useTranslation } from '@/context/LanguageContext';

export default function TimeMachineScreen() {
  const { t } = useTranslation();
  const {
    currentCase,
    availableCases,
    selectCase,
    evidence,
    observations,
    claims,
    excludedEvidenceIds,
    scenarioResult,
    toggleEvidenceExclusion,
    restoreOriginalState,
    isLoading,
  } = useCaseState();

  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isBaseline = excludedEvidenceIds.length === 0;

  // Chronologically sorted evidence
  const sortedEvidence = useMemo(() => {
    return [...evidence].sort(
      (a, b) => new Date(a.ingestedAt).getTime() - new Date(b.ingestedAt).getTime()
    );
  }, [evidence]);

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
              {availableCases.length > 1 ? (
                <View style={styles.casePickerRow}>
                  {availableCases.map((c) => {
                    const isSelected = c.id === currentCase?.id;
                    const isDuplicateTitle = availableCases.filter((item) => item.title === c.title).length > 1;
                    const shortId = c.id.replace(/^case_/, '');
                    const baseTitle = c.title ? (c.title.length > 18 ? `${c.title.slice(0, 18)}...` : c.title) : c.id;
                    const displayLabel = isDuplicateTitle ? `${baseTitle} (#${shortId.slice(0, 4)})` : baseTitle;

                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => selectCase(c.id)}
                        style={[styles.caseSelectorPill, isSelected && styles.caseSelectorPillActive]}
                      >
                        <ThemedText
                          type="smallBold"
                          style={isSelected ? styles.caseSelectorPillTextActive : styles.caseSelectorPillTextInactive}
                        >
                          {displayLabel}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <ThemedText type="small" style={styles.caseBadge}>
                  {currentCase?.title || 'Case Analysis'}
                </ThemedText>
              )}
            </View>
            <ThemedText type="title">{t.timeMachine.title}</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              {t.timeMachine.subtitle}
            </ThemedText>
          </View>

          {/* Sub-Tabs / Mode Switcher */}
          <View style={styles.modeTabBar}>
            <View style={[styles.modeTab, styles.modeTabActive]}>
              <ThemedText type="smallBold" style={styles.modeTabTextActive}>
                ⏱ What changes if I leave this out?
              </ThemedText>
            </View>
            <Pressable
              style={styles.modeTab}
              onPress={() => router.push('/stress-test')}
            >
              <ThemedText type="smallBold" style={styles.modeTabTextInactive}>
                🔬 Quick Consistency Check (5-Point) →
              </ThemedText>
            </Pressable>
          </View>

          {/* Simulation Notice Banner */}
          <ThemedView type="backgroundElement" style={styles.noticeBanner}>
            <ThemedText type="smallBold" style={styles.noticeBannerTitle}>
              🛡 SAFE & TEMPORARY SIMULATION
            </ThemedText>
            <ThemedText type="small" style={styles.noticeBannerText}>
              Removing an item here only tests what happens without it. Your original evidence files are never deleted or modified.
            </ThemedText>
          </ThemedView>

          {/* Baseline vs Scenario Control Bar */}
          <ThemedView type="backgroundElement" style={styles.actionBar}>
            <View style={styles.actionTextCol}>
              <View style={styles.scenarioStatusRow}>
                <View
                  style={[
                    styles.statusIndicatorDot,
                    { backgroundColor: isBaseline ? BrandColors.success : BrandColors.warning },
                  ]}
                />
                <ThemedText type="smallBold" style={styles.actionCountTitle}>
                  {isBaseline
                    ? 'All saved evidence is included'
                    : `Testing without ${excludedEvidenceIds.length} piece(s) of evidence`}
                </ThemedText>
              </View>
              <ThemedText type="small" style={styles.dimText}>
                {isBaseline
                  ? 'Tap "See what changes without this evidence" on any card below to test.'
                  : 'Tap "Restore original" to return to your complete record.'}
              </ThemedText>
            </View>

            <Pressable
              style={[
                styles.restoreButton,
                isBaseline && styles.restoreButtonDisabled,
              ]}
              disabled={isBaseline}
              onPress={() => restoreOriginalState()}
            >
              <ThemedText
                type="smallBold"
                style={isBaseline ? styles.restoreTextDisabled : styles.restoreTextActive}
              >
                {isBaseline ? '✓ Original' : '↺ Restore original'}
              </ThemedText>
            </Pressable>
          </ThemedView>

          {/* Section 1: Simulated Claim Impact */}
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="smallBold" style={styles.sectionHeader}>
              How your statements are affected
            </ThemedText>
            <ThemedText type="small" style={styles.sectionSub}>
              See which statements gain or lose support
            </ThemedText>
          </View>

          {isBaseline ? (
            <ThemedView type="backgroundElement" style={styles.baselineNoticeCard}>
              <ThemedText type="smallBold" style={styles.baselineNoticeTitle}>
                All statements currently reflect your full evidence
              </ThemedText>
              <ThemedText type="small" style={styles.baselineNoticeDesc}>
                Tap "See what changes without this evidence" on any item below to see how your case holds up if that evidence was missing or contested.
              </ThemedText>
            </ThemedView>
          ) : (
            scenarioResult?.changes.map((change) => {
              const statementText = claims.find((c) => c.id === change.claimId)?.text || (change as any).claimText || change.claimId;
              const excludedNames = excludedEvidenceIds
                .map((eid) => evidence.find((e) => e.id === eid)?.name)
                .filter(Boolean) as string[];

              return (
                <ClaimChangeCard
                  key={change.claimId}
                  change={change}
                  claimStatement={statementText}
                  excludedEvidenceNames={excludedNames}
                  evidenceList={evidence.map((e) => ({ id: e.id, name: e.name }))}
                  observationsList={observations.map((o) => ({ id: o.id, evidenceId: o.evidenceId, field: o.field || '' }))}
                />
              );
            })
          )}

          {/* Section 2: Artifact Exclusion Controls */}
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="smallBold" style={styles.sectionHeader}>
              Choose evidence to test leaving out ({sortedEvidence.length})
            </ThemedText>
          </View>

          {sortedEvidence.map((item, idx) => {
            const isExcluded = excludedEvidenceIds.includes(item.id);
            const linkedObs = observations.filter((obs) => obs.evidenceId === item.id);

            return (
              <EvidenceTimelineCard
                key={item.id}
                evidence={item}
                observations={linkedObs}
                claims={claims}
                isExcluded={isExcluded}
                onToggleExclude={() => toggleEvidenceExclusion(item.id)}
                showExclusionControl={true}
                stepNumber={idx + 1}
                isFirst={idx === 0}
                isLast={idx === sortedEvidence.length - 1}
              />
            );
          })}
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
  noticeBanner: {
    backgroundColor: BrandColors.tealLight,
    borderWidth: 1,
    borderColor: BrandColors.tealBorder,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  noticeBannerTitle: {
    color: BrandColors.teal,
    letterSpacing: 0.5,
  },
  noticeBannerText: {
    color: '#0F766E',
    lineHeight: 18,
  },
  actionBar: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  actionTextCol: {
    flex: 1,
    minWidth: 220,
    gap: 4,
  },
  scenarioStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionCountTitle: {
    fontSize: 14,
    color: Colors.light.text,
  },
  dimText: {
    color: Colors.light.textSecondary,
  },
  restoreButton: {
    backgroundColor: BrandColors.indigo,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  restoreButtonDisabled: {
    backgroundColor: Colors.light.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  restoreTextActive: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  restoreTextDisabled: {
    color: Colors.light.textMuted,
    fontSize: 12,
  },
  sectionHeaderRow: {
    marginTop: 6,
    gap: 2,
  },
  sectionHeader: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  sectionSub: {
    color: Colors.light.textMuted,
    fontSize: 12,
  },
  baselineNoticeCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 20,
    gap: 6,
  },
  baselineNoticeTitle: {
    fontSize: 15,
    color: Colors.light.text,
  },
  baselineNoticeDesc: {
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  casePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  caseSelectorPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    backgroundColor: Colors.light.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  caseSelectorPillActive: {
    backgroundColor: BrandColors.indigoLight,
    borderColor: BrandColors.indigoBorder,
  },
  caseSelectorPillTextActive: {
    color: BrandColors.indigo,
    fontSize: 11,
  },
  caseSelectorPillTextInactive: {
    color: Colors.light.textSecondary,
    fontSize: 11,
  },
});
