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
  isFirst?: boolean;
  isLast?: boolean;
  stepNumber?: number;
  onAddObservation?: (evidence: Evidence) => void;
  onReviewFacts?: (evidence: Evidence) => void;
  onLinkObservationToClaim?: (obs: Observation, claimId: string, rel: 'SUPPORTS' | 'CONTRADICTS' | 'CONTEXT') => void;
}

export function EvidenceTimelineCard({
  evidence,
  observations,
  claims = [],
  isExcluded = false,
  onToggleExclude,
  showExclusionControl = false,
  isFirst = false,
  isLast = false,
  stepNumber = 1,
  onAddObservation,
  onReviewFacts,
  onLinkObservationToClaim,
}: EvidenceTimelineCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [linkingObsId, setLinkingObsId] = useState<string | null>(null);

  const isTextDoc = evidence.type === 'document' || evidence.name.endsWith('.txt') || evidence.name.endsWith('.csv');

  return (
    <View style={styles.timelineItemWrapper}>
      {/* Timeline Column with Continuous Spine and Node */}
      <View style={styles.timelineCol}>
        <View style={[styles.timelineTopLine, isFirst && styles.timelineLineInvisible]} />
        <View style={[styles.timelineNode, isExcluded && styles.timelineNodeExcluded]}>
          <ThemedText style={styles.timelineNodeText}>{stepNumber}</ThemedText>
        </View>
        <View style={[styles.timelineBottomLine, isLast && styles.timelineLineInvisible]} />
      </View>

      {/* Main Evidence Card Body */}
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

        {!isExpanded && <ThemedText type="small" numberOfLines={2} style={styles.dimText}>
          {observations.length > 0 ? observations[0].text : 'Saved. Add a note about what this file shows when you are ready.'}
        </ThemedText>}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? 'Hide evidence details' : 'Show evidence details'}
          onPress={() => setIsExpanded((prev) => !prev)}
          style={{ paddingVertical: 12 }}>
          <ThemedText type="smallBold" style={styles.expandLabel}>
            {isExpanded ? 'Hide details ▲' : 'See details and connections ▼'}
          </ThemedText>
        </Pressable>
        {isExpanded && (
        <>
        {/* Visual Artifact Preview Card - Derived strictly from artifact facts or shows explicit file status */}
        {observations.length > 0 ? (
          <View style={isTextDoc || evidence.name.endsWith('.pdf') ? styles.documentPreviewBox : styles.imagePreviewBox}>
            <View style={styles.previewHeaderBar}>
              {!isTextDoc && !evidence.name.endsWith('.pdf') ? (
                <>
                  <View style={styles.previewDotRed} />
                  <View style={styles.previewDotYellow} />
                  <View style={styles.previewDotGreen} />
                </>
              ) : null}
              <ThemedText style={styles.previewWindowLabel}>
                {evidence.name.toUpperCase()}
              </ThemedText>
            </View>
            <View style={styles.previewContentArea}>
              <ThemedText style={styles.previewMessageSender}>
                [{evidence.type.toUpperCase()} ARTIFACT • {observations.length} RECORDED FACT{observations.length > 1 ? 'S' : ''}]
              </ThemedText>
              <ThemedText style={styles.previewMessageBody}>
                "{observations[0].text}"
              </ThemedText>
              {observations.length > 1 ? (
                <ThemedText style={styles.previewDocSubtitle}>
                  + {observations.length - 1} additional recorded detail{observations.length > 2 ? 's' : ''} in timeline
                </ThemedText>
              ) : null}
              <View style={styles.previewWatermark}>
                <ThemedText style={styles.watermarkText}>
                  File fingerprint: {evidence.sha256 ? `${evidence.sha256.slice(0, 16)}...` : 'REGISTERED IN VAULT'}
                </ThemedText>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noFactsPreviewBox}>
            <View style={styles.noFactsHeader}>
              <ThemedText style={styles.noFactsIcon}>📄</ThemedText>
              <View style={styles.noFactsCol}>
                <ThemedText type="smallBold" style={styles.noFactsTitle}>
                  No observations or facts recorded for this artifact yet
                </ThemedText>
                <ThemedText type="small" style={styles.noFactsSub}>
                  The original file and its saved SHA-256 fingerprint can be reviewed in the vault.
                </ThemedText>
              </View>
            </View>

            {/* Quick action buttons on card */}
            <View style={styles.cardQuickActionRow}>
              {isTextDoc && onReviewFacts ? (
                <Pressable
                  style={styles.reviewFactsBtn}
                  onPress={() => onReviewFacts(evidence)}
                >
                  <ThemedText style={styles.reviewFactsBtnText}>
                    Review suggested details
                  </ThemedText>
                </Pressable>
              ) : null}
              {onAddObservation ? (
                <Pressable
                  style={styles.addFactManualBtn}
                  onPress={() => onAddObservation(evidence)}
                >
                  <ThemedText style={styles.addFactManualBtnText}>
                    + Add a note
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
          </View>
        )}

        {/* Integrity Badge & SHA-256 Digest */}
        <View style={styles.integrityRow}>
          <IntegrityBadge integrity={evidence.integrity} />
          {evidence.sha256 ? (
            <ThemedText type="code" style={styles.sha256Text}>
              SHA-256: {evidence.sha256.slice(0, 16)}...{evidence.sha256.slice(-8)}
            </ThemedText>
          ) : null}
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
              {isExcluded ? '✓ Put back in review' : '− See what changes without this evidence'}
            </ThemedText>
          </Pressable>
        )}

        {/* Observation Actions & Expandable Section */}
        <View style={styles.obsSectionHeaderRow}>
          <Pressable
            style={styles.expandHeader}
            onPress={() => setIsExpanded((prev) => !prev)}>
            <ThemedText type="smallBold" style={styles.expandLabel}>
              {isExpanded ? 'Hide recorded details' : 'Show recorded details'} ({observations.length})
            </ThemedText>
          </Pressable>

          <View style={styles.cardHeaderActions}>
            {isTextDoc && onReviewFacts ? (
              <Pressable
                style={styles.smallActionPill}
                onPress={() => onReviewFacts(evidence)}
              >
                <ThemedText style={styles.smallActionPillText}>Review suggestions</ThemedText>
              </Pressable>
            ) : null}
            {onAddObservation ? (
              <Pressable
                style={styles.smallActionPillSecondary}
                onPress={() => onAddObservation(evidence)}
              >
                <ThemedText style={styles.smallActionPillSecondaryText}>+ Add Detail</ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>

        </>
        )}

        {/* Expanded Observation Snippets */}
        {isExpanded && (
          <View style={styles.obsList}>
            {observations.length === 0 ? (
              <View style={styles.emptyObsNotice}>
                <ThemedText type="small" style={styles.dimText}>
                  No recorded details saved for this evidence yet.
                </ThemedText>
                <ThemedText type="small" style={styles.emptyObsHint}>
                  Tap "Review Details" to find dates, messages, or senders, or tap "+ Add Detail" to enter one manually.
                </ThemedText>
              </View>
            ) : (
              observations.map((obs) => {
                const supportingClaims = claims.filter((c) =>
                  c.supportingObservationIds.includes(obs.id)
                );
                const conflictingClaims = claims.filter((c) =>
                  c.conflictingObservationIds.includes(obs.id)
                );

                const isLinkingThis = linkingObsId === obs.id;

                return (
                  <View key={obs.id} style={styles.obsSnippet}>
                    <View style={styles.obsMeta}>
                      <View style={styles.obsBadgeAndField}>
                        <ThemedText type="smallBold" style={styles.obsId}>
                          Recorded detail
                        </ThemedText>
                        {obs.field ? (
                          <View style={styles.obsFieldTag}>
                            <ThemedText style={styles.obsFieldTagText}>{obs.field}</ThemedText>
                          </View>
                        ) : null}
                      </View>
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

                    {/* Link to Statement controls */}
                    {claims.length > 0 && onLinkObservationToClaim && (
                      <View style={styles.linkingBar}>
                        <Pressable
                          style={styles.toggleLinkRowBtn}
                          onPress={() => setLinkingObsId(isLinkingThis ? null : obs.id)}
                        >
                          <ThemedText style={styles.toggleLinkRowBtnText}>
                            {isLinkingThis ? '▲ Close statement linking' : '🔗 Connect to a statement...'}
                          </ThemedText>
                        </Pressable>

                        {isLinkingThis && (
                          <View style={styles.claimSelectionDrawer}>
                            <ThemedText type="smallBold" style={styles.drawerTitle}>
                              Connect this detail to a statement:
                            </ThemedText>
                            {claims.map((clm) => (
                              <View key={clm.id} style={styles.claimOptionItem}>
                                <ThemedText type="small" style={styles.claimOptionText}>
                                  "{clm.text}"
                                </ThemedText>
                                <View style={styles.relationButtonsRow}>
                                  <Pressable
                                    style={styles.relButtonSupport}
                                    onPress={() => {
                                      onLinkObservationToClaim(obs, clm.id, 'SUPPORTS');
                                      setLinkingObsId(null);
                                    }}
                                  >
                                    <ThemedText style={styles.relButtonSupportText}>✓ Supports</ThemedText>
                                  </Pressable>
                                  <Pressable
                                    style={styles.relButtonConflict}
                                    onPress={() => {
                                      onLinkObservationToClaim(obs, clm.id, 'CONTRADICTS');
                                      setLinkingObsId(null);
                                    }}
                                  >
                                    <ThemedText style={styles.relButtonConflictText}>✕ Doesn't match</ThemedText>
                                  </Pressable>
                                </View>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  timelineItemWrapper: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 14,
    width: '100%',
  },
  timelineCol: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  timelineTopLine: {
    width: 2,
    flex: 1,
    minHeight: 12,
    backgroundColor: '#CBD5E1',
  },
  timelineBottomLine: {
    width: 2,
    flex: 3,
    backgroundColor: '#CBD5E1',
  },
  timelineLineInvisible: {
    backgroundColor: 'transparent',
  },
  timelineNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 2,
  },
  timelineNodeExcluded: {
    backgroundColor: '#EF4444',
    borderColor: '#FECACA',
  },
  timelineNodeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  card: {
    flex: 1,
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: '#FFFFFF',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  sha256Text: {
    fontSize: 11,
    opacity: 0.7,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
  imagePreviewBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 6,
  },
  documentPreviewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 6,
  },
  previewHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  previewDotRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  previewDotYellow: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  previewDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  previewWindowLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  previewContentArea: {
    padding: 12,
    gap: 6,
  },
  previewMessageSender: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  previewMessageBody: {
    fontSize: 13,
    color: '#F1F5F9',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  previewDocTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  previewDocSubtitle: {
    fontSize: 12,
    color: '#475569',
  },
  previewWatermark: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  watermarkText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  previewUnavailableBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    marginBottom: 6,
  },
  previewUnavailableIcon: {
    fontSize: 20,
    opacity: 0.7,
  },
  previewUnavailableCol: {
    flex: 1,
    gap: 2,
  },
  previewUnavailableTitle: {
    color: '#64748B',
    fontSize: 12,
  },
  previewUnavailableSub: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 15,
  },
  noFactsPreviewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 4,
    marginBottom: 6,
    gap: 10,
  },
  noFactsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noFactsIcon: {
    fontSize: 22,
  },
  noFactsCol: {
    flex: 1,
  },
  noFactsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  noFactsSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 2,
  },
  cardQuickActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  reviewFactsBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  reviewFactsBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  addFactManualBtn: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  addFactManualBtnText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  obsSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  cardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallActionPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  smallActionPillText: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '700',
  },
  smallActionPillSecondary: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  smallActionPillSecondaryText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyObsNotice: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  emptyObsHint: {
    color: '#94A3B8',
    fontSize: 11,
    fontStyle: 'italic',
  },
  obsBadgeAndField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  obsFieldTag: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  obsFieldTagText: {
    color: '#6D28D9',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  linkingBar: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
  },
  toggleLinkRowBtn: {
    paddingVertical: 4,
  },
  toggleLinkRowBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  claimSelectionDrawer: {
    marginTop: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  drawerTitle: {
    fontSize: 11,
    color: '#334155',
    marginBottom: 2,
  },
  claimOptionItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 8,
    gap: 6,
  },
  claimOptionText: {
    fontSize: 11,
    color: '#1E293B',
    fontStyle: 'italic',
  },
  relationButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  relButtonSupport: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  relButtonSupportText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '700',
  },
  relButtonConflict: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  relButtonConflictText: {
    color: '#991B1B',
    fontSize: 11,
    fontWeight: '700',
  },
});
