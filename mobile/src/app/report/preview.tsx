import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCaseState } from '@/context/CaseContext';
import { ClaimStatusBadge, IntegrityBadge } from '@/components/proofpath';
import { ALL_DISCLOSURE_FIELDS } from '@/services/case-service';
import { apiCaseService } from '@/services/api-case-service';
import { useTranslation } from '@/context/LanguageContext';
import { safeBack } from '@/utils/navigation';

export default function ReportPreviewScreen() {
  const { t } = useTranslation();
  const {
    currentCase,
    evidence,
    observations,
    claims,
    selectedRecipient,
    includedDisclosureFields,
    disclosurePreview,
  } = useCaseState();

  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [confirmedExport, setConfirmedExport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  const activeBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      // Clean up object URL when component unmounts
      if (activeBlobUrlRef.current && typeof window !== 'undefined' && window.URL) {
        window.URL.revokeObjectURL(activeBlobUrlRef.current);
      }
    };
  }, []);

  const caseId = currentCase?.id || 'case_demo_01';
  const isIncluded = (field: string) => includedDisclosureFields.includes(field);
  const excludedFields = ALL_DISCLOSURE_FIELDS.filter((f) => !includedDisclosureFields.includes(f));

  const recipientLabels: Record<string, string> = {
    TRUSTED_CONTACT: 'Trusted Contact',
    SUPPORT_ORGANIZATION: 'Support Organization',
    LEGAL_PROFESSIONAL: 'Legal Professional',
  };

  const recipientLabel = recipientLabels[selectedRecipient] ?? selectedRecipient;

  const triggerDownload = (blob: Blob) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `ProofPath_Report_${caseId}_${selectedRecipient.toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Give browser time to start the download before revoking
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
      }, 1000);
    }
  };

  const triggerOpen = (blob: Blob) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const openUrl = window.URL.createObjectURL(blob);
      window.open(openUrl, '_blank');
      // Give browser tab time to load the PDF before revoking
      setTimeout(() => {
        window.URL.revokeObjectURL(openUrl);
      }, 5000);
    }
  };

  const handleExportPdf = async () => {
    if (!confirmedExport) {
      setExportError('Please confirm the privacy disclosure checklist before exporting.');
      return;
    }

    setExporting(true);
    setExportError(null);
    setExportSuccess(null);

    try {
      const blob = await apiCaseService.exportPdf(caseId, selectedRecipient, true);

      // Verify blob is valid
      if (!blob || blob.size === 0) {
        throw new Error('Received empty PDF document from the server.');
      }

      setPdfBlob(blob);

      // Revoke previous persistent preview URL if exists
      if (activeBlobUrlRef.current && typeof window !== 'undefined' && window.URL) {
        window.URL.revokeObjectURL(activeBlobUrlRef.current);
      }

      if (typeof window !== 'undefined' && window.URL) {
        const previewUrl = window.URL.createObjectURL(blob);
        activeBlobUrlRef.current = previewUrl;
        setPdfBlobUrl(previewUrl);
      }

      setExportSuccess(`Privacy-reviewed Incident Report generated (${(blob.size / 1024).toFixed(1)} KB).`);

      // Trigger instant web download
      triggerDownload(blob);
    } catch (err: any) {
      setExportError(err?.message || 'Failed to compile PDF on FastAPI backend.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.desktopScrollContent,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => safeBack('/privacy')} style={styles.backButton}>
              <ThemedText type="smallBold" style={styles.backButtonText}>
                ← {t.common.back}
              </ThemedText>
            </Pressable>
            <View style={styles.badgeRow}>
              <View style={styles.workspacePill}>
                <ThemedText style={styles.workspacePillText}>REPORT PREVIEW</ThemedText>
              </View>
              <ThemedText type="small" style={styles.caseBadge}>
                Target: {recipientLabel}
              </ThemedText>
            </View>
            <ThemedText type="title">Privacy-Reviewed Incident Report</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              Pre-export verification showing active redactions, allowed disclosures, and cryptographic audit hashes.
            </ThemedText>
          </View>

          {/* Stepper Bar */}
          <View style={styles.stepperBar}>
            <Pressable style={styles.stepItem} onPress={() => router.push('/privacy')}>
              <ThemedText style={styles.stepNumDone}>✓</ThemedText>
              <ThemedText style={styles.stepLabelDone}>Recipient: {recipientLabel}</ThemedText>
            </Pressable>
            <ThemedText style={styles.stepDivider}>→</ThemedText>
            <Pressable style={styles.stepItem} onPress={() => router.push('/privacy')}>
              <ThemedText style={styles.stepNumDone}>✓</ThemedText>
              <ThemedText style={styles.stepLabelDone}>
                Fields: {includedDisclosureFields.length} allowed
              </ThemedText>
            </Pressable>
            <ThemedText style={styles.stepDivider}>→</ThemedText>
            <View style={[styles.stepItem, styles.stepItemActive]}>
              <ThemedText style={styles.stepNumActive}>3</ThemedText>
              <ThemedText style={styles.stepLabelActive}>Preview & Export</ThemedText>
            </View>
          </View>

          {/* Privacy Integrity Notice */}
          <ThemedView type="backgroundElement" style={styles.noticeBanner}>
            <ThemedText type="smallBold" style={styles.noticeBannerTitle}>
              🔒 CONFIDENTIAL REPORT DISCLOSURE BOUNDARY
            </ThemedText>
            <ThemedText type="small" style={styles.noticeBannerText}>
              This report represents client-side and server-verified privacy redaction. It does not replace formal evidentiary discovery, and ProofPath does not claim judicial admissibility or governmental affiliation.
            </ThemedText>
          </ThemedView>

          {/* Redaction Matrix Summary */}
          <ThemedView type="backgroundElement" style={styles.matrixCard}>
            <ThemedText type="subtitle" style={styles.matrixTitle}>
              Disclosure & Redaction Matrix
            </ThemedText>
            <ThemedText type="small" style={styles.matrixSub}>
              Fields verified against the server-side {recipientLabel} allowlist:
            </ThemedText>

            <View style={styles.fieldSection}>
              <ThemedText type="smallBold" style={styles.visibleLabel}>
                ✓ VISIBLE FIELDS ({includedDisclosureFields.length}):
              </ThemedText>
              <View style={styles.chipsRow}>
                {includedDisclosureFields.length === 0 ? (
                  <ThemedText type="small" style={styles.dimText}>
                    No fields selected.
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

            <View style={styles.fieldSection}>
              <ThemedText type="smallBold" style={styles.redactedLabel}>
                ✕ REDACTED / HIDDEN FIELDS ({excludedFields.length}):
              </ThemedText>
              <View style={styles.chipsRow}>
                {excludedFields.length === 0 ? (
                  <ThemedText type="small" style={styles.dimText}>
                    Zero redactions applied.
                  </ThemedText>
                ) : (
                  excludedFields.map((f) => (
                    <View key={f} style={styles.chipExcluded}>
                      <ThemedText type="smallBold" style={styles.chipTextExcluded}>
                        {f}
                      </ThemedText>
                    </View>
                  ))
                )}
              </View>
            </View>
          </ThemedView>

          {/* Live Document Preview Rail */}
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="smallBold" style={styles.sectionHeader}>
              SIMULATED REPORT PREVIEW (DOCUMENT DRAFT)
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.docDraft}>
            <View style={styles.docHeader}>
              <ThemedText type="subtitle" style={styles.docTitle}>
                {currentCase?.title || 'Incident Case Documentation'}
              </ThemedText>
              <ThemedText type="small" style={styles.docCaseId}>
                Case Reference: {caseId} • Prepared for {recipientLabel}
              </ThemedText>
            </View>

            {/* Description Block */}
            <View style={styles.docSection}>
              <ThemedText type="smallBold" style={styles.docSecTitle}>
                Case Summary
              </ThemedText>
              {isIncluded('description') ? (
                <ThemedText type="default" style={styles.docSecBody}>
                  {currentCase?.description || 'No summary text provided.'}
                </ThemedText>
              ) : (
                <View style={styles.redactedBar}>
                  <ThemedText type="smallBold" style={styles.redactedBarText}>
                    [REDACTED: Case summary hidden by recipient profile]
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Evidence Items Block */}
            <View style={styles.docSection}>
              <ThemedText type="smallBold" style={styles.docSecTitle}>
                Evidence Artifacts ({evidence.length})
              </ThemedText>
              {evidence.map((item, i) => (
                <View key={item.id} style={styles.docItem}>
                  <View style={styles.docItemHeader}>
                    <ThemedText type="smallBold">
                      {i + 1}. {item.name}
                    </ThemedText>
                    <IntegrityBadge integrity={item.integrity} />
                  </View>
                  <ThemedText type="small" style={styles.docItemMeta}>
                    Logged: {new Date(item.ingestedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </ThemedText>
                  {isIncluded('sha256') ? (
                    <ThemedText type="code" style={styles.docHash}>
                      SHA-256: {item.sha256 || 'e3b0c442...'}
                    </ThemedText>
                  ) : (
                    <ThemedText type="small" style={styles.redactedInline}>
                      [SHA-256 hash redacted]
                    </ThemedText>
                  )}
                </View>
              ))}
            </View>

            {/* Claims Block */}
            <View style={styles.docSection}>
              <ThemedText type="smallBold" style={styles.docSecTitle}>
                Claims Tracked ({claims.length})
              </ThemedText>
              {claims.map((clm, i) => (
                <View key={clm.id} style={styles.docItem}>
                  <View style={styles.docItemHeader}>
                    <ThemedText type="smallBold">
                      Claim #{clm.id}: "{clm.text}"
                    </ThemedText>
                    <ClaimStatusBadge status={clm.status} />
                  </View>
                  <ThemedText type="small" style={styles.docItemMeta}>
                    Rationale:{' '}
                    {isIncluded('explanation') ? (
                      clm.explanation
                    ) : (
                      <ThemedText style={styles.redactedInline}>[Explanation redacted]</ThemedText>
                    )}
                  </ThemedText>
                </View>
              ))}
            </View>
          </ThemedView>

          {/* Export Confirmation & Download Rail */}
          <ThemedView type="backgroundElement" style={styles.exportCard}>
            <ThemedText type="subtitle" style={styles.exportTitle}>
              Confirm and Generate PDF
            </ThemedText>

            {exportError ? (
              <View style={styles.exportErrorBox}>
                <ThemedText style={styles.exportErrorText}>⚠ {exportError}</ThemedText>
              </View>
            ) : null}

            {exportSuccess ? (
              <View style={styles.exportSuccessBox}>
                <ThemedText style={styles.exportSuccessText}>✓ {exportSuccess}</ThemedText>
              </View>
            ) : null}

            <Pressable
              style={styles.checkboxRow}
              onPress={() => setConfirmedExport(!confirmedExport)}
            >
              <View style={[styles.checkbox, confirmedExport && styles.checkboxChecked]}>
                {confirmedExport ? <ThemedText style={styles.checkMark}>✓</ThemedText> : null}
              </View>
              <ThemedText style={styles.checkboxLabel}>
                I confirm that I have reviewed the recipient and redaction settings above, and understand that exported records cannot be revoked once shared.
              </ThemedText>
            </Pressable>

            {exportError ? (
              <View style={styles.errorRetryContainer}>
                <Pressable
                  style={styles.retryBtn}
                  onPress={handleExportPdf}
                  disabled={exporting}
                >
                  <ThemedText style={styles.retryBtnText}>↻ Retry PDF Export</ThemedText>
                </Pressable>
              </View>
            ) : null}

            {pdfBlob ? (
              <View style={styles.downloadOptionsBox}>
                <ThemedText type="smallBold" style={styles.downloadOptionsTitle}>
                  DOCUMENT READY FOR SHARING:
                </ThemedText>
                <View style={styles.downloadBtnGroup}>
                  <Pressable
                    style={styles.downloadActionBtn}
                    onPress={() => triggerDownload(pdfBlob)}
                  >
                    <ThemedText style={styles.downloadActionBtnText}>📥 Download PDF</ThemedText>
                  </Pressable>
                  <Pressable
                    style={styles.openActionBtn}
                    onPress={() => triggerOpen(pdfBlob)}
                  >
                    <ThemedText style={styles.openActionBtnText}>↗ Open PDF in Tab</ThemedText>
                  </Pressable>
                </View>
              </View>
            ) : null}

            <View style={styles.exportActionRow}>
              <Pressable
                style={[
                  styles.exportBtn,
                  (!confirmedExport || exporting) && styles.exportBtnDisabled,
                ]}
                disabled={!confirmedExport || exporting}
                onPress={handleExportPdf}
              >
                {exporting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.exportBtnText}>
                    {pdfBlob ? 'Regenerate Privacy-Reviewed Report (PDF)' : 'Generate Privacy-Reviewed Incident Report (PDF)'}
                  </ThemedText>
                )}
              </Pressable>

              <Pressable
                style={styles.adjustPrivacyBtn}
                onPress={() => router.push('/privacy')}
              >
                <ThemedText style={styles.adjustPrivacyBtnText}>← Adjust Privacy Choices</ThemedText>
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
    backgroundColor: Colors.light.background,
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    width: '100%',
  },
  scrollContent: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
    gap: 16,
  },
  desktopScrollContent: {
    paddingHorizontal: 32,
    paddingTop: 24,
    maxWidth: 1080,
  },
  header: {
    gap: 6,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginBottom: 4,
  },
  backButtonText: {
    color: BrandColors.indigo,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  workspacePill: {
    backgroundColor: BrandColors.roseLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
  },
  workspacePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: BrandColors.rose,
    letterSpacing: 0.5,
  },
  caseBadge: {
    color: Colors.light.textSecondary,
  },
  subtitle: {
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  stepperBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 8,
    flexWrap: 'wrap',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepItemActive: {
    opacity: 1,
  },
  stepNumDone: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BrandColors.success,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  stepLabelDone: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.success,
  },
  stepDivider: {
    color: Colors.light.textMuted,
    fontSize: 12,
  },
  stepNumActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BrandColors.indigo,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  stepLabelActive: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.indigo,
  },
  noticeBanner: {
    backgroundColor: BrandColors.roseLight,
    borderWidth: 1,
    borderColor: BrandColors.roseBorder,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  noticeBannerTitle: {
    color: BrandColors.rose,
    letterSpacing: 0.5,
  },
  noticeBannerText: {
    color: '#881337',
    lineHeight: 18,
  },
  matrixCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 18,
    gap: 12,
  },
  matrixTitle: {
    fontSize: 16,
    color: Colors.light.text,
  },
  matrixSub: {
    color: Colors.light.textSecondary,
  },
  fieldSection: {
    gap: 6,
  },
  visibleLabel: {
    fontSize: 11,
    color: BrandColors.success,
  },
  redactedLabel: {
    fontSize: 11,
    color: BrandColors.danger,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipIncluded: {
    backgroundColor: BrandColors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BrandColors.successBorder,
  },
  chipTextIncluded: {
    color: BrandColors.success,
    fontSize: 11,
  },
  chipExcluded: {
    backgroundColor: BrandColors.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BrandColors.dangerBorder,
  },
  chipTextExcluded: {
    color: BrandColors.danger,
    fontSize: 11,
  },
  dimText: {
    color: Colors.light.textMuted,
    fontSize: 12,
  },
  sectionHeaderRow: {
    marginTop: 6,
  },
  sectionHeader: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  docDraft: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 20,
    gap: 16,
  },
  docHeader: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingBottom: 12,
    gap: 4,
  },
  docTitle: {
    fontSize: 18,
    color: Colors.light.text,
  },
  docCaseId: {
    color: Colors.light.textSecondary,
  },
  docSection: {
    gap: 8,
  },
  docSecTitle: {
    fontSize: 13,
    color: BrandColors.indigo,
    letterSpacing: 0.3,
  },
  docSecBody: {
    color: Colors.light.text,
    lineHeight: 20,
  },
  redactedBar: {
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  redactedBarText: {
    color: Colors.light.textMuted,
    fontSize: 11,
  },
  docItem: {
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: 8,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  docItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  docItemMeta: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  docHash: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  redactedInline: {
    color: BrandColors.danger,
    fontSize: 11,
  },
  exportCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 20,
    gap: 14,
  },
  exportTitle: {
    fontSize: 17,
    color: Colors.light.text,
  },
  exportErrorBox: {
    backgroundColor: BrandColors.dangerLight,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BrandColors.dangerBorder,
  },
  exportErrorText: {
    color: BrandColors.danger,
    fontSize: 12,
  },
  exportSuccessBox: {
    backgroundColor: BrandColors.successLight,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BrandColors.successBorder,
  },
  exportSuccessText: {
    color: BrandColors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: BrandColors.indigo,
    borderColor: BrandColors.indigo,
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.text,
  },
  exportActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  exportBtn: {
    backgroundColor: BrandColors.indigo,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exportBtnDisabled: {
    backgroundColor: Colors.light.textMuted,
    opacity: 0.6,
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  adjustPrivacyBtn: {
    backgroundColor: Colors.light.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  adjustPrivacyBtnText: {
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: '600',
  },
  errorRetryContainer: {
    marginTop: 4,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: BrandColors.dangerLight,
    borderWidth: 1,
    borderColor: BrandColors.dangerBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryBtnText: {
    color: BrandColors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  downloadOptionsBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginTop: 6,
  },
  downloadOptionsTitle: {
    color: '#166534',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  downloadBtnGroup: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  downloadActionBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  downloadActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  openActionBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  openActionBtnText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '700',
  },
});
