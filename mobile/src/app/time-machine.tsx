import React, { useMemo } from 'react';
import { StyleSheet, ScrollView, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, BrandColors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCaseState } from '@/context/CaseContext';
import { EvidenceTimelineCard, ClaimChangeCard } from '@/components/proofpath';
import { router } from 'expo-router';

export default function TimeMachineScreen() {
  const {
    evidence,
    observations,
    claims,
    excludedEvidenceIds,
    scenarioResult,
    toggleEvidenceExclusion,
    restoreOriginalState,
    isLoading,
  } = useCaseState();

  const isBaseline = excludedEvidenceIds.length === 0;
  const isPreparedScenario =
    excludedEvidenceIds.length === 1 && excludedEvidenceIds[0] === 'ev-01';

  // Chronologically sorted evidence
  const sortedEvidence = useMemo(() => {
    return [...evidence].sort(
      (a, b) => new Date(a.ingestedAt).getTime() - new Date(b.ingestedAt).getTime()
    );
  }, [evidence]);

  // Names of currently excluded items for the notice
  const excludedNames = useMemo(() => {
    return evidence
      .filter((ev) => excludedEvidenceIds.includes(ev.id))
      .map((ev) => `"${ev.name}"`)
      .join(', ');
  }, [evidence, excludedEvidenceIds]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="title">What if this item is removed?</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              Test what happens to claims when an evidence item is temporarily taken away.
            </ThemedText>
          </View>

          {/* 1-Sentence Demo Notice */}
          <ThemedView type="backgroundElement" style={styles.demoBanner}>
            <ThemedText type="smallBold" style={styles.demoBannerText}>
              Sample simulation: This test is for illustration only, not a legal or forensic conclusion.
            </ThemedText>
          </ThemedView>

          {/* Visible Restore Original State Action Bar */}
          <ThemedView type="backgroundElement" style={styles.actionBar}>
            <View style={styles.actionTextCol}>
              <ThemedText type="smallBold" style={styles.actionCountTitle}>
                Items removed: {excludedEvidenceIds.length} of {evidence.length}
              </ThemedText>
              <ThemedText type="small" style={styles.dimText}>
                {isBaseline
                  ? 'All items currently included'
                  : isPreparedScenario
                  ? 'Prepared CCTV test active'
                  : 'Custom combination'}
              </ThemedText>
            </View>

            <Pressable
              style={[
                styles.restoreButton,
                isBaseline && styles.restoreButtonDisabled,
              ]}
              disabled={isBaseline}
              onPress={() => restoreOriginalState()}>
              <ThemedText
                type="smallBold"
                style={isBaseline ? styles.restoreTextDisabled : styles.restoreTextActive}>
                {isBaseline ? '✓ Original state' : '↻ Put all items back'}
              </ThemedText>
            </Pressable>
          </ThemedView>

          {/* Section 1: Simulated Claim Impact */}
          <ThemedText type="smallBold" style={styles.sectionHeader}>
            SIMULATION RESULTS
          </ThemedText>

          {isBaseline && (
            <ThemedView type="backgroundElement" style={styles.stateNoticeCard}>
              <ThemedText type="smallBold" style={styles.noticeTitle}>
                All evidence items are included
              </ThemedText>
              <ThemedText type="small" style={styles.dimText}>
                Tap "− Remove from test" on any evidence item below to simulate what changes when that item is missing.
              </ThemedText>
            </ThemedView>
          )}

          {isPreparedScenario && (
            <View style={styles.scenarioGroup}>
              <ThemedView type="backgroundElement" style={styles.preparedBanner}>
                <ThemedText type="smallBold" style={styles.preparedTag}>
                  Sample test: Hallway security photo removed (ev-01)
                </ThemedText>
                <ThemedText type="small" style={styles.preparedDesc}>
                  Showing how claims change without the hallway entry photo.
                </ThemedText>
              </ThemedView>

              {scenarioResult?.changes.map((change) => {
                const matchedClaim = claims.find((c) => c.id === change.claimId);
                return (
                  <ClaimChangeCard
                    key={change.claimId}
                    change={change}
                    claimStatement={matchedClaim?.text}
                  />
                );
              })}
            </View>
          )}

          {!isBaseline && !isPreparedScenario && (
            <ThemedView type="backgroundElement" style={styles.unpreparedNoticeCard}>
              <ThemedText type="smallBold" style={styles.unpreparedTag}>
                No sample test prepared for this combination
              </ThemedText>
              <ThemedText type="small" style={styles.unpreparedDesc}>
                This demo includes a prepared test for removing the hallway camera photo (ev-01). You removed {excludedNames}.
              </ThemedText>
              <Pressable
                style={styles.switchButton}
                onPress={async () => {
                  await restoreOriginalState();
                  await toggleEvidenceExclusion('ev-01');
                }}>
                <ThemedText type="smallBold" style={styles.switchButtonText}>
                  Try the prepared CCTV test (ev-01) →
                </ThemedText>
              </Pressable>
            </ThemedView>
          )}

          {/* Section 2: Evidence Exclusion Toggles */}
          <View style={styles.listHeaderRow}>
            <ThemedText type="smallBold" style={styles.sectionHeader}>
              EVIDENCE ITEMS ({sortedEvidence.length})
            </ThemedText>
            <ThemedText type="small" style={styles.dimText}>
              Tap button on card to remove or restore
            </ThemedText>
          </View>

          {isLoading ? (
            <ThemedText>Loading evidence items...</ThemedText>
          ) : (
            sortedEvidence.map((item) => {
              const isExcluded = excludedEvidenceIds.includes(item.id);
              const linkedObs = observations.filter(
                (obs) => obs.evidenceId === item.id
              );

              return (
                <EvidenceTimelineCard
                  key={item.id}
                  evidence={item}
                  observations={linkedObs}
                  isExcluded={isExcluded}
                  showExclusionControl={true}
                  onToggleExclude={() => toggleEvidenceExclusion(item.id)}
                />
              );
            })
          )}

          {/* Obvious Next Action Card */}
          <ThemedView type="backgroundElement" style={styles.nextActionCard}>
            <ThemedText type="smallBold" style={styles.nextActionTag}>
              NEXT ACTION
            </ThemedText>
            <ThemedText type="subtitle" style={styles.nextActionTitle}>
              Choose what to share
            </ThemedText>
            <ThemedText type="small" style={styles.nextActionDesc}>
              Select who receives your summary and pick which facts stay private.
            </ThemedText>
            <Pressable
              style={styles.nextActionButton}
              onPress={() => router.push('/privacy')}>
              <ThemedText type="smallBold" style={styles.nextActionButtonText}>
                Go to Privacy choices →
              </ThemedText>
            </Pressable>
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
    width: '100%',
  },
  scrollContent: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.six,
    gap: Spacing.three,
  },
  header: {
    marginBottom: Spacing.one,
  },
  subtitle: {
    opacity: 0.75,
    marginTop: Spacing.half,
    lineHeight: 20,
    fontSize: 14,
  },
  demoBanner: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: BrandColors.indigoLight,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  demoBannerText: {
    color: BrandColors.indigo,
    fontSize: 13,
    lineHeight: 18,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.border,
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actionTextCol: {
    gap: 2,
  },
  actionCountTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  restoreButton: {
    backgroundColor: BrandColors.indigo,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: Spacing.two,
  },
  restoreButtonDisabled: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  restoreTextActive: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  restoreTextDisabled: {
    color: BrandColors.muted,
    fontSize: 12,
  },
  sectionHeader: {
    opacity: 0.7,
    marginTop: Spacing.one,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.one,
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  stateNoticeCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.border,
    gap: 4,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  scenarioGroup: {
    gap: Spacing.two,
  },
  preparedBanner: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderLeftWidth: 4,
    borderLeftColor: BrandColors.purple,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: BrandColors.purpleLight,
    gap: 4,
  },
  preparedTag: {
    color: BrandColors.purple,
    fontWeight: '600',
    fontSize: 13,
  },
  preparedDesc: {
    fontSize: 12,
    opacity: 0.8,
    lineHeight: 16,
  },
  unpreparedNoticeCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: '#FFFBEB',
    gap: Spacing.one,
  },
  unpreparedTag: {
    color: '#D97706',
    fontWeight: '600',
    fontSize: 13,
  },
  unpreparedDesc: {
    fontSize: 12,
    opacity: 0.85,
    lineHeight: 16,
  },
  switchButton: {
    backgroundColor: BrandColors.indigo,
    paddingVertical: 8,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
  },
  switchButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  nextActionCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.border,
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  nextActionTag: {
    fontSize: 11,
    color: BrandColors.indigo,
    letterSpacing: 0.5,
  },
  nextActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  nextActionDesc: {
    fontSize: 13,
    opacity: 0.75,
    lineHeight: 18,
  },
  nextActionButton: {
    backgroundColor: BrandColors.indigo,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
  },
  nextActionButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  dimText: {
    opacity: 0.65,
    fontSize: 12,
  },
});
