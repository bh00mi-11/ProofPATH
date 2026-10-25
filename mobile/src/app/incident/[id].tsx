import React from 'react';
import { StyleSheet, ScrollView, View, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCaseState } from '@/context/CaseContext';
import { ClaimStatusBadge } from '@/components/proofpath';
import { useTranslation } from '@/context/LanguageContext';
import { safeBack } from '@/utils/navigation';

export default function IncidentDetailsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentCase, claims, evidence, isLoading, selectCase } = useCaseState();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const caseId = id || currentCase?.id || 'case_demo_01';

  React.useEffect(() => {
    if (id && currentCase?.id !== id) {
      selectCase(id);
    }
  }, [id, currentCase?.id, selectCase]);

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
            <Pressable onPress={() => safeBack('/')} style={styles.backButton}>
              <ThemedText type="smallBold" style={styles.backButtonText}>
                ← {t.common.backToOverview}
              </ThemedText>
            </Pressable>
            <View style={styles.badgeRow}>
              <View style={styles.workspacePill}>
                <ThemedText style={styles.workspacePillText}>INCIDENT OVERVIEW</ThemedText>
              </View>
              <ThemedText type="small" style={styles.caseBadge}>
                Case #{caseId}
              </ThemedText>
            </View>
            <ThemedText type="title">{t.incidentDetail.title}</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              {t.incidentDetail.subtitle}
            </ThemedText>
          </View>

          {/* Incident Overview Card */}
          <ThemedView type="backgroundElement" style={styles.overviewCard}>
            <View style={styles.overviewTop}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <ThemedText type="smallBold" style={styles.liveText}>
                  Active Incident Record
                </ThemedText>
              </View>
              <ThemedText type="small" style={styles.dateText}>
                {t.incidentDetail.registered}:{' '}
                {currentCase?.createdAt
                  ? new Date(currentCase.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </ThemedText>
            </View>

            <ThemedText type="subtitle" style={styles.caseTitle}>
              {currentCase?.title ?? 'Case Details'}
            </ThemedText>
            <ThemedText type="default" style={styles.descriptionText}>
              {currentCase?.description || 'No description recorded.'}
            </ThemedText>

            <View style={styles.metricRow}>
              <View style={styles.metricBox}>
                <ThemedText style={styles.metricVal}>{claims.length}</ThemedText>
                <ThemedText style={styles.metricLbl}>Statements</ThemedText>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricBox}>
                <ThemedText style={styles.metricVal}>{evidence.length}</ThemedText>
                <ThemedText style={styles.metricLbl}>Evidence Files</ThemedText>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricBox}>
                <ThemedText style={styles.metricVal}>
                  {claims.filter((c) => c.status === 'SUPPORTED').length}
                </ThemedText>
                <ThemedText style={styles.metricLbl}>Supported</ThemedText>
              </View>
            </View>
          </ThemedView>

          {/* Quick Actions Bar */}
          <View style={styles.actionRow}>
            <Pressable
              style={styles.actionBtn}
              onPress={() => router.push('/evidence')}
            >
              <ThemedText style={styles.actionBtnText}>📁 Evidence Vault ({evidence.length})</ThemedText>
            </Pressable>
            <Pressable
              style={styles.actionBtnSecondary}
              onPress={() => router.push('/incident/create')}
            >
              <ThemedText style={styles.actionBtnSecondaryText}>+ New Record</ThemedText>
            </Pressable>
            <Pressable
              style={styles.actionBtnSecondary}
              onPress={() => router.push('/time-machine')}
            >
              <ThemedText style={styles.actionBtnSecondaryText}>See what changes</ThemedText>
            </Pressable>
          </View>

          <ThemedView type="backgroundElement" style={styles.overviewCard}>
            <ThemedText type="subtitle">What happens next?</ThemedText>
            <ThemedText type="small" style={styles.descriptionText}>Save a message or screenshot first. When you feel ready, review what it shows and decide whether to share it. You stay in control. The app does not make legal findings.</ThemedText>
          </ThemedView>

          {/* Associated Claims Section */}
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="smallBold" style={styles.sectionHeader}>
              WHAT YOUR RECORDS SHOW ({claims.length})
            </ThemedText>
            <ThemedText type="small" style={styles.sectionSub}>
              Based on linked records, not a legal verdict
            </ThemedText>
          </View>

          {isLoading ? (
            <ThemedText style={styles.loadingText}>Checking statements...</ThemedText>
          ) : claims.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <ThemedText type="small" style={styles.emptyText}>
                No statements recorded for this case yet.
              </ThemedText>
            </ThemedView>
          ) : (
            claims.map((claim) => (
              <Pressable
                key={claim.id}
                onPress={() => router.push(`/claim/${claim.id}` as any)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <ThemedView type="backgroundElement" style={styles.claimCard}>
                  <View style={styles.claimHeader}>
                    <View style={styles.claimIdBadge}>
                      <ThemedText type="smallBold" style={styles.claimIdText}>
                        Statement #{claim.id}
                      </ThemedText>
                    </View>
                    <ClaimStatusBadge status={claim.status} />
                  </View>

                  <ThemedText type="subtitle" style={styles.claimText}>
                    "{claim.text}"
                  </ThemedText>

                  {claim.explanation ? (
                    <ThemedText type="small" style={styles.claimReason}>
                      {claim.explanation}
                    </ThemedText>
                  ) : null}

                  <View style={styles.obsCountRow}>
                    <View style={styles.countBadgeSupport}>
                      <ThemedText type="smallBold" style={styles.supportCountText}>
                        ✓ {claim.supportingObservationIds.length} matching details
                      </ThemedText>
                    </View>
                    <View style={styles.countBadgeConflict}>
                      <ThemedText type="smallBold" style={styles.conflictCountText}>
                        ? {claim.conflictingObservationIds.length} details to review
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <ThemedText type="smallBold" style={styles.viewMoreText}>
                      Understand this result and view linked evidence →
                    </ThemedText>
                  </View>
                </ThemedView>
              </Pressable>
            ))
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
  overviewCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 20,
    gap: 12,
  },
  overviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandColors.success,
  },
  liveText: {
    fontSize: 12,
    color: Colors.light.text,
  },
  dateText: {
    color: Colors.light.textSecondary,
  },
  caseTitle: {
    fontSize: 20,
    color: Colors.light.text,
  },
  descriptionText: {
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  metricRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 6,
  },
  metricBox: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandColors.indigo,
  },
  metricLbl: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.light.border,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  actionBtn: {
    backgroundColor: BrandColors.indigo,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  actionBtnSecondary: {
    backgroundColor: Colors.light.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionBtnSecondaryText: {
    color: Colors.light.text,
    fontWeight: '600',
    fontSize: 13,
  },
  sectionHeaderRow: {
    marginTop: 8,
    gap: 4,
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
  claimCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
    gap: 10,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  claimIdBadge: {
    backgroundColor: Colors.light.backgroundSubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  claimIdText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  claimText: {
    fontSize: 16,
    lineHeight: 22,
    color: Colors.light.text,
  },
  claimReason: {
    color: Colors.light.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  obsCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  countBadgeSupport: {
    backgroundColor: BrandColors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BrandColors.successBorder,
  },
  supportCountText: {
    fontSize: 11,
    color: BrandColors.success,
  },
  countBadgeConflict: {
    backgroundColor: BrandColors.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BrandColors.dangerBorder,
  },
  conflictCountText: {
    fontSize: 11,
    color: BrandColors.danger,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
    paddingTop: 8,
    marginTop: 2,
  },
  viewMoreText: {
    fontSize: 12,
    color: BrandColors.indigo,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.light.textSecondary,
  },
  loadingText: {
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  pressed: {
    opacity: 0.85,
  },
});
