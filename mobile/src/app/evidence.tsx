import React, { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, BrandColors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCaseState } from '@/context/CaseContext';
import { EvidenceTimelineCard } from '@/components/proofpath';
import { router } from 'expo-router';

export default function EvidenceScreen() {
  const { evidence, observations, claims, isLoading } = useCaseState();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Chronological timeline sorting by ingestedAt
  const sortedEvidence = useMemo(() => {
    return [...evidence].sort((a, b) => {
      const timeA = new Date(a.ingestedAt).getTime();
      const timeB = new Date(b.ingestedAt).getTime();
      return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [evidence, sortDirection]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="title">Evidence timeline</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              Every piece of evidence listed in the order it was received.
            </ThemedText>
          </View>

          {/* 1-Sentence Demo Notice */}
          <ThemedView type="backgroundElement" style={styles.demoBanner}>
            <ThemedText type="smallBold" style={styles.demoBannerText}>
              Sample demo: Uploading and storing real files is not supported in this demo.
            </ThemedText>
          </ThemedView>

          {/* Chronological Sorting Controls */}
          <ThemedView type="backgroundElement" style={styles.controlsCard}>
            <View style={styles.controlsHeader}>
              <ThemedText type="smallBold" style={styles.controlsTitle}>
                SORT ORDER ({sortedEvidence.length} ITEMS)
              </ThemedText>
              <ThemedText type="small" style={styles.sortStatusText}>
                {sortDirection === 'asc' ? 'Oldest first' : 'Newest first'}
              </ThemedText>
            </View>

            <View style={styles.sortButtonGroup}>
              <Pressable
                style={[
                  styles.sortButton,
                  sortDirection === 'asc' && styles.sortButtonActive,
                ]}
                onPress={() => setSortDirection('asc')}>
                <ThemedText
                  type="smallBold"
                  style={sortDirection === 'asc' ? styles.sortTextActive : styles.sortTextInactive}>
                  Oldest first
                </ThemedText>
              </Pressable>

              <Pressable
                style={[
                  styles.sortButton,
                  sortDirection === 'desc' && styles.sortButtonActive,
                ]}
                onPress={() => setSortDirection('desc')}>
                <ThemedText
                  type="smallBold"
                  style={sortDirection === 'desc' ? styles.sortTextActive : styles.sortTextInactive}>
                  Newest first
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>

          {/* Chronological Evidence Cards */}
          <ThemedText type="smallBold" style={styles.sectionHeader}>
            ALL EVIDENCE ITEMS ({sortedEvidence.length})
          </ThemedText>

          {isLoading ? (
            <ThemedText>Loading evidence timeline...</ThemedText>
          ) : (
            sortedEvidence.map((item) => {
              const linkedObs = observations.filter(
                (obs) => obs.evidenceId === item.id
              );
              return (
                <EvidenceTimelineCard
                  key={item.id}
                  evidence={item}
                  observations={linkedObs}
                  claims={claims}
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
              Test removing an item
            </ThemedText>
            <ThemedText type="small" style={styles.nextActionDesc}>
              See how claim conclusions change if a piece of evidence is missing.
            </ThemedText>
            <Pressable
              style={styles.nextActionButton}
              onPress={() => router.push('/time-machine')}>
              <ThemedText type="smallBold" style={styles.nextActionButtonText}>
                Go to Time Machine →
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
  controlsCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.border,
    gap: Spacing.two,
  },
  controlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlsTitle: {
    fontSize: 12,
    color: BrandColors.muted,
  },
  sortStatusText: {
    fontSize: 12,
    color: BrandColors.indigo,
    fontWeight: '600',
  },
  sortButtonGroup: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: BrandColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  sortButtonActive: {
    backgroundColor: BrandColors.indigo,
    borderColor: BrandColors.indigo,
  },
  sortTextActive: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  sortTextInactive: {
    color: BrandColors.muted,
    fontSize: 13,
  },
  sectionHeader: {
    opacity: 0.7,
    marginTop: Spacing.one,
    fontSize: 12,
    letterSpacing: 0.5,
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
});
