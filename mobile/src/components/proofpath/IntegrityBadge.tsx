import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Evidence } from '@/types/proofpath.types';
import { Spacing } from '@/constants/theme';

interface IntegrityBadgeProps {
  integrity: Evidence['integrity'];
  showFullNotice?: boolean;
}

const INTEGRITY_CONFIG: Record<
  Evidence['integrity'],
  { label: string; bg: string; border: string; text: string }
> = {
  MATCH: {
    label: '✓ Check: Match',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    text: '#059669',
  },
  MISMATCH: {
    label: '✕ Check: Mismatch',
    bg: '#FEF2F2',
    border: '#FECACA',
    text: '#DC2626',
  },
  NOT_CHECKED: {
    label: '○ Check: Not checked',
    bg: '#F1F5F9',
    border: '#CBD5E1',
    text: '#475569',
  },
};

export function IntegrityBadge({
  integrity,
  showFullNotice = false,
}: IntegrityBadgeProps) {
  const config = INTEGRITY_CONFIG[integrity] ?? INTEGRITY_CONFIG.NOT_CHECKED;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          { backgroundColor: config.bg, borderColor: config.border },
        ]}>
        <ThemedText
          type="smallBold"
          style={[styles.badgeText, { color: config.text }]}>
          {config.label}
        </ThemedText>
      </View>

      <ThemedText type="small" style={styles.disclaimerText}>
        Example check only
      </ThemedText>

      {showFullNotice && (
        <ThemedText type="small" style={styles.fullNotice}>
          This is a sample check for this demo, not a certified legal test.
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
    alignSelf: 'flex-start',
  },
  badge: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 3,
    borderRadius: Spacing.two,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  disclaimerText: {
    fontSize: 11,
    opacity: 0.55,
  },
  fullNotice: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 2,
  },
});
