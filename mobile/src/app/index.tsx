import React from 'react';
import { StyleSheet, ScrollView, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, BrandColors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCaseState } from '@/context/CaseContext';

export default function HomeScreen() {
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
            <ThemedText type="title">ProofPath</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              Check evidence, test what happens if an item is removed, and choose what to share.
            </ThemedText>
          </View>

          {/* 1-Sentence Demo Notice */}
          <ThemedView type="backgroundElement" style={styles.demoBanner}>
            <ThemedText type="smallBold" style={styles.demoBannerText}>
              Sample demo: All evidence, claims, and reports are fictional examples.
            </ThemedText>
          </ThemedView>

          {/* Active Incident Case Card */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <ThemedText type="smallBold" style={styles.sectionTag}>
                CURRENT INCIDENT
              </ThemedText>
              <View style={styles.activePill}>
                <ThemedText type="smallBold" style={styles.activePillText}>
                  Active Case
                </ThemedText>
              </View>
            </View>

            {isLoading ? (
              <ThemedText>Loading case details...</ThemedText>
            ) : (
              <>
                <ThemedText type="subtitle" style={styles.caseTitle}>
                  {currentCase?.title ?? 'No active incident'}
                </ThemedText>
                <ThemedText type="default" style={styles.caseDesc}>
                  {currentCase?.description}
                </ThemedText>

                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <ThemedText type="title" style={styles.metricNumber}>
                      {evidence.length}
                    </ThemedText>
                    <ThemedText type="small" style={styles.metricLabel}>
                      Evidence items
                    </ThemedText>
                  </View>
                  <View style={styles.metricItem}>
                    <ThemedText type="title" style={styles.metricNumber}>
                      {claims.length}
                    </ThemedText>
                    <ThemedText type="small" style={styles.metricLabel}>
                      Claims tracked
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.buttonRow}>
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => router.push(`/incident/${currentCase?.id ?? 'case-demo-01'}`)}>
                    <ThemedText type="smallBold" style={styles.buttonText}>
                      View incident details →
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => router.push('/incident/create')}>
                    <ThemedText type="smallBold" style={styles.secondaryButtonText}>
                      + New incident
                    </ThemedText>
                  </Pressable>
                </View>
              </>
            )}
          </ThemedView>

          {/* Core Feature Shortcuts */}
          <ThemedText type="smallBold" style={styles.sectionHeader}>
            WHAT WOULD YOU LIKE TO DO?
          </ThemedText>

          <View style={styles.featureGrid}>
            <Pressable
              style={styles.featureCard}
              onPress={() => router.push('/evidence')}>
              <View style={styles.featureCardHeader}>
                <ThemedText type="smallBold" style={styles.featureTitle}>
                  1. Evidence timeline
                </ThemedText>
                <ThemedText type="smallBold" style={styles.featureAction}>
                  Open →
                </ThemedText>
              </View>
              <ThemedText type="small" style={styles.featureDesc}>
                Review all documents, photos, and recordings in chronological order.
              </ThemedText>
            </Pressable>

            <Pressable
              style={styles.featureCard}
              onPress={() => router.push('/time-machine')}>
              <View style={styles.featureCardHeader}>
                <ThemedText type="smallBold" style={styles.featureTitle}>
                  2. What if this item is removed?
                </ThemedText>
                <ThemedText type="smallBold" style={styles.featureAction}>
                  Test →
                </ThemedText>
              </View>
              <ThemedText type="small" style={styles.featureDesc}>
                Temporarily exclude an item and see how claims change.
              </ThemedText>
            </Pressable>

            <Pressable
              style={styles.featureCard}
              onPress={() => router.push('/privacy')}>
              <View style={styles.featureCardHeader}>
                <ThemedText type="smallBold" style={styles.featureTitle}>
                  3. Choose what to share
                </ThemedText>
                <ThemedText type="smallBold" style={styles.featureAction}>
                  Choose →
                </ThemedText>
              </View>
              <ThemedText type="small" style={styles.featureDesc}>
                Select who will read the report and toggle which details stay private.
              </ThemedText>
            </Pressable>
          </View>

          {/* Future Scope Links */}
          <ThemedText type="smallBold" style={styles.sectionHeader}>
            COMING SOON (PREVIEW PLACEHOLDERS)
          </ThemedText>

          <View style={styles.futureRow}>
            <Pressable
              style={styles.placeholderCard}
              onPress={() => router.push('/guardian')}>
              <ThemedText type="smallBold">Guardian access</ThemedText>
              <ThemedText type="small" style={styles.dimText}>
                Read-only access for a family member or advocate.
              </ThemedText>
            </Pressable>

            <Pressable
              style={styles.placeholderCard}
              onPress={() => router.push('/support')}>
              <ThemedText type="smallBold">Support network</ThemedText>
              <ThemedText type="small" style={styles.dimText}>
                Safe connection to counselors and support teams.
              </ThemedText>
            </Pressable>
          </View>
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
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTag: {
    fontSize: 11,
    color: BrandColors.muted,
    letterSpacing: 0.5,
  },
  activePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.one,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  activePillText: {
    color: '#059669',
    fontSize: 11,
  },
  caseTitle: {
    marginTop: Spacing.half,
    fontSize: 18,
    fontWeight: '600',
  },
  caseDesc: {
    opacity: 0.8,
    lineHeight: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.four,
    marginVertical: Spacing.two,
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: BrandColors.border,
  },
  metricItem: {
    flex: 1,
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: BrandColors.indigo,
  },
  metricLabel: {
    opacity: 0.7,
    fontSize: 12,
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: BrandColors.indigo,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 13,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: BrandColors.border,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: BrandColors.indigo,
    fontSize: 13,
  },
  sectionHeader: {
    marginTop: Spacing.two,
    opacity: 0.7,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  featureGrid: {
    gap: Spacing.two,
  },
  featureCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  featureCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 15,
  },
  featureAction: {
    fontSize: 13,
    color: BrandColors.indigo,
  },
  featureDesc: {
    opacity: 0.7,
    fontSize: 12,
    lineHeight: 16,
  },
  futureRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  placeholderCard: {
    flex: 1,
    minWidth: 150,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
    gap: Spacing.half,
  },
  dimText: {
    opacity: 0.65,
    fontSize: 12,
    lineHeight: 16,
  },
});
