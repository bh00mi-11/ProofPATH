import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, TextInput, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, BrandColors, Colors, MaxContentWidth, Spacing } from '@/constants/theme';

export default function CreateIncidentScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [createdNotice, setCreatedNotice] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const handleCreate = () => {
    setCreatedNotice(true);
    setTimeout(() => {
      router.back();
    }, 1200);
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
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ThemedText type="smallBold" style={styles.backButtonText}>
                ← Back to overview
              </ThemedText>
            </Pressable>
            <ThemedText type="title">Create incident</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              Add a new case to test in this session.
            </ThemedText>
          </View>

          {/* 1-Sentence Demo Notice */}
          <ThemedView type="backgroundElement" style={styles.demoBanner}>
            <ThemedText type="smallBold" style={styles.demoBannerText}>
              Sample demo: New cases are saved in memory for this session only.
            </ThemedText>
          </ThemedView>

          {createdNotice ? (
            <ThemedView type="backgroundElement" style={styles.successBanner}>
              <ThemedText type="smallBold" style={styles.successText}>
                ✓ Demo incident registered in memory! Returning...
              </ThemedText>
            </ThemedView>
          ) : (
            <ThemedView type="backgroundElement" style={styles.formCard}>
              <ThemedText type="smallBold" style={styles.fieldLabel}>
                INCIDENT TITLE
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text, borderColor: isDark ? BrandColors.borderDark : BrandColors.border },
                ]}
                placeholder="e.g. Missing office equipment"
                placeholderTextColor={BrandColors.muted}
                value={title}
                onChangeText={setTitle}
              />

              <ThemedText type="smallBold" style={styles.fieldLabel}>
                INCIDENT DESCRIPTION
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { color: colors.text, borderColor: isDark ? BrandColors.borderDark : BrandColors.border },
                ]}
                placeholder="Write a short summary of the situation..."
                placeholderTextColor={BrandColors.muted}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />

              <Pressable
                style={[
                  styles.submitButton,
                  !title && styles.submitButtonDisabled,
                ]}
                disabled={!title}
                onPress={handleCreate}>
                <ThemedText type="smallBold" style={styles.submitButtonText}>
                  Save incident →
                </ThemedText>
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
});
