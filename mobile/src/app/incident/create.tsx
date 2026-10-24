import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, TextInput, Pressable, useColorScheme, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, BrandColors, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTranslation } from '@/context/LanguageContext';
import { useCaseState } from '@/context/CaseContext';
import { safeBack } from '@/utils/navigation';

export default function CreateIncidentScreen() {
  const { t } = useTranslation();
  const { createNewCase, addClaimToCase } = useCaseState();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [initialClaim, setInitialClaim] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdNotice, setCreatedNotice] = useState(false);
  const isDark = false;
  const colors = Colors.light;

  const handleCreate = async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const created = await createNewCase(title.trim(), description.trim());
      if (initialClaim.trim()) {
        await addClaimToCase(created.id, initialClaim.trim(), 'Primary Observation');
      }
      setCreatedNotice(true);
      setTimeout(() => {
        router.replace(`/incident/${created.id}` as any);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create record. Please ensure backend is reachable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => safeBack('/')} style={styles.backButton}>
              <ThemedText type="smallBold" style={styles.backButtonText}>
                ← {t.common.backToOverview}
              </ThemedText>
            </Pressable>
            <ThemedText type="title">{t.incidentCreate.title}</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              Initiate a confidential, cryptographically backed case record. All timeline logs maintain SHA-256 auditability.
            </ThemedText>
          </View>

          {errorMsg ? (
            <ThemedView type="backgroundElement" style={styles.errorBanner}>
              <ThemedText type="smallBold" style={styles.errorBannerText}>
                ⚠ {errorMsg}
              </ThemedText>
            </ThemedView>
          ) : null}

          {createdNotice ? (
            <ThemedView type="backgroundElement" style={styles.successBanner}>
              <ThemedText type="smallBold" style={styles.successText}>
                ✓ Record successfully initialized and registered in local vault! Navigating...
              </ThemedText>
            </ThemedView>
          ) : (
            <ThemedView type="backgroundElement" style={styles.formCard}>
              <ThemedText type="smallBold" style={styles.fieldLabel}>
                INCIDENT RECORD TITLE *
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text, borderColor: isDark ? BrandColors.borderDark : BrandColors.border },
                ]}
                placeholder="e.g. Workplace Disciplinary Escalation / Notice"
                placeholderTextColor={BrandColors.muted}
                value={title}
                onChangeText={setTitle}
                editable={!isSubmitting}
              />

              <ThemedText type="smallBold" style={styles.fieldLabel}>
                SUMMARY & CONTEXT NOTE
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { color: colors.text, borderColor: isDark ? BrandColors.borderDark : BrandColors.border },
                ]}
                placeholder="Describe what occurred, dates, parties involved, or key background details..."
                placeholderTextColor={BrandColors.muted}
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
                editable={!isSubmitting}
              />

              <ThemedText type="smallBold" style={styles.fieldLabel}>
                INITIAL FACT OR CLAIM (OPTIONAL)
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text, borderColor: isDark ? BrandColors.borderDark : BrandColors.border },
                ]}
                placeholder="e.g. Received unannounced termination notice without prior PIP"
                placeholderTextColor={BrandColors.muted}
                value={initialClaim}
                onChangeText={setInitialClaim}
                editable={!isSubmitting}
              />

              <Pressable
                style={[
                  styles.submitButton,
                  (!title.trim() || isSubmitting) && styles.submitButtonDisabled,
                ]}
                disabled={!title.trim() || isSubmitting}
                onPress={handleCreate}>
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <ThemedText type="smallBold" style={styles.submitButtonText}>
                    Initialize Cryptographic Record →
                  </ThemedText>
                )}
              </Pressable>
            </ThemedView>
          )}
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
  formCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.one,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: '#FFFFFF',
  },
  fieldLabel: {
    marginTop: Spacing.two,
    fontSize: 12,
    color: BrandColors.muted,
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: BrandColors.indigo,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  successBanner: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successText: {
    color: '#059669',
    fontSize: 14,
  },
  errorBanner: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 14,
  },
});
