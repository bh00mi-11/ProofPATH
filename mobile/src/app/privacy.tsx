import React from 'react';
import { StyleSheet, ScrollView, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, BrandColors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCaseState } from '@/context/CaseContext';
import { RecipientType } from '@/types/proofpath.types';
import { ALL_DISCLOSURE_FIELDS } from '@/services/case-service';
import { FieldCheckboxList } from '@/components/proofpath';

const RECIPIENTS: { type: RecipientType; label: string; description: string }[] = [
  {
    type: 'TRUSTED_CONTACT',
    label: 'Trusted Contact',
    description: 'Personal advocate, close friend, or family member.',
  },
  {
    type: 'SUPPORT_ORGANIZATION',
    label: 'Support Organization',
    description: 'Crisis counselor, advisor, or social support team.',
  },
  {
    type: 'LEGAL_PROFESSIONAL',
    label: 'Legal Professional',
    description: 'Attorney or legal advisor requiring full case facts.',
  },
];

export default function PrivacyScreen() {
  const {
    selectedRecipient,
    includedDisclosureFields,
    disclosurePreview,
    setSelectedRecipient,
    toggleDisclosureField,
  } = useCaseState();

  const totalFields = ALL_DISCLOSURE_FIELDS.length;
  const includedCount = includedDisclosureFields.length;
  const redactedCount = totalFields - includedCount;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="title">Choose what to share</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              Pick who receives the report and decide which details to include or hide.
            </ThemedText>
          </View>

          {/* 1-Sentence Demo Notice */}
          <ThemedView type="backgroundElement" style={styles.demoBanner}>
            <ThemedText type="smallBold" style={styles.demoBannerText}>
              Sample demo: This preview does not perform legal redaction or send real documents.
            </ThemedText>
          </ThemedView>

          {/* Recipient Audience Selector */}
          <ThemedText type="smallBold" style={styles.sectionHeader}>
            1. WHO WILL RECEIVE THIS REPORT?
          </ThemedText>
          <ThemedText type="small" style={styles.sectionHint}>
            Select the recipient to automatically apply recommended defaults:
          </ThemedText>

          <View style={styles.recipientGroup}>
            {RECIPIENTS.map((rec) => {
              const isSelected = selectedRecipient === rec.type;
              return (
                <Pressable
                  key={rec.type}
                  style={[
                    styles.recipientCard,
                    isSelected && styles.recipientCardActive,
                  ]}
                  onPress={() => setSelectedRecipient(rec.type)}>
                  <View style={styles.recipientHeader}>
                    <ThemedText
                      type="smallBold"
                      style={isSelected ? styles.textActive : undefined}>
                      {rec.label}
                    </ThemedText>
                    <View
                      style={[
                        styles.recipientPill,
                        isSelected ? styles.recipientPillActive : styles.recipientPillInactive,
                      ]}>
                      <ThemedText
                        type="smallBold"
                        style={isSelected ? styles.badgeActive : styles.badgeInactive}>
                        {isSelected ? '✓ Selected' : 'Select'}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText
                    type="small"
                    style={[styles.dimText, isSelected && styles.dimTextActive]}>
                    {rec.description}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Included / Excluded Fields via FieldCheckboxList */}
          <View style={styles.fieldSectionHeader}>
            <ThemedText type="smallBold" style={styles.sectionHeader}>
              2. CHOOSE WHICH FIELDS TO SHOW
            </ThemedText>
            <ThemedText type="small" style={styles.tallyText}>
              {includedCount} shown · {redactedCount} hidden
            </ThemedText>
          </View>
          <ThemedText type="small" style={styles.sectionHint}>
            Tap any field to include or hide it in the sample report:
          </ThemedText>

          <FieldCheckboxList
            fields={ALL_DISCLOSURE_FIELDS}
            includedFields={includedDisclosureFields}
            onToggleField={toggleDisclosureField}
          />

          {/* Illustrative Mock Policy Warnings Box */}
          <ThemedText type="smallBold" style={styles.sectionHeader}>
            3. SAMPLE POLICY CHECKS ({disclosurePreview?.warnings.length ?? 0})
          </ThemedText>
          <ThemedText type="small" style={styles.sectionHint}>
            Automated warnings based on your recipient and field choices:
          </ThemedText>

          {disclosurePreview?.warnings.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <ThemedText type="small" style={styles.emptyNoticeText}>
                ✓ All checks passed for this recipient and field selection.
              </ThemedText>
            </ThemedView>
          ) : (
            disclosurePreview?.warnings.map((warn, idx) => (
              <ThemedView key={idx} type="backgroundElement" style={styles.warningCard}>
                <ThemedText type="small" style={styles.warningLabel}>
                  ⚠ {warn}
                </ThemedText>
              </ThemedView>
            ))
          )}

          {/* Obvious Next Action: Action Link to Sample Report Preview */}
          <ThemedView type="backgroundElement" style={styles.nextActionCard}>
            <ThemedText type="smallBold" style={styles.nextActionTag}>
              NEXT ACTION
            </ThemedText>
            <ThemedText type="subtitle" style={styles.nextActionTitle}>
              Preview your sample report
            </ThemedText>
            <ThemedText type="small" style={styles.nextActionDesc}>
              See how the document looks for a {selectedRecipient.toLowerCase().replace('_', ' ')}.
            </ThemedText>
            <Pressable
              style={styles.previewReportButton}
              onPress={() => router.push('/report/preview')}>
              <ThemedText type="smallBold" style={styles.previewButtonText}>
                Preview sample report →
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
  sectionHeader: {
    opacity: 0.7,
    marginTop: Spacing.two,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  sectionHint: {
    opacity: 0.65,
    fontSize: 12,
    marginTop: -Spacing.one,
    lineHeight: 16,
  },
  recipientGroup: {
    gap: Spacing.two,
  },
  recipientCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.border,
    gap: 4,
    backgroundColor: '#FFFFFF',
  },
  recipientCardActive: {
    backgroundColor: BrandColors.indigoLight,
    borderColor: BrandColors.indigo,
  },
  recipientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recipientPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.one,
    borderWidth: 1,
  },
  recipientPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: BrandColors.indigo,
  },
  recipientPillInactive: {
    backgroundColor: 'transparent',
    borderColor: BrandColors.border,
  },
  textActive: {
    color: BrandColors.indigo,
    fontWeight: '700',
  },
  badgeActive: {
    color: BrandColors.indigo,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeInactive: {
    color: BrandColors.muted,
    fontSize: 11,
  },
  dimText: {
    opacity: 0.65,
    fontSize: 12,
    lineHeight: 16,
  },
  dimTextActive: {
    opacity: 0.9,
    color: BrandColors.indigo,
    fontSize: 12,
    lineHeight: 16,
  },
  fieldSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  tallyText: {
    fontSize: 12,
    color: BrandColors.indigo,
    fontWeight: '600',
  },
  emptyCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  emptyNoticeText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '500',
  },
  warningCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: '#FFFBEB',
  },
  warningLabel: {
    color: '#D97706',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
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
  previewReportButton: {
    backgroundColor: BrandColors.indigo,
    paddingVertical: 12,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  previewButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
