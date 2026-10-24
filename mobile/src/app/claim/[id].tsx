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
                <ThemedText style={styles.workspacePillText}>TRACE ENGINE AUDIT</ThemedText>
              </View>
              <ThemedText type="small" style={styles.claimIdTag}>
                Claim ID: {claim?.id || 'N/A'}
              </ThemedText>
            </View>
            <ThemedText type="title">{t.claimDetail.title}</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              Deterministic Trace Engine justification, supporting observations, and identified contradictions.
            </ThemedText>
          </View>

          {/* Statement & Status Card */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.statusRow}>
              <ThemedText type="smallBold" style={styles.statusTitle}>
                {t.claimDetail.currentStatus}
              </ThemedText>
              {claim && <ClaimStatusBadge status={claim.status} />}
            </View>

            <ThemedText type="subtitle" style={styles.claimText}>
              "{claim?.text}"
            </ThemedText>

            <View style={styles.reasonBox}>
              <ThemedText type="tag" style={styles.reasonTag}>
                DETERMINISTIC EVALUATION REASON
              </ThemedText>
              <ThemedText type="default" style={styles.explanationText}>
                {claim?.explanation || 'No deterministic rationale assigned.'}
              </ThemedText>
            </View>

            <View style={styles.evalNotice}>
              <ThemedText type="small" style={styles.evalNoticeText}>
                ℹ️ Status reflects internal evidence matching in ProofPath. It does not constitute a judicial conclusion or police finding.
              </ThemedText>
            </View>
          </ThemedView>

          {/* Supporting Observations */}
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="smallBold" style={styles.sectionHeader}>
              SUPPORTING OBSERVATIONS ({supportingObservations.length})
            </ThemedText>
          </View>

          {supportingObservations.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <ThemedText type="small" style={styles.dimText}>
                No supporting factual observations currently linked to this claim.
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
                        ✓ Observation #{obs.id}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" style={styles.dimText}>
                      Source: {srcArtifact?.name || obs.evidenceId}
                    </ThemedText>
                  </View>
                  <ThemedText type="default" style={styles.obsText}>
                    "{obs.text}"
                  </ThemedText>
                  <ThemedText type="small" style={styles.obsMeta}>
                    Logged at {new Date(obs.recordedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </ThemedText>
                </ThemedView>
              );
            })
          )}

          {/* Conflicting Observations */}
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="smallBold" style={styles.sectionHeaderConflict}>
              CONFLICTING OBSERVATIONS ({conflictingObservations.length})
            </ThemedText>
          </View>

          {conflictingObservations.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <ThemedText type="small" style={styles.dimText}>
                No direct contradictory observations detected in the timeline.
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
                        ✕ Contradiction #{obs.id}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" style={styles.dimText}>
                      Source: {srcArtifact?.name || obs.evidenceId}
                    </ThemedText>
                  </View>
                  <ThemedText type="default" style={styles.obsText}>
                    "{obs.text}"
                  </ThemedText>
                  <ThemedText type="small" style={styles.obsMeta}>
                    Logged at {new Date(obs.recordedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
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
            <ThemedText style={styles.returnBtnText}>← Return to Evidence Repository</ThemedText>
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
