import React from 'react';
import { StyleSheet, ScrollView, View, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCaseState } from '@/context/CaseContext';
import { ClaimStatusBadge } from '@/components/proofpath';
import { useTranslation } from '@/context/LanguageContext';
import { safeBack } from '@/utils/navigation';

export default function ClaimDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { claims, observations, evidence } = useCaseState();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const claim = claims.find((c) => c.id === id) ?? claims[0];

  const supportingObservations = observations.filter((obs) =>
    claim?.supportingObservationIds.includes(obs.id)
  );

  const conflictingObservations = observations.filter((obs) =>
    claim?.conflictingObservationIds.includes(obs.id)
  );

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
            <Pressable onPress={() => safeBack('/evidence')} style={styles.backButton}>
              <ThemedText type="smallBold" style={styles.backButtonText}>
                ← {t.common.back}
              </ThemedText>
            </Pressable>
            <View style={styles.badgeRow}>
              <View style={styles.workspacePill}>
                <ThemedText style={styles.workspacePillText}>YOUR RECORDS</ThemedText>
              </View>
              <ThemedText type="small" style={styles.claimIdTag}>
                Statement ID: {claim?.id || 'N/A'}
              </ThemedText>
            </View>
            <ThemedText type="title">What does the evidence show?</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              See which recorded details support this statement and where information may not match.
            </ThemedText>
          </View>

          {/* Statement & Status Card */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.statusRow}>
              <ThemedText type="smallBold" style={styles.statusTitle}>
                Current Assessment
              </ThemedText>
              {claim && <ClaimStatusBadge status={claim.status} />}
            </View>

            <ThemedText type="subtitle" style={styles.claimText}>
              "{claim?.text}"
            </ThemedText>

            <View style={styles.reasonBox}>
              <ThemedText type="tag" style={styles.reasonTag}>
                WHAT THIS MEANS
              </ThemedText>
              <ThemedText type="default" style={styles.explanationText}>
                {claim?.explanation?.replace(/claim/gi, 'statement')?.replace(/observation/gi, 'detail') ||
                  'Saved evidence is being reviewed for this statement.'}
              </ThemedText>
            </View>

            {/* Special Conflict Assistance Card when status is CONFLICTED */}
            {claim?.status === 'CONFLICTED' && (() => {
              // Identify disagreeing pairs
              let pairDetail1: typeof supportingObservations[0] | null = null;
              let pairDetail2: typeof supportingObservations[0] | null = null;
              let conflictType: 'support_vs_contradict' | 'time_inconsistency' | 'unknown' = 'unknown';
              let conflictExplanation = '';

              if (supportingObservations.length > 0 && conflictingObservations.length > 0) {
                pairDetail1 = supportingObservations[0];
                pairDetail2 = conflictingObservations[0];
                conflictType = 'support_vs_contradict';
                conflictExplanation = 'One detail was recorded as confirming this statement, while another detail was marked as directly contradicting it.';
              } else if (supportingObservations.length > 1) {
                // Check if timestamps differ across active supporting sources
                const timeObs = supportingObservations.filter((o) =>
                  o.field && ['timestamp', 'date', 'time', 'event_timestamp'].includes(o.field)
                );
                if (timeObs.length >= 2 && timeObs[0].value !== timeObs[1].value) {
                  pairDetail1 = timeObs[0];
                  pairDetail2 = timeObs[1];
                  conflictType = 'time_inconsistency';
                  conflictExplanation = `Contradictory timestamps detected (${pairDetail1.value} vs. ${pairDetail2.value}) across different saved sources for this statement.`;
                }
              }

              const src1 = pairDetail1 ? evidence.find((e) => e.id === pairDetail1?.evidenceId) : null;
              const src2 = pairDetail2 ? evidence.find((e) => e.id === pairDetail2?.evidenceId) : null;

              return (
                <View style={styles.conflictHelpCard}>
                  <View style={styles.conflictHeaderRow}>
                    <ThemedText style={styles.conflictIcon}>⚠️</ThemedText>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="subtitle" style={styles.conflictHelpTitle}>
                        Information doesn't match
                      </ThemedText>
                      <ThemedText type="small" style={styles.conflictHelpSub}>
                        {conflictType === 'time_inconsistency'
                          ? 'Incompatible dates or times found for this event.'
                          : conflictType === 'support_vs_contradict'
                          ? 'Conflicting details were recorded from different evidence sources.'
                          : 'A factual disagreement was detected across your saved evidence.'}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Disagreeing pair or explicit limitation notice */}
                  {pairDetail1 && pairDetail2 ? (
                    <View style={styles.disagreePairCard}>
                      <ThemedText type="smallBold" style={styles.pairHeaderLabel}>
                        DISAGREEING DETAILS IDENTIFIED:
                      </ThemedText>

                      {/* Detail 1 */}
                      <View style={styles.pairDetailBox}>
                        <View style={styles.pairDetailTagRow}>
                          <ThemedText type="smallBold" style={styles.pairDetailTag1}>
                            Detail A ({String(pairDetail1.field || 'detail').replace('_', ' ')})
                          </ThemedText>
                          <ThemedText type="small" style={styles.pairDetailSource}>
                            Source: {src1?.name || pairDetail1.evidenceId || 'Uploaded record'}
                          </ThemedText>
                        </View>
                        <ThemedText style={styles.pairDetailVal}>"{pairDetail1.value}"</ThemedText>
                      </View>

                      <View style={styles.pairVsDivider}>
                        <ThemedText style={styles.pairVsText}>VS</ThemedText>
                      </View>

                      {/* Detail 2 */}
                      <View style={styles.pairDetailBox}>
                        <View style={styles.pairDetailTagRow}>
                          <ThemedText type="smallBold" style={styles.pairDetailTag2}>
                            Detail B ({String(pairDetail2.field || 'detail').replace('_', ' ')})
                          </ThemedText>
                          <ThemedText type="small" style={styles.pairDetailSource}>
                            Source: {src2?.name || pairDetail2.evidenceId || 'Uploaded record'}
                          </ThemedText>
                        </View>
                        <ThemedText style={styles.pairDetailVal}>"{pairDetail2.value}"</ThemedText>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.limitationNoticeBox}>
                      <ThemedText type="smallBold" style={styles.limitationNoticeTitle}>
                        ℹ️ Note on conflict source:
                      </ThemedText>
                      <ThemedText type="small" style={styles.limitationNoticeText}>
                        No isolated two-detail conflict pair could be matched deterministically. The statement was flagged because of combined evidence conditions. Review all supporting and disagreeing details below.
                      </ThemedText>
                    </View>
                  )}

                  {/* Why the system flagged it */}
                  <View style={styles.whyBox}>
                    <ThemedText type="smallBold" style={styles.whyTitle}>
                      💡 Why the system flagged it
                    </ThemedText>
                    <ThemedText type="small" style={styles.whyText}>
                      • {conflictExplanation || 'The system detected conflicting facts or incompatible dates across your active records.'}{'\n'}
                      • ProofPath never guesses or deletes anything automatically — both pieces of evidence remain safely preserved in your record.
                    </ThemedText>
                  </View>

                  {/* What you can do next */}
                  <View style={styles.actionBox}>
                    <ThemedText type="smallBold" style={styles.actionTitle}>
                      What you can do next
                    </ThemedText>
                    <View style={styles.actionBtnsCol}>
                      <Pressable
                        style={styles.actionChoiceBtn}
                        onPress={() => router.push('/time-machine')}
                      >
                        <ThemedText style={styles.actionChoiceBtnText}>
                          ⏱ Test Leaving Out One Source (Time Machine)
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        style={styles.actionChoiceBtnSecondary}
                        onPress={() => router.push('/evidence')}
                      >
                        <ThemedText style={styles.actionChoiceBtnSecondaryText}>
                          📁 Review or Add Another Supporting Record
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })()}

            <View style={styles.evalNotice}>
              <ThemedText type="small" style={styles.evalNoticeText}>
                ℹ️ This assessment organizes your saved records. It does not replace a police or judicial investigation.
              </ThemedText>
            </View>
          </ThemedView>

          {/* Supporting Observations */}
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="smallBold" style={styles.sectionHeader}>
              SUPPORTING DETAILS ({supportingObservations.length})
            </ThemedText>
          </View>

          {supportingObservations.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <ThemedText type="small" style={styles.dimText}>
                No supporting details linked to this statement yet.
              </ThemedText>
            </ThemedView>
          ) : (
            supportingObservations.map((obs) => {
              const srcArtifact = evidence.find((e) => e.id === obs.evidenceId);
              return (
                <ThemedView key={obs.id} type="backgroundElement" style={styles.obsCardSupport}>
                  <View style={styles.obsHeader}>
                    <View style={styles.factBadgeSupport}>
                      <ThemedText type="smallBold" style={styles.factSupportId}>
                        ✓ Supporting Detail #{obs.id}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" style={styles.dimText}>
                      Found in: {srcArtifact?.name || obs.evidenceId}
                    </ThemedText>
                  </View>
                  <ThemedText type="default" style={styles.obsText}>
                    "{obs.text}"
                  </ThemedText>
                  <ThemedText type="small" style={styles.obsMeta}>
                    Recorded {new Date(obs.recordedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </ThemedText>
                </ThemedView>
              );
            })
          )}

          {/* Conflicting Observations */}
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="smallBold" style={styles.sectionHeaderConflict}>
              DETAILS THAT DON'T MATCH ({conflictingObservations.length})
            </ThemedText>
          </View>

          {conflictingObservations.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <ThemedText type="small" style={styles.dimText}>
                No contradictory or mismatching details found.
              </ThemedText>
            </ThemedView>
          ) : (
            conflictingObservations.map((obs) => {
              const srcArtifact = evidence.find((e) => e.id === obs.evidenceId);
              return (
                <ThemedView key={obs.id} type="backgroundElement" style={styles.obsCardConflict}>
                  <View style={styles.obsHeader}>
                    <View style={styles.factBadgeConflict}>
                      <ThemedText type="smallBold" style={styles.factConflictId}>
                        ✕ Disagreeing Detail #{obs.id}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" style={styles.dimText}>
                      Found in: {srcArtifact?.name || obs.evidenceId}
                    </ThemedText>
                  </View>
                  <ThemedText type="default" style={styles.obsText}>
                    "{obs.text}"
                  </ThemedText>
                  <ThemedText type="small" style={styles.obsMeta}>
                    Recorded {new Date(obs.recordedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </ThemedText>
                </ThemedView>
              );
            })
          )}

          {/* Quick Return Action */}
          <Pressable
            style={styles.returnBtn}
            onPress={() => router.push('/evidence')}
          >
            <ThemedText style={styles.returnBtnText}>← Back to saved items</ThemedText>
          </Pressable>
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
    maxWidth: 960,
  },
  header: {
    gap: 6,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginBottom: 4,
  },
  backButtonText: {
    color: BrandColors.indigo,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  workspacePill: {
    backgroundColor: BrandColors.indigoLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
  },
  workspacePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: BrandColors.indigo,
    letterSpacing: 0.5,
  },
  claimIdTag: {
    color: Colors.light.textSecondary,
  },
  subtitle: {
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 20,
    gap: 14,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusTitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  claimText: {
    fontSize: 18,
    lineHeight: 26,
    color: Colors.light.text,
  },
  reasonBox: {
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: 10,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  reasonTag: {
    color: BrandColors.indigo,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
  },
  evalNotice: {
    backgroundColor: BrandColors.tealLight,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: BrandColors.tealBorder,
  },
  evalNoticeText: {
    color: '#0F766E',
    fontSize: 12,
    lineHeight: 16,
  },
  conflictHelpCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    padding: 16,
    gap: 12,
  },
  conflictHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  conflictIcon: {
    fontSize: 22,
  },
  conflictHelpTitle: {
    color: '#C2410C',
    fontSize: 16,
    fontWeight: '700',
  },
  conflictHelpSub: {
    color: '#9A3412',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  disagreePairCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 12,
    gap: 8,
  },
  pairHeaderLabel: {
    fontSize: 11,
    color: '#C2410C',
    letterSpacing: 0.5,
  },
  pairDetailBox: {
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    padding: 10,
    gap: 4,
  },
  pairDetailTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  pairDetailTag1: {
    fontSize: 11,
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pairDetailTag2: {
    fontSize: 11,
    color: '#B91C1C',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pairDetailSource: {
    fontSize: 11,
    color: '#7C2D12',
    fontWeight: '500',
  },
  pairDetailVal: {
    fontSize: 13,
    color: '#431407',
    fontWeight: '600',
  },
  pairVsDivider: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  pairVsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  limitationNoticeBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 10,
    gap: 4,
  },
  limitationNoticeTitle: {
    fontSize: 12,
    color: '#334155',
  },
  limitationNoticeText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  conflictHelpDesc: {
    color: '#7C2D12',
    fontSize: 13,
    lineHeight: 18,
  },
  whyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  whyTitle: {
    color: '#9A3412',
    fontSize: 12,
  },
  whyText: {
    color: '#7C2D12',
    fontSize: 12,
    lineHeight: 18,
  },
  actionBox: {
    gap: 8,
    marginTop: 4,
  },
  actionTitle: {
    color: '#9A3412',
    fontSize: 12,
  },
  actionBtnsCol: {
    gap: 8,
  },
  actionChoiceBtn: {
    backgroundColor: '#EA580C',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  actionChoiceBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionChoiceBtnSecondary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FDBA74',
    alignItems: 'center',
  },
  actionChoiceBtnSecondaryText: {
    color: '#9A3412',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionHeaderRow: {
    marginTop: 4,
  },
  sectionHeader: {
    color: BrandColors.success,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  sectionHeaderConflict: {
    color: BrandColors.danger,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  obsCardSupport: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BrandColors.successBorder,
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: BrandColors.success,
  },
  obsCardConflict: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BrandColors.dangerBorder,
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: BrandColors.danger,
  },
  obsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  factBadgeSupport: {
    backgroundColor: BrandColors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  factSupportId: {
    fontSize: 11,
    color: BrandColors.success,
  },
  factBadgeConflict: {
    backgroundColor: BrandColors.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  factConflictId: {
    fontSize: 11,
    color: BrandColors.danger,
  },
  dimText: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  obsText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
  },
  obsMeta: {
    color: Colors.light.textMuted,
    fontSize: 11,
  },
  emptyCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  returnBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  returnBtnText: {
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: '600',
  },
});
