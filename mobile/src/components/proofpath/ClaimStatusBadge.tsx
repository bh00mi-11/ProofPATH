import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ClaimStatus } from '@/types/proofpath.types';
import { Spacing } from '@/constants/theme';

interface ClaimStatusBadgeProps {
  status: ClaimStatus;
}

const STATUS_CONFIG: Record<
  ClaimStatus,
  { label: string; bg: string; border: string; text: string }
> = {
  SUPPORTED: {
    label: '✓ Supported',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    text: '#059669',
  },
  CONFLICTED: {
    label: '✕ Conflicted',
    bg: '#FEF2F2',
    border: '#FECACA',
    text: '#DC2626',
  },
  REVIEW_NEEDED: {
    label: '⚠ Needs review',
    bg: '#FFFBEB',
    border: '#FDE68A',
    text: '#D97706',
  },
  UNVERIFIED: {
    label: '○ Not yet verified',
    bg: '#F1F5F9',
    border: '#CBD5E1',
    text: '#475569',
  },
};

export function ClaimStatusBadge({ status }: ClaimStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.UNVERIFIED;

  return (
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
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 4,
    borderRadius: Spacing.two,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
