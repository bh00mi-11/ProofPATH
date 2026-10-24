import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Spacing } from '@/constants/theme';
import { ClaimChange } from '@/types/proofpath.types';
import { ClaimStatusBadge } from './ClaimStatusBadge';

interface ClaimChangeCardProps {
  change: ClaimChange;
  claimStatement?: string;
}

export function ClaimChangeCard({ change, claimStatement }: ClaimChangeCardProps) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {/* Header Disclaimer Tag */}
      <View style={styles.headerRow}>
        <View style={styles.simulatedBadge}>
          <ThemedText type="smallBold" style={styles.simulatedTag}>
            Example simulation result
          </ThemedText>
        </View>
        <ThemedText type="small" style={styles.claimIdText}>
          Claim #{change.claimId}
        </ThemedText>
      </View>

      {/* Claim Statement if available */}
      {claimStatement && (
        <ThemedText type="default" style={styles.statementText}>
          "{claimStatement}"
        </ThemedText>
      )}

      {/* Before -> After Transition Display */}
      <View style={styles.transitionRow}>
        <View style={styles.statusColumn}>
          <ThemedText type="small" style={styles.transitionLabel}>
            Before
          </ThemedText>
          <ClaimStatusBadge status={change.before} />
        </View>

        <ThemedText type="title" style={styles.arrowText}>
          →
        </ThemedText>

        <View style={styles.statusColumn}>
          <ThemedText type="small" style={styles.transitionLabel}>
            After
          </ThemedText>
          <ClaimStatusBadge status={change.after} />
        </View>
      </View>

      {/* Simulation Reason Box */}
      <View style={styles.reasonBox}>
        <ThemedText type="smallBold" style={styles.reasonLabel}>
          Why this changed:
        </ThemedText>
        <ThemedText type="small" style={styles.reasonText}>
          {change.reason}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
    borderLeftWidth: 4,
    borderLeftColor: BrandColors.purple,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  simulatedBadge: {
    backgroundColor: BrandColors.purpleLight,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.one,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  simulatedTag: {
    fontSize: 11,
    color: BrandColors.purple,
    fontWeight: '600',
  },
  claimIdText: {
    fontSize: 12,
    opacity: 0.6,
  },
  statementText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  transitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.one,
    flexWrap: 'wrap',
  },
  statusColumn: {
    gap: 4,
  },
  transitionLabel: {
    fontSize: 11,
    opacity: 0.6,
  },
  arrowText: {
    fontSize: 20,
    lineHeight: 24,
    opacity: 0.4,
    marginHorizontal: Spacing.one,
  },
  reasonBox: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: BrandColors.border,
    gap: 4,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.indigo,
  },
  reasonText: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.85,
  },
});
