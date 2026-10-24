import React, { useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Spacing } from '@/constants/theme';
import { Evidence, Observation, Claim } from '@/types/proofpath.types';
import { IntegrityBadge } from './IntegrityBadge';

const TYPE_LABELS: Record<Evidence['type'], string> = {
  image: '📷 Image',
  document: '📄 Document',
  transcript: '🎙 Audio transcript',
  url: '🔗 Web link',
  session: '💻 Session log',
};

interface EvidenceTimelineCardProps {
  evidence: Evidence;
  observations: Observation[];
  claims?: Claim[];
  isExcluded?: boolean;
  onToggleExclude?: () => void;
  showExclusionControl?: boolean;
}

export function EvidenceTimelineCard({
  evidence,
  observations,
  claims = [],
  isExcluded = false,
  onToggleExclude,
  showExclusionControl = false,
}: EvidenceTimelineCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <ThemedView
      type="backgroundElement"
      style={[
        styles.card,
        isExcluded && styles.excludedCard,
      ]}>
      {/* Top Meta Row */}
      <View style={styles.topRow}>
        <View style={styles.typeBadge}>
          <ThemedText type="smallBold" style={styles.typeText}>
            {TYPE_LABELS[evidence.type] ?? evidence.type}
          </ThemedText>
        </View>

        <ThemedText type="small" style={styles.timestampText}>
          {new Date(evidence.ingestedAt).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </ThemedText>
      </View>

      {/* Title */}
      <ThemedText
        type="subtitle"
        style={[
          styles.title,
          isExcluded && styles.strikethroughText,
        ]}>
        {evidence.name}
      </ThemedText>

      {/* Mock Integrity Badge */}
      <View style={styles.integrityRow}>
        <IntegrityBadge integrity={evidence.integrity} />
      </View>

      {/* Time Machine Exclusion Control (if active) */}
      {showExclusionControl && onToggleExclude && (
        <Pressable
          style={[
            styles.excludeButton,
            isExcluded ? styles.reincludeButton : styles.excludeButtonActive,
          ]}
          onPress={onToggleExclude}>
          <ThemedText
            type="smallBold"
            style={isExcluded ? styles.reincludeButtonText : styles.excludeButtonText}>
            {isExcluded ? '✓ Put back in test' : '− Remove from test'}
          </ThemedText>
        </Pressable>
      )}

      {/* Expandable Observations Toggle */}
      <Pressable
        style={styles.expandHeader}
        onPress={() => setIsExpanded((prev) => !prev)}>
        <ThemedText type="smallBold" style={styles.expandLabel}>
          {isExpanded ? '▼ Hide facts' : '▶ Show facts'} ({observations.length})
        </ThemedText>
      </Pressable>

      {/* Expanded Observation Snippets */}
      {isExpanded && (
        <View style={styles.obsList}>
          {observations.length === 0 ? (
            <ThemedText type="small" style={styles.dimText}>
              No facts recorded for this item yet.
            </ThemedText>
          ) : (
            observations.map((obs) => {
              const supportingClaims = claims.filter((c) =>
                c.supportingObservationIds.includes(obs.id)
              );
              const conflictingClaims = claims.filter((c) =>
                c.conflictingObservationIds.includes(obs.id)
              );

              return (
                <View key={obs.id} style={styles.obsSnippet}>
                  <View style={styles.obsMeta}>
                    <ThemedText type="smallBold" style={styles.obsId}>
                      Fact #{obs.id}
                    </ThemedText>
                    <ThemedText type="small" style={styles.dimText}>
                      Recorded {new Date(obs.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </ThemedText>
                  </View>
                  <ThemedText type="default" style={styles.obsText}>
                    "{obs.text}"
                  </ThemedText>

                  {/* Connected Claims References */}
                  {(supportingClaims.length > 0 || conflictingClaims.length > 0) && (
                    <View style={styles.claimLinksContainer}>
                      {supportingClaims.map((c) => (
                        <View key={`sup-${c.id}`} style={styles.claimSupportChip}>
                          <ThemedText type="small" style={styles.supportChipText}>
                            ✓ Supports: "{c.text}"
                          </ThemedText>
                        </View>
                      ))}
                      {conflictingClaims.map((c) => (
                        <View key={`con-${c.id}`} style={styles.claimConflictChip}>
                          <ThemedText type="small" style={styles.conflictChipText}>
                            ✕ Conflicts with: "{c.text}"
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  excludedCard: {
    opacity: 0.6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  typeBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Spacing.one,
    backgroundColor: BrandColors.indigoLight,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.indigo,
  },
  timestampText: {
    opacity: 0.65,
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  strikethroughText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  integrityRow: {
    marginVertical: 2,
  },
  excludeButton: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
  },
  excludeButtonActive: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  excludeButtonText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  reincludeButton: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  reincludeButtonText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  },
  expandHeader: {
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: BrandColors.border,
    marginTop: Spacing.one,
  },
  expandLabel: {
    color: BrandColors.indigo,
    fontSize: 13,
    fontWeight: '600',
  },
  obsList: {
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  obsSnippet: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: BrandColors.border,
    gap: 6,
  },
  obsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  obsId: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.indigo,
  },
  obsText: {
    lineHeight: 20,
    fontSize: 13,
  },
  claimLinksContainer: {
    gap: 4,
    marginTop: 4,
  },
  claimSupportChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#ECFDF5',
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
  },
  supportChipText: {
    color: '#059669',
    fontSize: 11,
    lineHeight: 16,
  },
  claimConflictChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  conflictChipText: {
    color: '#DC2626',
    fontSize: 11,
    lineHeight: 16,
  },
  dimText: {
    opacity: 0.6,
    fontSize: 12,
  },
});
