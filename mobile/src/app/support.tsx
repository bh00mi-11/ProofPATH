import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  ActivityIndicator,
  Linking,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { apiCaseService } from '@/services/api-case-service';
import { useCaseState } from '@/context/CaseContext';
import { NavigatorData, ChecklistItem, VerifiedResource } from '@/types/proofpath.types';
import { useTranslation } from '@/context/LanguageContext';

export default function NextStepNavigatorScreen() {
  const { t } = useTranslation();
  const { currentCase, availableCases, selectCase } = useCaseState();
  const caseId = currentCase?.id || 'case_demo_01';

  const [data, setData] = useState<NavigatorData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const fetchNavigator = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiCaseService.getNavigator(caseId);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load Next-Step Navigator guidance.');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchNavigator();
  }, [fetchNavigator]);

  const handleToggle = async (item: ChecklistItem) => {
    if (togglingKey) return;
    setTogglingKey(item.action_key);
    const newCompleted = !item.completed;
    try {
      await apiCaseService.toggleChecklistItem(caseId, item.action_key, newCompleted, item.title);
      // Optimistically update local checklist state
      setData((prev) => {
        if (!prev) return prev;
        const updatedList = prev.checklist.map((it) =>
          it.action_key === item.action_key
            ? { ...it, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
            : it
        );
        const completedCount = updatedList.filter((it) => it.completed).length;
        return {
          ...prev,
          checklist_completed: completedCount,
          checklist: updatedList,
        };
      });
    } catch (err: any) {
      alert(`Could not save checklist state: ${err?.message || 'Network error'}`);
    } finally {
      setTogglingKey(null);
    }
  };

  const openEmergencyCall = (helpline: string) => {
    const url = `tel:${helpline}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported || Platform.OS === 'web') {
          Linking.openURL(url);
        } else {
          alert(`Unable to open dialer. Direct emergency number: ${helpline}`);
        }
      })
      .catch(() => {
        alert(`Direct emergency helpline: ${helpline}`);
      });
  };

  const openSafeUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      alert(`Could not open external link: ${url}`);
    });
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
            <View style={styles.badgeRow}>
              <View style={styles.workspacePill}>
                <ThemedText style={styles.workspacePillText}>SUPPORT WORKSPACE</ThemedText>
              </View>
              <ThemedText type="small" style={styles.caseBadge}>
                {currentCase?.title || 'Case Support'}
              </ThemedText>
            </View>
            <ThemedText type="title">{t.navigator.title}</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              Deterministic action checklists, verified Indian statutory helplines, and institutional reporting guidance.
            </ThemedText>

            {/* Case Selection Pills */}
            {availableCases && availableCases.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.casePickerRow}
              >
                {availableCases.map((c) => {
                  const isSelected = c.id === currentCase?.id;
                  const duplicates = availableCases.filter((item) => item.title === c.title);
                  const isDuplicateTitle = duplicates.length > 1;
                  const shortId = c.id.replace('case_', '').slice(0, 4);
                  const displayLabel = isDuplicateTitle ? `${c.title} (#${shortId})` : c.title;

                  return (
                    <Pressable
                      key={c.id}
                      style={[
                        styles.caseSelectorPill,
                        isSelected && styles.caseSelectorPillActive,
                      ]}
                      onPress={() => selectCase(c.id)}
                    >
                      <ThemedText
                        style={[
                          styles.caseSelectorText,
                          isSelected && styles.caseSelectorTextActive,
                        ]}
                      >
                        {displayLabel}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* 4 Pillars Navigation Bar inside Support Workspace */}
          <View style={styles.supportNavRail}>
            <View style={[styles.supportNavItem, styles.supportNavItemActive]}>
              <ThemedText style={styles.supportNavTextActive}>
                🧭 Next Steps
              </ThemedText>
            </View>
            <Pressable
              style={styles.supportNavItem}
              onPress={() => router.push('/accountability')}
            >
              <ThemedText style={styles.supportNavTextInactive}>
                📋 Accountability Trail →
              </ThemedText>
            </Pressable>
            <Pressable
              style={styles.supportNavItem}
              onPress={() => router.push('/legal-context')}
            >
              <ThemedText style={styles.supportNavTextInactive}>
                ⚖️ Legal Context →
              </ThemedText>
            </Pressable>
            <Pressable
              style={styles.supportNavItem}
              onPress={() => router.push('/remedies')}
            >
              <ThemedText style={styles.supportNavTextInactive}>
                🏛️ Victim Remedies →
              </ThemedText>
            </Pressable>
          </View>

          {/* Emergency 112 Pan-India Card */}
          <ThemedView type="backgroundElement" style={styles.emergencyCard}>
            <View style={styles.emergencyHeader}>
              <View style={styles.emergencyBadge}>
                <ThemedText style={styles.emergencyBadgeText}>{t.navigator.emergencyNoticeTitle}</ThemedText>
              </View>
              <ThemedText style={styles.emergencyHelpline}>National Helpline: 112</ThemedText>
            </View>
            <ThemedText style={styles.emergencyText}>
              {t.navigator.emergencyNoticeDesc}
            </ThemedText>
            <Pressable
              onPress={() => openEmergencyCall('112')}
              style={({ pressed }) => [styles.emergencyCallBtn, pressed && styles.pressed]}
            >
              <ThemedText style={styles.emergencyCallBtnText}>📞 {t.common.call112}</ThemedText>
            </Pressable>
          </ThemedView>

          {/* Loading State */}
          {loading && (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color={BrandColors.indigo} />
              <ThemedText style={styles.stateText}>Analyzing incident context and loading verified next steps...</ThemedText>
            </View>
          )}

          {/* Error State */}
          {!loading && error && (
            <ThemedView type="backgroundElement" style={styles.errorBox}>
              <ThemedText style={styles.errorTitle}>Guidance Notice</ThemedText>
              <ThemedText style={styles.errorDesc}>{error}</ThemedText>
              <Pressable
                onPress={fetchNavigator}
                style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
              >
                <ThemedText style={styles.retryBtnText}>Retry Connection</ThemedText>
              </Pressable>
            </ThemedView>
          )}

          {/* Main Loaded Content */}
          {!loading && !error && data && (
            <>
              {/* Category Guidance Banner */}
              <ThemedView type="backgroundElement" style={styles.categoryCard}>
                <View style={styles.categoryPill}>
                  <ThemedText style={styles.categoryPillText}>
                    INCIDENT CATEGORY: {data.canonical_name.toUpperCase()}
                  </ThemedText>
                </View>
                <ThemedText type="subtitle" style={styles.categorySummary}>
                  {data.summary}
                </ThemedText>
                <View style={styles.divider} />
                <ThemedText type="smallBold" style={styles.guidanceHeading}>
                  Key Safety Principles:
                </ThemedText>
                {data.safety_notes.map((note, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <ThemedText style={styles.bulletDot}>•</ThemedText>
                    <ThemedText type="small" style={styles.bulletText}>
                      {note}
                    </ThemedText>
                  </View>
                ))}
              </ThemedView>

              {/* Action Checklist */}
              <ThemedView type="backgroundElement" style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <ThemedText type="smallBold" style={styles.sectionTitle}>
                      PERSONALIZED ACTION CHECKLIST
                    </ThemedText>
                    <ThemedText type="small" style={styles.sectionSub}>
                      {data.checklist_completed} of {data.checklist_total} recommended actions completed
                    </ThemedText>
                  </View>
                  <View style={styles.progressBadge}>
                    <ThemedText style={styles.progressBadgeText}>
                      {Math.round((data.checklist_completed / (data.checklist_total || 1)) * 100)}%
                    </ThemedText>
                  </View>
                </View>

                {/* Checklist Items */}
                <View style={styles.checklistContainer}>
                  {data.checklist.map((item) => (
                    <Pressable
                      key={item.action_key}
                      onPress={() => handleToggle(item)}
                      style={({ pressed }) => [
                        styles.checklistItem,
                        item.completed && styles.checklistItemCompleted,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={styles.checkboxCircle}>
                        <ThemedText style={styles.checkboxTick}>
                          {item.completed ? '✓' : ''}
                        </ThemedText>
                      </View>
                      <View style={styles.checklistContent}>
                        <View style={styles.itemHeader}>
                          <ThemedText
                            style={[
                              styles.itemTitleText,
                              item.completed && styles.itemTitleCompleted,
                            ]}
                          >
                            {item.title}
                          </ThemedText>
                          {item.priority === 'HIGH' && (
                            <View style={styles.highPriorityBadge}>
                              <ThemedText style={styles.highPriorityText}>HIGH PRIORITY</ThemedText>
                            </View>
                          )}
                        </View>
                        <ThemedText style={styles.itemDescText}>{item.description}</ThemedText>
                        {item.completed && item.completed_at && (
                          <ThemedText style={styles.completedAtText}>
                            Completed {new Date(item.completed_at).toLocaleDateString()}
                          </ThemedText>
                        )}
                      </View>
                    </Pressable>
                  ))}
                </View>
              </ThemedView>

              {/* Official Verified Support & Reporting Resources */}
              <ThemedView type="backgroundElement" style={styles.sectionCard}>
                <ThemedText type="smallBold" style={styles.sectionTitle}>
                  OFFICIAL INDIAN SUPPORT & REPORTING RESOURCES
                </ThemedText>
                <ThemedText type="small" style={styles.sectionSub}>
                  Independently verified Government and statutory resources. Links open directly in your browser with zero case data transmitted.
                </ThemedText>

                <View style={styles.resourcesContainer}>
                  {data.verified_resources.map((res: VerifiedResource) => (
                    <View key={res.id} style={styles.resourceCard}>
                      <View style={styles.resourceHeader}>
                        <View style={{ flex: 1 }}>
                          <ThemedText style={styles.resourceName}>{res.name}</ThemedText>
                          <ThemedText style={styles.resourceOrg}>{res.organization}</ThemedText>
                        </View>
                        {res.helpline && (
                          <Pressable
                            onPress={() => openEmergencyCall(res.helpline)}
                            style={styles.callHelplineBtn}
                          >
                            <ThemedText style={styles.callHelplineText}>
                              📞 {res.helpline}
                            </ThemedText>
                          </Pressable>
                        )}
                      </View>

                      <ThemedText style={styles.resourceScope}>{res.scope}</ThemedText>

                      <View style={styles.resourceFooter}>
                        <ThemedText style={styles.verifiedDate}>
                          Verified: {res.last_verified}
                        </ThemedText>
                        <Pressable
                          onPress={() => openSafeUrl(res.url)}
                          style={({ pressed }) => [styles.portalLinkBtn, pressed && styles.pressed]}
                        >
                          <ThemedText style={styles.portalLinkText}>
                            Open Official Portal ↗
                          </ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </ThemedView>

              {/* Honest Disclaimer Card */}
              <ThemedView type="backgroundElement" style={styles.disclaimerCard}>
                <ThemedText style={styles.disclaimerTitle}>Safety & Legal Boundary Notice</ThemedText>
                <ThemedText style={styles.disclaimerText}>{data.disclaimer}</ThemedText>
                <ThemedText style={styles.disclaimerSubtext}>
                  ProofPath does not submit complaints on your behalf. All reporting actions remain strictly in your control.
                </ThemedText>
              </ThemedView>
            </>
          )}
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
    backgroundColor: BrandColors.indigoLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
  },
  workspacePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: BrandColors.indigo,
    letterSpacing: 0.5,
  },
  caseBadge: {
    color: Colors.light.textSecondary,
  },
  subtitle: {
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  supportNavRail: {
    flexDirection: 'row',
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 4,
    flexWrap: 'wrap',
  },
  supportNavItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    minWidth: 150,
    alignItems: 'center',
  },
  supportNavItemActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  supportNavTextActive: {
    color: BrandColors.indigo,
    fontSize: 12,
    fontWeight: '700',
  },
  supportNavTextInactive: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  emergencyCard: {
    backgroundColor: BrandColors.roseLight,
    borderWidth: 1,
    borderColor: BrandColors.roseBorder,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  emergencyBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BrandColors.roseBorder,
  },
  emergencyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: BrandColors.rose,
  },
  emergencyHelpline: {
    fontSize: 13,
    fontWeight: '700',
    color: '#881337',
  },
  emergencyText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#881337',
  },
  emergencyCallBtn: {
    backgroundColor: BrandColors.rose,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  emergencyCallBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  stateContainer: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stateText: {
    color: Colors.light.textSecondary,
    fontSize: 13,
  },
  errorBox: {
    backgroundColor: BrandColors.dangerLight,
    borderWidth: 1,
    borderColor: BrandColors.dangerBorder,
    borderRadius: 12,
    padding: 18,
    gap: 8,
  },
  errorTitle: {
    color: BrandColors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
  errorDesc: {
    color: '#7F1D1D',
    fontSize: 13,
  },
  retryBtn: {
    backgroundColor: BrandColors.danger,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 18,
    gap: 10,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: BrandColors.indigoLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.indigo,
  },
  categorySummary: {
    fontSize: 16,
    color: Colors.light.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
    marginVertical: 4,
  },
  guidanceHeading: {
    fontSize: 13,
    color: Colors.light.text,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 4,
  },
  bulletDot: {
    color: BrandColors.indigo,
    fontSize: 14,
  },
  bulletText: {
    color: Colors.light.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 18,
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    color: Colors.light.text,
    letterSpacing: 0.3,
  },
  sectionSub: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  progressBadge: {
    backgroundColor: BrandColors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BrandColors.successBorder,
  },
  progressBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.success,
  },
  checklistContainer: {
    gap: 10,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 12,
    gap: 12,
  },
  checklistItemCompleted: {
    backgroundColor: BrandColors.successLight,
    borderColor: BrandColors.successBorder,
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxTick: {
    color: BrandColors.success,
    fontWeight: '800',
    fontSize: 12,
  },
  checklistContent: {
    flex: 1,
    gap: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  itemTitleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.light.textSecondary,
  },
  highPriorityBadge: {
    backgroundColor: BrandColors.roseLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  highPriorityText: {
    fontSize: 9,
    fontWeight: '800',
    color: BrandColors.rose,
  },
  itemDescText: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.light.textSecondary,
  },
  completedAtText: {
    fontSize: 11,
    color: BrandColors.success,
    marginTop: 2,
  },
  resourcesContainer: {
    gap: 12,
  },
  resourceCard: {
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 14,
    gap: 8,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  resourceName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  resourceOrg: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  callHelplineBtn: {
    backgroundColor: BrandColors.tealLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BrandColors.tealBorder,
  },
  callHelplineText: {
    fontSize: 11,
    color: BrandColors.teal,
    fontWeight: '700',
  },
  resourceScope: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 17,
  },
  resourceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
    paddingTop: 8,
  },
  verifiedDate: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  portalLinkBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  portalLinkText: {
    fontSize: 12,
    color: BrandColors.indigo,
    fontWeight: '600',
  },
  disclaimerCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
    gap: 6,
  },
  disclaimerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.light.textSecondary,
  },
  disclaimerSubtext: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  pressed: {
    opacity: 0.85,
  },
  casePickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingBottom: 4,
  },
  caseSelectorPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  caseSelectorPillActive: {
    backgroundColor: BrandColors.indigo,
    borderColor: BrandColors.indigo,
  },
  caseSelectorText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  caseSelectorTextActive: {
    color: '#ffffff',
  },
});
