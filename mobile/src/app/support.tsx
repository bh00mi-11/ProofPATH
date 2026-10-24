import React from 'react';
import { StyleSheet, ScrollView, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, BrandColors, MaxContentWidth, Spacing } from '@/constants/theme';

export default function SupportScreen() {
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
            <ThemedText type="title">Support network</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              Connect directly with crisis counselors or legal aid organizations.
            </ThemedText>
          </View>

          {/* 1-Sentence Demo Notice */}
          <ThemedView type="backgroundElement" style={styles.demoBanner}>
            <ThemedText type="smallBold" style={styles.demoBannerText}>
              Coming soon: This feature is planned for a future update and is not yet connected.
            </ThemedText>
          </ThemedView>

          {/* Planned Capabilities Overview */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              WHAT THIS WILL DO
            </ThemedText>

            <View style={styles.featureItem}>
              <ThemedText type="smallBold" style={styles.itemTitle}>
                1. Helplines & verified contacts
              </ThemedText>
              <ThemedText type="small" style={styles.dimText}>
                Verified contacts for counseling, legal advice, and workplace support services.
              </ThemedText>
            </View>

            <View style={styles.featureItem}>
              <ThemedText type="smallBold" style={styles.itemTitle}>
                2. Safe direct sharing
              </ThemedText>
              <ThemedText type="small" style={styles.dimText}>
                One-tap sharing of your privacy-approved summary report with accredited organizations.
              </ThemedText>
            </View>

            <View style={styles.featureItem}>
              <ThemedText type="smallBold" style={styles.itemTitle}>
                3. Privacy protection
              </ThemedText>
              <ThemedText type="small" style={styles.dimText}>
                Share verified facts and dates without revealing unnecessary personal details.
              </ThemedText>
            </View>
          </ThemedView>

          {/* Obvious Next Action Card */}
          <ThemedView type="backgroundElement" style={styles.nextActionCard}>
            <ThemedText type="smallBold" style={styles.nextActionTag}>
              READY TO EXPLORE?
            </ThemedText>
            <ThemedText type="subtitle" style={styles.nextActionTitle}>
              Return to the active incident
            </ThemedText>
            <Pressable
              style={styles.returnButton}
              onPress={() => router.push('/')}>
              <ThemedText type="smallBold" style={styles.returnButtonText}>
                Go to Overview →
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderStyle: 'dashed',
  },
  demoBannerText: {
    color: BrandColors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 12,
    color: BrandColors.muted,
    letterSpacing: 0.5,
  },
  featureItem: {
    gap: 4,
  },
  itemTitle: {
    fontSize: 14,
  },
  dimText: {
    opacity: 0.7,
    fontSize: 13,
    lineHeight: 18,
  },
  nextActionCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.border,
    gap: Spacing.one,
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
  returnButton: {
    backgroundColor: BrandColors.indigo,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
  },
  returnButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
