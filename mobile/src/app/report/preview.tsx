import React from 'react';
import { StyleSheet, ScrollView, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, BrandColors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCaseState } from '@/context/CaseContext';
import { ClaimStatusBadge, IntegrityBadge } from '@/components/proofpath';
import { ALL_DISCLOSURE_FIELDS } from '@/services/case-service';

export default function ReportPreviewScreen() {
  const {
    currentCase,
    evidence,
    observations,
    claims,
    selectedRecipient,
    includedDisclosureFields,
    disclosurePreview,
  } = useCaseState();

  const isIncluded = (field: string) => includedDisclosureFields.includes(field);
  const excludedFields = ALL_DISCLOSURE_FIELDS.filter((f) => !includedDisclosureFields.includes(f));

  const recipientLabels: Record<string, string> = {
    TRUSTED_CONTACT: 'Trusted Contact',
    SUPPORT_ORGANIZATION: 'Support Organization',
    LEGAL_PROFESSIONAL: 'Legal Professional',
  };

  const recipientLabel = recipientLabels[selectedRecipient] ?? selectedRecipient;

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
                ← Back to privacy choices
              </ThemedText>
            </Pressable>
            <ThemedText type="title">Sample report</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              A preview of the summary document prepared for a {recipientLabel.toLowerCase()}.
            </ThemedText>
          </View>

          {/* 1-Sentence Demo Notice */}
          <ThemedView type="backgroundElement" style={styles.demoBanner}>
            <ThemedText type="smallBold" style={styles.demoBannerText}>
              Sample demo: This report is an example and cannot be exported or sent.
            </ThemedText>
          </ThemedView>

          {/* Disclosure Configuration Summary (Included & Excluded Fields) */}
          <ThemedView type="backgroundElement" style={styles.configCard}>
            <ThemedText type="smallBold" style={styles.configTitle}>
              WHAT IS INCLUDED IN THIS REPORT
            </ThemedText>
            <ThemedText type="small" style={styles.dimText}>
              Prepared for: <ThemedText type="smallBold">{recipientLabel}</ThemedText>
            </ThemedText>

            {/* Included Fields Chips */}
            <View style={styles.fieldSummaryBlock}>
              <ThemedText type="smallBold" style={styles.includedLabel}>
                ✓ Visible fields ({includedDisclosureFields.length}):
              </ThemedText>
              <View style={styles.chipRow}>
                {includedDisclosureFields.length === 0 ? (
                  <ThemedText type="small" style={styles.dimText}>
                    None selected
                  </ThemedText>
                ) : (
                  includedDisclosureFields.map((f) => (
                    <View key={f} style={styles.chipIncluded}>
                      <ThemedText type="smallBold" style={styles.chipTextIncluded}>
                        {f}
                      </ThemedText>
                    </View>
                  ))
                )}
              </View>
            </View>

            {/* Excluded Fields Chips */}
            <View style={styles.fieldSummaryBlock}>
              <ThemedText type="smallBold" style={styles.redactedLabel}>
                ✕ Hidden fields ({excludedFields.length}):
              </ThemedText>
              <View style={styles.chipRow}>
                {excludedFields.length === 0 ? (
                  <ThemedText type="small" style={styles.dimText}>
                    None (Full report)
                  </ThemedText>
                ) : (
                  excludedFields.map((f) => (
                    <View key={f} style={styles.chipRedacted}>
                      <ThemedText type="smallBold" style={styles.chipTextRedacted}>
                        {f}
                      </ThemedText>
                    </View>
                  ))
                )}
              </View>
            </View>
          </ThemedView>

          {/* Document Body */}
          <ThemedView type="backgroundElement" style={styles.documentCard}>
            <View style={styles.docWatermarkHeader}>
              <ThemedText type="smallBold" style={styles.docWatermark}>
                INCIDENT SUMMARY DOSSIER
              </ThemedText>
              <View style={styles.recipientTagPill}>
                <ThemedText type="smallBold" style={styles.docRecipientBadge}>
                  {recipientLabel}
                </ThemedText>
              </View>
            </View>

            <ThemedText type="subtitle" style={styles.docTitle}>
              {currentCase?.title}
            </ThemedText>
            <ThemedText type="small" style={styles.dimText}>
              Case #{currentCase?.id} · Recorded {currentCase?.createdAt ? new Date(currentCase.createdAt).toLocaleDateString() : 'N/A'}
            </ThemedText>

            {/* 1. Evidence Section */}
            <ThemedText type="smallBold" style={styles.sectionDivider}>
              1. EVIDENCE ITEMS ({evidence.length})
            </ThemedText>

            {evidence.map((ev, i) => {
              const linkedObs = observations.filter((o) => o.evidenceId === ev.id);
              return (
                <View key={ev.id} style={styles.docItem}>
                  <ThemedText type="smallBold" style={styles.docItemTitle}>
                    {i + 1}. {isIncluded('name') ? ev.name : '[Hidden file name]'}
                  </ThemedText>

                  <ThemedText type="small" style={styles.dimText}>
                    Type: {isIncluded('type') ? ev.type : '[Hidden]'} · Added:{' '}
                    {isIncluded('ingestedAt')
                      ? new Date(ev.ingestedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                      : '[Hidden timestamp]'}
                  </ThemedText>

                  {/* Integrity */}
                  <View style={styles.integrityLine}>
                    {isIncluded('integrity') ? (
                      <IntegrityBadge integrity={ev.integrity} />
                    ) : (
                      <ThemedText type="small" style={styles.dimText}>
                        Check status: <ThemedText type="smallBold" style={styles.redactedInline}>[Hidden]</ThemedText>
                      </ThemedText>
                    )}
                  </View>

                  {/* Observations */}
                  <View style={styles.obsBlock}>
                    {isIncluded('observations') ? (
                      linkedObs.length === 0 ? (
                        <ThemedText type="small" style={styles.dimText}>
                          No facts recorded for this item.
                        </ThemedText>
                      ) : (
                        linkedObs.map((obs) => (
                          <ThemedText key={obs.id} type="small" style={styles.obsItem}>
                            • {obs.text}
                          </ThemedText>
                        ))
                      )
                    ) : (
                      <ThemedText type="small" style={styles.redactedInline}>
                        [Key facts hidden for this audience]
                      </ThemedText>
                    )}
                  </View>
                </View>
              );
            })}

            {/* 2. Claims Section */}
            <ThemedText type="smallBold" style={styles.sectionDivider}>
              2. CLAIMS AND STATUS ({claims.length})
            </ThemedText>

            {claims.map((clm, i) => (
              <View key={clm.id} style={styles.docItem}>
                <ThemedText type="smallBold" style={styles.docItemTitle}>
                  Claim {i + 1}: "{clm.text}"
                </ThemedText>
                <View style={styles.statusBadgeRow}>
                  <ClaimStatusBadge status={clm.status} />
                </View>
                <ThemedText type="small" style={styles.explanationText}>
                  Case note:{' '}
                  {isIncluded('explanation') ? (
                    clm.explanation
                  ) : (
                    <ThemedText type="smallBold" style={styles.redactedInline}>
                      [Case note hidden]
                    </ThemedText>
                  )}
                </ThemedText>
              </View>
            ))}
          </ThemedView>

          {/* Illustrative Warnings in Report */}
          {disclosurePreview?.warnings && disclosurePreview.warnings.length > 0 && (
            <ThemedView type="backgroundElement" style={styles.warningBox}>
              <ThemedText type="smallBold" style={styles.warningBoxHeader}>
                SAMPLE POLICY NOTICES
              </ThemedText>
              {disclosurePreview.warnings.map((warn, i) => (
                <ThemedText key={i} type="small" style={styles.warningItem}>
                  • {warn}
                </ThemedText>
              ))}
            </ThemedView>
          )}

          {/* Report Export & Sharing Controls: KEPT DISABLED */}
          <ThemedView type="backgroundElement" style={styles.disabledExportCard}>
            <View style={styles.disabledHeaderRow}>
              <ThemedText type="smallBold" style={styles.disabledActionTitle}>
                EXPORT AND SHARING (DISABLED)
              </ThemedText>
              <View style={styles.disabledBadgePill}>
                <ThemedText type="smallBold" style={styles.disabledBadge}>
                  Demo only
                </ThemedText>
              </View>
            </View>

            <ThemedText type="small" style={styles.dimText}>
              Exporting to PDF and sending reports are disabled in this demo. No files are saved or transmitted.
            </ThemedText>

            <View style={styles.buttonDisabledRow}>
              <Pressable style={styles.disabledButton} disabled={true}>
                <ThemedText type="smallBold" style={styles.disabledButtonText}>
                  Export PDF (Disabled)
                </ThemedText>
              </Pressable>

              <Pressable style={styles.disabledButton} disabled={true}>
                <ThemedText type="smallBold" style={styles.disabledButtonText}>
                  Send report (Disabled)
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>

          {/* Obvious Next Action Card */}
          <ThemedView type="backgroundElement" style={styles.nextActionCard}>
            <ThemedText type="smallBold" style={styles.nextActionTag}>
              FINISHED REVIEWING?
            </ThemedText>
            <ThemedText type="subtitle" style={styles.nextActionTitle}>
              Return to Privacy settings or Overview
            </ThemedText>
            <View style={styles.nextActionButtonsRow}>
              <Pressable
                style={styles.primaryActionButton}
                onPress={() => router.push('/privacy')}>
                <ThemedText type="smallBold" style={styles.primaryActionButtonText}>
                  ← Back to privacy choices
                </ThemedText>
              </Pressable>

              <Pressable
                style={styles.secondaryActionButton}
                onPress={() => router.push('/')}>
                <ThemedText type="smallBold" style={styles.secondaryActionButtonText}>
                  Go to Overview
                </ThemedText>
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
  configCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: '#FFFFFF',
  },
  configTitle: {
    fontSize: 12,
    color: BrandColors.muted,
    letterSpacing: 0.5,
  },
  fieldSummaryBlock: {
    gap: 4,
    marginTop: 2,
  },
  includedLabel: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  },
  redactedLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipIncluded: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Spacing.one,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  chipTextIncluded: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '600',
  },
  chipRedacted: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Spacing.one,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipTextRedacted: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },
  documentCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: '#FFFFFF',
  },
  docWatermarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderColor: BrandColors.border,
  },
  docWatermark: {
    fontSize: 12,
    color: BrandColors.muted,
    letterSpacing: 0.5,
  },
  recipientTagPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.one,
    backgroundColor: BrandColors.indigoLight,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  docRecipientBadge: {
    fontSize: 11,
    color: BrandColors.indigo,
    fontWeight: '600',
  },
  docTitle: {
    marginTop: Spacing.one,
    fontSize: 18,
    fontWeight: '600',
  },
  sectionDivider: {
    marginTop: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderColor: BrandColors.border,
    fontSize: 12,
    color: BrandColors.muted,
    letterSpacing: 0.5,
  },
  docItem: {
    paddingVertical: Spacing.two,
    gap: 4,
  },
  docItemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  integrityLine: {
    marginVertical: 2,
  },
  obsBlock: {
    paddingLeft: Spacing.two,
    borderLeftWidth: 2,
    borderLeftColor: BrandColors.indigo,
    marginVertical: 2,
    gap: 2,
  },
  obsItem: {
    fontSize: 12,
    opacity: 0.85,
    lineHeight: 16,
  },
  statusBadgeRow: {
    marginVertical: 3,
  },
  explanationText: {
    opacity: 0.8,
    fontSize: 13,
    lineHeight: 18,
  },
  redactedInline: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  warningBox: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: '#FFFBEB',
    gap: 4,
  },
  warningBoxHeader: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  warningItem: {
    color: '#D97706',
    fontSize: 12,
    lineHeight: 16,
  },
  disabledExportCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: BrandColors.border,
    gap: Spacing.two,
    backgroundColor: '#F8FAFC',
  },
  disabledHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disabledActionTitle: {
    fontSize: 12,
    color: BrandColors.muted,
    letterSpacing: 0.5,
  },
  disabledBadgePill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.one,
  },
  disabledBadge: {
    fontSize: 10,
    color: '#475569',
  },
  buttonDisabledRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
    flexWrap: 'wrap',
  },
  disabledButton: {
    flex: 1,
    minWidth: 140,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: BrandColors.border,
    alignItems: 'center',
  },
  disabledButtonText: {
    color: BrandColors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  nextActionCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.border,
    gap: Spacing.one,
    marginTop: Spacing.two,
    backgroundColor: '#FFFFFF',
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
  nextActionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
    flexWrap: 'wrap',
  },
  primaryActionButton: {
    backgroundColor: BrandColors.indigo,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  primaryActionButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryActionButton: {
    borderWidth: 1,
    borderColor: BrandColors.border,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryActionButtonText: {
    color: BrandColors.indigo,
    fontSize: 13,
    fontWeight: '600',
  },
  dimText: {
    opacity: 0.7,
    fontSize: 12,
  },
});
