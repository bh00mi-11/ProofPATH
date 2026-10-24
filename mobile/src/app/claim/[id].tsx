import React from 'react';
import { StyleSheet, ScrollView, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, BrandColors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCaseState } from '@/context/CaseContext';
import { ClaimStatusBadge } from '@/components/proofpath';

export default function ClaimDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { claims, observations } = useCaseState();

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
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ThemedText type="smallBold" style={styles.backButtonText}>
                ← Back
              </ThemedText>
            </Pressable>
            <ThemedText type="title">Claim details</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              Comparing facts that support or conflict with this claim.
            </ThemedText>
          </View>

          {/* 1-Sentence Demo Notice */}
          <ThemedView type="backgroundElement" style={styles.demoBanner}>
            <ThemedText type="smallBold" style={styles.demoBannerText}>
              Sample demo: Claim evaluations and linked facts are fictional examples.
            </ThemedText>
          </ThemedView>

          {/* Statement & Status Card */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.statusRow}>
              <ThemedText type="smallBold" style={styles.statusTitle}>
                CURRENT STATUS
              </ThemedText>
              {claim && <ClaimStatusBadge status={claim.status} />}
            </View>

            <ThemedText type="subtitle" style={styles.claimText}>
              "{claim?.text}"
            </ThemedText>

            <ThemedText type="smallBold" style={styles.fieldHeader}>
              WHY THIS STATUS WAS ASSIGNED
            </ThemedText>
            <ThemedText type="default" style={styles.explanationText}>
              {claim?.explanation}
            </ThemedText>
          </ThemedView>

          {/* Supporting Observations */}
          <ThemedText type="smallBold" style={styles.sectionHeader}>
            FACTS THAT SUPPORT THIS CLAIM ({supportingObservations.length})
          </ThemedText>

          {supportingObservations.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <ThemedText type="small" style={styles.dimText}>
                No supporting facts linked to this claim.
              </ThemedText>
            </ThemedView>
          ) : (
            supportingObservations.map((obs) => (
              <ThemedView key={obs.id} type="backgroundElement" style={styles.obsCardSupport}>
                <View style={styles.obsHeader}>
                  <ThemedText type="smallBold" style={styles.factSupportId}>
                    ✓ Fact #{obs.id}
                  </ThemedText>
                  <ThemedText type="small" style={styles.dimText}>
                    From Evidence item: {obs.evidenceId}
                  </ThemedText>
                </View>
                <ThemedText type="default" style={styles.obsText}>"{obs.text}"</ThemedText>
              </ThemedView>
            ))
          )}

          {/* Conflicting Observations */}
          <ThemedText type="smallBold" style={styles.sectionHeader}>
            FACTS THAT CONFLICT WITH THIS CLAIM ({conflictingObservations.length})
          </ThemedText>

          {conflictingObservations.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <ThemedText type="small" style={styles.dimText}>
                No conflicting facts linked to this claim.
              </ThemedText>
            </ThemedView>
          ) : (
            conflictingObservations.map((obs) => (
              <ThemedView key={obs.id} type="backgroundElement" style={styles.obsCardConflict}>
                <View style={styles.obsHeader}>
                  <ThemedText type="smallBold" style={styles.factConflictId}>
                    ✕ Fact #{obs.id}
                  </ThemedText>
                  <ThemedText type="small" style={styles.dimText}>
                    From Evidence item: {obs.evidenceId}
                  </ThemedText>
                </View>
                <ThemedText type="default" style={styles.obsText}>"{obs.text}"</ThemedText>
              </ThemedView>
            ))
          )}
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
  backButton: {
    marginBottom: Spacing.one,
  },
  backButtonText: {
    color: BrandColors.indigo,
    fontSize: 13,
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
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: '#FFFFFF',
    gap: Spacing.two,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  statusTitle: {
    fontSize: 12,
    color: BrandColors.muted,
    letterSpacing: 0.5,
  },
  claimText: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
    marginTop: Spacing.half,
  },
  fieldHeader: {
    marginTop: Spacing.one,
    fontSize: 12,
    color: BrandColors.muted,
    letterSpacing: 0.5,
  },
  explanationText: {
    opacity: 0.85,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeader: {
    marginTop: Spacing.two,
    opacity: 0.7,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  emptyCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: '#FFFFFF',
  },
  obsCardSupport: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: '#FFFFFF',
    gap: Spacing.one,
  },
  factSupportId: {
    color: '#059669',
    fontSize: 12,
  },
  obsCardConflict: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: '#FFFFFF',
    gap: Spacing.one,
  },
  factConflictId: {
    color: '#DC2626',
    fontSize: 12,
  },
  obsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  obsText: {
    fontSize: 13,
    lineHeight: 18,
  },
  dimText: {
    opacity: 0.65,
    fontSize: 12,
  },
});
