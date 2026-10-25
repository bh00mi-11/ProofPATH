import type { Href } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  ActivityIndicator,
  TextInput,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, MaxContentWidth, Spacing } from '@/constants/theme';
import { apiCaseService } from '@/services/api-case-service';
import { useCaseState } from '@/context/CaseContext';
import {
  AccountabilityTimeline,
  AccountabilityEntry,
  CaseProgressStatus,
  PendingFollowUp,
} from '@/types/proofpath.types';
import { safeBack } from '@/utils/navigation';

const STATUS_CONFIG: Record<
  CaseProgressStatus,
  { label: string; bg: string; border: string; text: string }
> = {
  NOT_REPORTED: {
    label: 'NOT REPORTED',
    bg: '#F1F5F9',
    border: '#CBD5E1',
    text: '#475569',
  },
  SUBMITTED: {
    label: 'SUBMITTED',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    text: '#1D4ED8',
  },
  ACKNOWLEDGED: {
    label: 'ACKNOWLEDGED',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    text: '#15803D',
  },
  UNDER_REVIEW: {
    label: 'UNDER REVIEW',
    bg: '#FEF3C7',
    border: '#FDE68A',
    text: '#B45309',
  },
  RESOLVED: {
    label: 'RESOLVED',
    bg: '#DCFCE7',
    border: '#86EFAC',
    text: '#166534',
  },
  UNKNOWN: {
    label: 'UNKNOWN',
    bg: '#F3F4F6',
    border: '#E5E7EB',
    text: '#6B7280',
  },
};

import { useTranslation } from '@/context/LanguageContext';

export default function AccountabilityTrailScreen() {
  const { t } = useTranslation();
  const { currentCase, evidence } = useCaseState();
  const caseId = currentCase?.id;

  const [data, setData] = useState<AccountabilityTimeline | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [formActionType, setFormActionType] = useState<string>('REPORT_PREPARED');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formEventTime, setFormEventTime] = useState<string>(
    new Date().toISOString().slice(0, 16).replace('T', ' ')
  );
  const [formStatus, setFormStatus] = useState<CaseProgressStatus>('NOT_REPORTED');
  const [formOrg, setFormOrg] = useState<string>('');
  const [formArtifactId, setFormArtifactId] = useState<string>('');
  const [formRefNum, setFormRefNum] = useState<string>('');
  const [formFollowUpDate, setFormFollowUpDate] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Follow up completion modal/state
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [followUpNote, setFollowUpNote] = useState<string>('');

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!caseId) { setError('Create or select a case first.'); return; }
      const res = await apiCaseService.getAccountabilityTimeline(caseId);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load accountability timeline.');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const handleCreateEntry = async () => {
    if (!formDescription.trim()) {
      alert('Please provide an event description.');
      return;
    }
    setSubmitting(true);
    try {
      await apiCaseService.addAccountabilityEntry(caseId, {
        action_type: formActionType,
        description: formDescription.trim(),
        user_event_time: formEventTime.trim(),
        status: formStatus,
        organization: formOrg.trim() || undefined,
        artifact_id: formArtifactId || undefined,
        reference_number: formRefNum.trim() || undefined,
        next_follow_up_date: formFollowUpDate.trim() || undefined,
      });
      // Reset form
      setFormDescription('');
      setFormOrg('');
      setFormRefNum('');
      setFormFollowUpDate('');
      setFormArtifactId('');
      setShowAddForm(false);
      await fetchTimeline();
    } catch (err: any) {
      alert(`Could not record entry: ${err?.message || 'Error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteFollowUp = async (entryId: string) => {
    if (!followUpNote.trim()) {
      alert('Please describe what occurred during the follow up.');
      return;
    }
    setSubmitting(true);
    try {
      await apiCaseService.completeFollowUp(caseId, entryId, {
        completion_note: followUpNote.trim(),
        completion_time: new Date().toISOString().slice(0, 16).replace('T', ' '),
      });
      setCompletingId(null);
      setFollowUpNote('');
      await fetchTimeline();
    } catch (err: any) {
      alert(`Could not complete follow-up: ${err?.message || 'Error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const currentStatusConf = data
    ? STATUS_CONFIG[data.current_recorded_status] || STATUS_CONFIG.UNKNOWN
    : STATUS_CONFIG.UNKNOWN;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => safeBack('/support')} style={styles.backButton}>
              <ThemedText type="smallBold" style={styles.backButtonText}>
                ← {t.common.backToOverview}
              </ThemedText>
            </Pressable>
            <ThemedText type="title">{t.accountability.title}</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              {t.accountability.subtitle}
            </ThemedText>
          </View>

          {/* Current Recorded Status Card */}
          <ThemedView type="backgroundElement" style={styles.statusCard}>
            <View style={styles.statusHeaderRow}>
              <View>
                <ThemedText style={styles.statusCardLabel}>{t.accountability.currentStatusTitle}</ThemedText>
                <ThemedText style={styles.statusCardSub}>
                  {data?.case_title || 'Active Incident'}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: currentStatusConf.bg, borderColor: currentStatusConf.border },
                ]}>
                <ThemedText style={[styles.statusBadgeText, { color: currentStatusConf.text }]}>
                  {currentStatusConf.label}
                </ThemedText>
              </View>
            </View>

            <View style={styles.provenanceNoticeBox}>
              <ThemedText style={styles.provenanceNoticeText}>
                ⚠️ {t.accountability.disclaimerBody}
              </ThemedText>
            </View>
          </ThemedView>

          {/* Pending / Overdue Follow-ups Card */}
          {data && data.pending_follow_ups.length > 0 && (
            <ThemedView type="backgroundElement" style={styles.pendingCard}>
              <View style={styles.pendingHeader}>
                <ThemedText style={styles.pendingTitle}>
                  PENDING FOLLOW-UPS ({data.pending_follow_ups.length})
                </ThemedText>
              </View>
              {data.pending_follow_ups.map((pf: PendingFollowUp) => (
                <View
                  key={pf.entry_id}
                  style={[
                    styles.followUpItem,
                    pf.is_overdue && styles.followUpOverdue,
                  ]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <ThemedText style={styles.followUpAction}>
                        {pf.action_type.replace(/_/g, ' ')}
                      </ThemedText>
                      {pf.is_overdue && (
                        <View style={styles.overdueBadge}>
                          <ThemedText style={styles.overdueText}>OVERDUE</ThemedText>
                        </View>
                      )}
                    </View>
                    <ThemedText style={styles.followUpDesc}>{pf.description}</ThemedText>
                    <ThemedText style={styles.followUpDate}>
                      Target Date: <b>{pf.due_date}</b> {pf.organization ? `• ${pf.organization}` : ''}
                    </ThemedText>
                  </View>

                  <Pressable
                    onPress={() => setCompletingId(pf.entry_id)}
                    style={styles.completeBtn}>
                    <ThemedText style={styles.completeBtnText}>Mark Done ✓</ThemedText>
                  </Pressable>
                </View>
              ))}
            </ThemedView>
          )}

          {/* Follow-up completion prompt modal/card */}
          {completingId && (
            <ThemedView type="backgroundElement" style={styles.completeModalCard}>
              <ThemedText style={styles.formTitle}>Record Follow-up Completion</ThemedText>
              <ThemedText style={styles.inputLabel}>
                What happened during this follow-up? (e.g. acknowledgment received, docket number assigned)
              </ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="Spoke with officer in charge; docket confirmed..."
                value={followUpNote}
                onChangeText={setFollowUpNote}
                multiline
              />
              <View style={styles.formActionsRow}>
                <Pressable
                  onPress={() => {
                    setCompletingId(null);
                    setFollowUpNote('');
                  }}
                  style={styles.cancelBtn}>
                  <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
                </Pressable>
                <Pressable
                  disabled={submitting}
                  onPress={() => handleCompleteFollowUp(completingId)}
                  style={styles.submitBtn}>
                  <ThemedText style={styles.submitBtnText}>
                    {submitting ? 'Saving...' : 'Confirm & Log Event'}
                  </ThemedText>
                </Pressable>
              </View>
            </ThemedView>
          )}

          {/* Action Bar */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => setShowAddForm(!showAddForm)}
              style={({ pressed }) => [
                styles.addEventBtn,
                pressed && styles.pressed,
              ]}>
              <ThemedText style={styles.addEventBtnText}>
                {showAddForm ? '✕ Close Form' : '+ Record New Action or Status'}
              </ThemedText>
            </Pressable>
          </View>

          {/* Add Entry Form Card */}
          {showAddForm && (
            <ThemedView type="backgroundElement" style={styles.formCard}>
              <ThemedText style={styles.formTitle}>Record Historical Reporting Action</ThemedText>

              {/* Action Type */}
              <ThemedText style={styles.inputLabel}>Action Type</ThemedText>
              <View style={styles.typeSelectorRow}>
                {[
                  'REPORT_PREPARED',
                  'COMPLAINT_SUBMITTED',
                  'ACKNOWLEDGMENT_RECEIVED',
                  'CASE_STATUS_UPDATED',
                ].map((act) => (
                  <Pressable
                    key={act}
                    onPress={() => setFormActionType(act)}
                    style={[
                      styles.typeSelectorChip,
                      formActionType === act && styles.typeSelectorChipActive,
                    ]}>
                    <ThemedText
                      style={[
                        styles.typeChipText,
                        formActionType === act && styles.typeChipTextActive,
                      ]}>
                      {act.replace(/_/g, ' ')}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              {/* Description */}
              <ThemedText style={styles.inputLabel}>Event Description *</ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="Describe the filing, grievance submission, or acknowledgment received..."
                value={formDescription}
                onChangeText={setFormDescription}
                multiline
              />

              {/* Event Time */}
              <ThemedText style={styles.inputLabel}>User-Recorded Event Time (YYYY-MM-DD HH:MM) *</ThemedText>
              <TextInput
                style={styles.singleInput}
                placeholder="2026-10-24 14:00"
                value={formEventTime}
                onChangeText={setFormEventTime}
              />

              {/* Status Transition Selection */}
              <ThemedText style={styles.inputLabel}>Case Status Resulting From This Action</ThemedText>
              <View style={styles.typeSelectorRow}>
                {(['NOT_REPORTED', 'SUBMITTED', 'ACKNOWLEDGED', 'UNDER_REVIEW', 'RESOLVED'] as CaseProgressStatus[]).map(
                  (st) => (
                    <Pressable
                      key={st}
                      onPress={() => setFormStatus(st)}
                      style={[
                        styles.typeSelectorChip,
                        formStatus === st && styles.typeSelectorChipActive,
                      ]}>
                      <ThemedText
                        style={[
                          styles.typeChipText,
                          formStatus === st && styles.typeChipTextActive,
                        ]}>
                        {st}
                      </ThemedText>
                    </Pressable>
                  )
                )}
              </View>

              {/* Organization */}
              <ThemedText style={styles.inputLabel}>Organization / Recipient (Optional)</ThemedText>
              <TextInput
                style={styles.singleInput}
                placeholder="e.g. Internal Committee (IC), Cyber Cell, Police Station"
                value={formOrg}
                onChangeText={setFormOrg}
              />

              {/* Reference / Docket Number */}
              <ThemedText style={styles.inputLabel}>Reference / Docket Number (Optional)</ThemedText>
              <TextInput
                style={styles.singleInput}
                placeholder="e.g. CR-2026-90214, HR-ACK-102"
                value={formRefNum}
                onChangeText={setFormRefNum}
              />

              {/* Link Evidence Artifact */}
              <ThemedText style={styles.inputLabel}>Link Case Evidence Document (Optional)</ThemedText>
              <View style={styles.artifactPickerRow}>
                <Pressable
                  onPress={() => setFormArtifactId('')}
                  style={[
                    styles.artifactChip,
                    formArtifactId === '' && styles.artifactChipActive,
                  ]}>
                  <ThemedText style={styles.artifactChipText}>None (USER_REPORTED)</ThemedText>
                </Pressable>
                {evidence.map((art) => (
                  <Pressable
                    key={art.id}
                    onPress={() => setFormArtifactId(art.id)}
                    style={[
                      styles.artifactChip,
                      formArtifactId === art.id && styles.artifactChipActive,
                    ]}>
                    <ThemedText style={styles.artifactChipText}>
                      📎 {art.name}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              {/* Target Follow-up Date */}
              <ThemedText style={styles.inputLabel}>Next Target Follow-Up Date (Optional, YYYY-MM-DD)</ThemedText>
              <TextInput
                style={styles.singleInput}
                placeholder="2026-11-01"
                value={formFollowUpDate}
                onChangeText={setFormFollowUpDate}
              />

              {/* Submit Buttons */}
              <View style={styles.formActionsRow}>
                <Pressable
                  onPress={() => setShowAddForm(false)}
                  style={styles.cancelBtn}>
                  <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
                </Pressable>
                <Pressable
                  disabled={submitting}
                  onPress={handleCreateEntry}
                  style={styles.submitBtn}>
                  <ThemedText style={styles.submitBtnText}>
                    {submitting ? 'Saving...' : 'Save Append-Only Entry'}
                  </ThemedText>
                </Pressable>
              </View>
            </ThemedView>
          )}

          {/* Loading State */}
          {loading && (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color={BrandColors.indigo} />
              <ThemedText style={styles.stateText}>Loading accountability timeline...</ThemedText>
            </View>
          )}

          {/* Error State */}
          {!loading && error && (
            <ThemedView type="backgroundElement" style={styles.errorBox}>
              <ThemedText style={styles.errorTitle}>Timeline Unavailable</ThemedText>
              <ThemedText style={styles.errorDesc}>{error}</ThemedText>
              <Pressable
                onPress={fetchTimeline}
                style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}>
                <ThemedText style={styles.retryBtnText}>Retry</ThemedText>
              </Pressable>
            </ThemedView>
          )}

          {/* Timeline List */}
          {!loading && !error && data && (
            <ThemedView type="backgroundElement" style={styles.timelineSectionCard}>
              <ThemedText type="smallBold" style={styles.sectionTitle}>
                CHRONOLOGICAL ACCOUNTABILITY HISTORY ({data.total_entries} ENTRIES)
              </ThemedText>

              {data.timeline.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>
                    No reporting actions or progress updates recorded yet. Click '+ Record New Action or Status' to log an event.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.timelineList}>
                  {data.timeline.map((entry: AccountabilityEntry, idx: number) => {
                    const statusConf = STATUS_CONFIG[entry.status] || STATUS_CONFIG.UNKNOWN;
                    const isDocSupported = entry.source_classification === 'DOCUMENT_SUPPORTED';

                    return (
                      <View key={entry.id} style={styles.timelineRow}>
                        {/* Timeline rail */}
                        <View style={styles.railColumn}>
                          <View
                            style={[
                              styles.railDot,
                              isDocSupported && styles.railDotDoc,
                            ]}
                          />
                          {idx < data.timeline.length - 1 && <View style={styles.railLine} />}
                        </View>

                        {/* Content Card */}
                        <View style={styles.entryCard}>
                          <View style={styles.entryHeader}>
                            <View style={{ flex: 1 }}>
                              <ThemedText style={styles.entryAction}>
                                {entry.action_type.replace(/_/g, ' ')}
                              </ThemedText>
                              <ThemedText style={styles.entryTime}>
                                Event: {entry.user_event_time}
                              </ThemedText>
                            </View>

                            <View
                              style={[
                                styles.entryStatusBadge,
                                { backgroundColor: statusConf.bg, borderColor: statusConf.border },
                              ]}>
                              <ThemedText
                                style={[styles.entryStatusText, { color: statusConf.text }]}>
                                {statusConf.label}
                              </ThemedText>
                            </View>
                          </View>

                          {/* Provenance Badge */}
                          <View style={styles.provenanceRow}>
                            <View
                              style={[
                                styles.provenanceBadge,
                                isDocSupported
                                  ? styles.provenanceBadgeDoc
                                  : styles.provenanceBadgeUser,
                              ]}>
                              <ThemedText
                                style={[
                                  styles.provenanceText,
                                  isDocSupported
                                    ? styles.provenanceTextDoc
                                    : styles.provenanceTextUser,
                                ]}>
                                {isDocSupported
                                  ? '📎 DOCUMENT SUPPORTED'
                                  : '👤 USER REPORTED'}
                              </ThemedText>
                            </View>

                            {entry.organization && (
                              <ThemedText style={styles.entryOrg}>
                                To: {entry.organization}
                              </ThemedText>
                            )}
                          </View>

                          <ThemedText style={styles.entryDescription}>
                            {entry.description}
                          </ThemedText>

                          {/* Reference Number */}
                          {entry.reference_number && (
                            <View style={styles.refBox}>
                              <ThemedText style={styles.refLabel}>Ref / Docket #:</ThemedText>
                              <ThemedText style={styles.refValue}>
                                {entry.reference_number}
                              </ThemedText>
                            </View>
                          )}

                          {/* Linked Evidence */}
                          {entry.linked_artifact && (
                            <View style={styles.linkedDocBox}>
                              <ThemedText style={styles.linkedDocLabel}>
                                Attached Evidence: <b>{entry.linked_artifact.filename}</b>
                              </ThemedText>
                              {entry.linked_artifact.sha256 && (
                                <ThemedText style={styles.shaText}>
                                  SHA-256: {entry.linked_artifact.sha256.slice(0, 16)}...
                                </ThemedText>
                              )}
                            </View>
                          )}

                          {/* Missing Evidence Indicator */}
                          {entry.artifact_support_unavailable && (
                            <View style={styles.missingDocBox}>
                              <ThemedText style={styles.missingDocText}>
                                ⚠️ Attached evidence artifact is unavailable in the vault. Historical entry preserved.
                              </ThemedText>
                            </View>
                          )}

                          {/* Follow-up Note */}
                          {entry.next_follow_up_date && (
                            <View style={styles.followUpFooter}>
                              <ThemedText style={styles.followUpFooterText}>
                                Next follow-up: {entry.next_follow_up_date} •{' '}
                                {entry.follow_up_completed ? (
                                  <Text style={{ color: '#166534', fontWeight: '700' }}>
                                    Completed ✓
                                  </Text>
                                ) : (
                                  <Text style={{ color: '#B45309', fontWeight: '700' }}>
                                    Pending
                                  </Text>
                                )}
                              </ThemedText>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ThemedView>
          )}

          {/* Quick Navigation Footer */}
          <ThemedView type="backgroundElement" style={styles.nextActionCard}>
            <ThemedText type="smallBold" style={styles.nextActionTag}>
              INTEGRATED ACTIONS
            </ThemedText>
            <ThemedText type="subtitle" style={styles.nextActionTitle}>
              Navigate incident workflows
            </ThemedText>
            <View style={styles.actionButtonsRow}>
              <Pressable
                style={styles.actionBtnSecondary}
                onPress={() => router.push('/support')}>
                <ThemedText style={styles.actionBtnSecondaryText}>🧭 Next Steps</ThemedText>
              </Pressable>
              <Pressable
                style={styles.actionBtnSecondary}
                onPress={() => router.push('/stress-test' as Href)}>
                <ThemedText style={styles.actionBtnSecondaryText}>⚡ Stress Test</ThemedText>
              </Pressable>
              <Pressable
                style={styles.actionBtnPrimary}
                onPress={() => router.push('/privacy')}>
                <ThemedText style={styles.actionBtnPrimaryText}>Compile Pack →</ThemedText>
              </Pressable>
            </View>
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
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: 40,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  header: {
    gap: 6,
    marginBottom: 4,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  backButtonText: {
    color: BrandColors.indigo,
  },
  subtitle: {
    color: '#64748B',
    lineHeight: 20,
  },
  statusCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BrandColors.border,
    gap: 10,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: BrandColors.indigo,
    letterSpacing: 0.8,
  },
  statusCardSub: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  provenanceNoticeBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  provenanceNoticeText: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
  },
  pendingCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FCD34D',
    backgroundColor: '#FEFDF8',
    gap: 10,
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.8,
  },
  followUpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  followUpOverdue: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  followUpAction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  overdueBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  overdueText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  followUpDesc: {
    fontSize: 12,
    color: '#475569',
  },
  followUpDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  completeBtn: {
    backgroundColor: BrandColors.indigoLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  completeBtnText: {
    color: BrandColors.indigo,
    fontSize: 11,
    fontWeight: '700',
  },
  completeModalCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BrandColors.indigo,
    gap: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addEventBtn: {
    backgroundColor: BrandColors.indigo,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  addEventBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  formCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BrandColors.border,
    gap: 10,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginTop: 4,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeSelectorChip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeSelectorChipActive: {
    backgroundColor: BrandColors.indigoLight,
    borderColor: BrandColors.indigo,
  },
  typeChipText: {
    fontSize: 11,
    color: '#475569',
  },
  typeChipTextActive: {
    color: BrandColors.indigo,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#1E293B',
    minHeight: 60,
  },
  singleInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1E293B',
  },
  artifactPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  artifactChip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  artifactChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  artifactChipText: {
    fontSize: 11,
    color: '#334155',
  },
  formActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: BrandColors.indigo,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  timelineSectionCard: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BrandColors.border,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 0.8,
    color: BrandColors.indigo,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  timelineList: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  railColumn: {
    width: 20,
    alignItems: 'center',
  },
  railDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#94A3B8',
    marginTop: 6,
  },
  railDotDoc: {
    backgroundColor: BrandColors.indigo,
  },
  railLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  entryCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 6,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  entryAction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  entryTime: {
    fontSize: 11,
    color: '#64748B',
  },
  entryStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  entryStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  provenanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  provenanceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  provenanceBadgeUser: {
    backgroundColor: '#F1F5F9',
  },
  provenanceBadgeDoc: {
    backgroundColor: '#DCFCE7',
  },
  provenanceText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  provenanceTextUser: {
    color: '#475569',
  },
  provenanceTextDoc: {
    color: '#166534',
  },
  entryOrg: {
    fontSize: 11,
    color: '#64748B',
  },
  entryDescription: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 17,
  },
  refBox: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#F1F5F9',
    padding: 6,
    borderRadius: 6,
  },
  refLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  refValue: {
    fontSize: 11,
    color: '#1E293B',
    fontWeight: '700',
  },
  linkedDocBox: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
    borderRadius: 6,
    padding: 6,
    gap: 2,
  },
  linkedDocLabel: {
    fontSize: 11,
    color: BrandColors.indigo,
  },
  shaText: {
    fontSize: 9.5,
    color: '#6366F1',
    fontFamily: 'monospace',
  },
  missingDocBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 6,
    padding: 6,
  },
  missingDocText: {
    fontSize: 11,
    color: '#991B1B',
  },
  followUpFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    marginTop: 2,
  },
  followUpFooterText: {
    fontSize: 11,
    color: '#64748B',
  },
  nextActionCard: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BrandColors.border,
    gap: 8,
  },
  nextActionTag: {
    color: BrandColors.indigo,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  nextActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  actionBtnSecondary: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BrandColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  actionBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  actionBtnPrimary: {
    flex: 1.2,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: BrandColors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stateContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  stateText: {
    color: '#64748B',
    fontSize: 13,
  },
  errorBox: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    gap: 8,
  },
  errorTitle: {
    color: '#991B1B',
    fontWeight: '700',
    fontSize: 14,
  },
  errorDesc: {
    color: '#7F1D1D',
    fontSize: 12,
    lineHeight: 16,
  },
  retryBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
