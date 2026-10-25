import React from 'react';
import { StyleSheet, ScrollView, View, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCaseState } from '@/context/CaseContext';
import { RecipientType } from '@/types/proofpath.types';
import { ALL_DISCLOSURE_FIELDS } from '@/services/case-service';
import { FieldCheckboxList } from '@/components/proofpath';
import { useTranslation } from '@/context/LanguageContext';

const RECIPIENTS: { type: RecipientType; label: string; description: string; icon: string }[] = [
  {
    type: 'TRUSTED_CONTACT',
    label: 'Trusted Contact',
    description: 'Personal advocate, close friend, or family member. Sensitive technical identifiers are redacted.',
    icon: '🤝',
  },
  {
    type: 'SUPPORT_ORGANIZATION',
    label: 'Support Organization',
    description: 'Crisis counselor, NGO, or advisory team. Focused on incident context and personal safety needs.',
    icon: '🏢',
  },
  {
    type: 'LEGAL_PROFESSIONAL',
    label: 'Legal Professional',
    description: 'Attorney or legal representative requiring complete case facts and chain-of-custody metadata.',
    icon: '⚖',
  },
];

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const {
    currentCase,
    availableCases,
    selectCase,
    selectedRecipient,
    includedDisclosureFields,
    disclosurePreview,
    setSelectedRecipient,
    toggleDisclosureField,
  } = useCaseState();

  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const totalFields = ALL_DISCLOSURE_FIELDS.length;
  const includedCount = includedDisclosureFields.length;
  const redactedCount = totalFields - includedCount;

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
            <View style={styles.badgeRow}>
              <View style={styles.workspacePill}>
                <ThemedText style={styles.workspacePillText}>SHARE SAFELY WORKSPACE</ThemedText>
              </View>
              {availableCases.length > 1 ? (
                <View style={styles.casePickerRow}>
                  {availableCases.map((c) => {
                    const isSelected = c.id === currentCase?.id;
                    const isDuplicateTitle = availableCases.filter((item) => item.title === c.title).length > 1;
                    const shortId = c.id.replace(/^case_/, '');
                    const baseTitle = c.title ? (c.title.length > 18 ? `${c.title.slice(0, 18)}...` : c.title) : c.id;
                    const displayLabel = isDuplicateTitle ? `${baseTitle} (#${shortId.slice(0, 4)})` : baseTitle;

                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => selectCase(c.id)}
                        style={[styles.caseSelectorPill, isSelected && styles.caseSelectorPillActive]}
                      >
                        <ThemedText
                          type="smallBold"
                          style={isSelected ? styles.caseSelectorPillTextActive : styles.caseSelectorPillTextInactive}
                        >
                          {displayLabel}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <ThemedText type="small" style={styles.caseBadge}>
                  {currentCase?.title || 'Case Disclosure'}
                </ThemedText>
              )}
            </View>
            <ThemedText type="title">{t.privacy.title}</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              {t.privacy.subtitle}
            </ThemedText>
          </View>

          {/* Workflow Stepper Bar */}
          <View style={styles.stepperBar}>
            <View style={[styles.stepItem, styles.stepItemActive]}>
              <ThemedText style={styles.stepNumActive}>1</ThemedText>
              <ThemedText style={styles.stepLabelActive}>Select Recipient</ThemedText>
            </View>
            <ThemedText style={styles.stepDivider}>→</ThemedText>
            <View style={[styles.stepItem, styles.stepItemActive]}>
              <ThemedText style={styles.stepNumActive}>2</ThemedText>
              <ThemedText style={styles.stepLabelActive}>Review Fields</ThemedText>
            </View>
            <ThemedText style={styles.stepDivider}>→</ThemedText>
            <Pressable
              style={styles.stepItem}
              onPress={() => router.push('/report/preview')}
            >
              <ThemedText style={styles.stepNumInactive}>3</ThemedText>
              <ThemedText style={styles.stepLabelInactive}>Preview & Export</ThemedText>
            </Pressable>
          </View>

          {/* Transparent Notice Banner */}
          <ThemedView type="backgroundElement" style={styles.noticeBanner}>
            <ThemedText type="smallBold" style={styles.noticeBannerTitle}>
              🛡 ZERO SILENT LEAKAGE GUARANTEE
            </ThemedText>
            <ThemedText type="small" style={styles.noticeBannerText}>
              ProofPath strictly validates all disclosure profiles against server-side allowlists. Deselected fields are permanently excised before PDF compilation, ensuring confidential data is never transmitted.
            </ThemedText>
          </ThemedView>

          {/* Recipient Audience Selector */}
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="smallBold" style={styles.sectionHeader}>
              1. CHOOSE YOUR INTENDED RECIPIENT
            </ThemedText>
            <ThemedText type="small" style={styles.sectionSub}>
              Applies tested baseline redactions tailored for each audience
            </ThemedText>
          </View>

          <View style={styles.recipientGrid}>
            {RECIPIENTS.map((rec) => {
              const isSelected = selectedRecipient === rec.type;
              return (
                <Pressable
                  key={rec.type}
                  style={[
                    styles.recipientCard,
                    isSelected && styles.recipientCardActive,
                  ]}
                  onPress={() => setSelectedRecipient(rec.type)}
                >
                  <View style={styles.recipientTop}>
                    <ThemedText style={styles.recipientIcon}>{rec.icon}</ThemedText>
                    <View
                      style={[
                        styles.recipientRadio,
                        isSelected && styles.recipientRadioSelected,
                      ]}
                    >
                      {isSelected ? <View style={styles.radioInner} /> : null}
                    </View>
                  </View>
                  <ThemedText type="subtitle" style={styles.recipientTitle}>
                    {rec.label}
                  </ThemedText>
                  <ThemedText type="small" style={styles.recipientDesc}>
                    {rec.description}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Field Redaction Checklist */}
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="smallBold" style={styles.sectionHeader}>
              2. TAILOR DISCLOSURE FIELDS ({includedCount} INCLUDED, {redactedCount} REDACTED)
            </ThemedText>
            <ThemedText type="small" style={styles.sectionSub}>
              Toggle individual data points on or off with live state sync
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.fieldsCard}>
            <FieldCheckboxList
              fields={ALL_DISCLOSURE_FIELDS}
              includedFields={includedDisclosureFields}
              onToggleField={toggleDisclosureField}
            />
          </ThemedView>

          {/* Next Step Action CTA */}
          <ThemedView type="backgroundElement" style={styles.ctaCard}>
            <View style={styles.ctaTextCol}>
              <ThemedText type="subtitle" style={styles.ctaTitle}>
                Ready to review privacy redactions?
              </ThemedText>
              <ThemedText type="small" style={styles.ctaDesc}>
                Preview the generated incident report layout before confirming and exporting.
              </ThemedText>
            </View>
            <Pressable
              style={styles.previewBtn}
              onPress={() => router.push('/report/preview')}
            >
              <ThemedText style={styles.previewBtnText}>Preview Incident Report →</ThemedText>
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
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
  stepDivider: {
    color: Colors.light.textMuted,
    fontSize: 12,
  },
  stepNumInactive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.border,
    color: Colors.light.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  stepLabelInactive: {
    fontSize: 12,
    color: Colors.light.textSecondary,
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
  sectionHeaderRow: {
    marginTop: 6,
    gap: 2,
  },
  sectionHeader: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  sectionSub: {
    color: Colors.light.textMuted,
    fontSize: 12,
  },
  recipientGrid: {
    gap: 12,
  },
  recipientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
    gap: 8,
  },
  recipientCardActive: {
    borderColor: BrandColors.indigo,
    backgroundColor: BrandColors.indigoLight,
  },
  recipientTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recipientIcon: {
    fontSize: 22,
  },
  recipientRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientRadioSelected: {
    borderColor: BrandColors.indigo,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BrandColors.indigo,
  },
  recipientTitle: {
    fontSize: 16,
    color: Colors.light.text,
  },
  recipientDesc: {
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  fieldsCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
  },
  ctaCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BrandColors.indigoBorder,
    backgroundColor: BrandColors.indigoLight,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  ctaTextCol: {
    flex: 1,
    minWidth: 220,
    gap: 4,
  },
  ctaTitle: {
    fontSize: 16,
    color: Colors.light.text,
  },
  ctaDesc: {
    color: Colors.light.textSecondary,
  },
  previewBtn: {
    backgroundColor: BrandColors.indigo,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  previewBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  casePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  caseSelectorPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    backgroundColor: Colors.light.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  caseSelectorPillActive: {
    backgroundColor: BrandColors.indigoLight,
    borderColor: BrandColors.indigoBorder,
  },
  caseSelectorPillTextActive: {
    color: BrandColors.indigo,
    fontSize: 11,
  },
  caseSelectorPillTextInactive: {
    color: Colors.light.textSecondary,
    fontSize: 11,
  },
});
