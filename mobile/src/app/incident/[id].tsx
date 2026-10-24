import React from 'react';
import { StyleSheet, ScrollView, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, BrandColors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCaseState } from '@/context/CaseContext';
import { ClaimStatusBadge } from '@/components/proofpath';

export default function IncidentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentCase, claims, evidence, isLoading } = useCaseState();

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
                ← Back to Overview
              </ThemedText>
            </Pressable>
            <ThemedText type="title">Incident details</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              Reviewing case facts, claims, and supporting evidence.
            </ThemedText>
          </View>

          {/* 1-Sentence Demo Notice */}
          <ThemedView type="backgroundElement" style={styles.demoBanner}>
            <ThemedText type="smallBold" style={styles.demoBannerText}>
              Sample demo: All case details and claims are fictional examples.
            </ThemedText>
          </ThemedView>

          {/* Incident Overview Card */}
          <ThemedView type="backgroundElement" style={styles.overviewCard}>
            <ThemedText type="subtitle">
              {currentCase?.title ?? 'Case Details'}
            </ThemedText>
            <ThemedText type="default" style={styles.dimText}>
              {currentCase?.description}
            </ThemedText>
            <ThemedText type="small" style={styles.dateText}>
              Registered:{' '}
              {currentCase?.createdAt
                ? new Date(currentCase.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'N/A'}
            </ThemedText>
          </ThemedView>

          {/* Associated Claims */}
          <ThemedText type="smallBold" style={styles.sectionHeader}>
            CLAIMS IN THIS INCIDENT ({claims.length})
          </ThemedText>

          {isLoading ? (
            <ThemedText>Loading claims...</ThemedText>
          ) : (
            claims.map((claim) => (
              <Pressable
                key={claim.id}
                onPress={() => router.push(`/claim/${claim.id}`)}>
                <ThemedView type="backgroundElement" style={styles.claimCard}>
                  <View style={styles.claimHeader}>
                    <ThemedText type="smallBold">Claim #{claim.id}</ThemedText>
                    <ClaimStatusBadge status={claim.status} />
                  </View>
                  <ThemedText type="default" style={styles.claimText}>
                    "{claim.text}"
                  </ThemedText>
                  <View style={styles.obsCountRow}>
                    <ThemedText type="small" style={styles.supportCountText}>
                      ✓ {claim.supportingObservationIds.length} Supporting facts
                    </ThemedText>
                    <ThemedText type="small" style={styles.conflictCountText}>
                      ✕ {claim.conflictingObservationIds.length} Conflicting facts
                    </ThemedText>
                  </View>
                  <ThemedText type="smallBold" style={styles.viewMoreText}>
                    View claim details & facts →
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))
          )}

          {/* Associated Evidence Summary */}
          <ThemedText type="smallBold" style={styles.sectionHeader}>
            EVIDENCE LINKED TO THIS INCIDENT ({evidence.length})
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.evidenceSummaryCard}>
            <ThemedText type="small" style={styles.evidenceSummaryDesc}>
              {evidence.length} evidence items are connected to this case. You can inspect each item on the Evidence timeline.
            </ThemedText>
            <Pressable
              style={styles.evidenceButton}
              onPress={() => router.push('/evidence')}>
              <ThemedText type="smallBold" style={styles.evidenceButtonText}>
                Go to Evidence timeline →
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
  overviewCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: '#FFFFFF',
    gap: Spacing.one,
  },
  dateText: {
    opacity: 0.6,
    fontSize: 12,
    marginTop: 4,
  },
  sectionHeader: {
    marginTop: Spacing.two,
    opacity: 0.7,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  claimCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: '#FFFFFF',
    gap: Spacing.one,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  claimText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  obsCountRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
    flexWrap: 'wrap',
  },
  supportCountText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '500',
  },
  conflictCountText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
  },
  viewMoreText: {
    color: BrandColors.indigo,
    fontSize: 13,
    marginTop: Spacing.half,
  },
  evidenceSummaryCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: '#FFFFFF',
    gap: Spacing.two,
  },
  evidenceSummaryDesc: {
    fontSize: 13,
    opacity: 0.8,
    lineHeight: 18,
  },
  evidenceButton: {
    backgroundColor: BrandColors.indigo,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignSelf: 'flex-start',
  },
  evidenceButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  dimText: {
    opacity: 0.75,
    lineHeight: 20,
  },
});
