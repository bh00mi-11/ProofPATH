import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  TextInput,
  useWindowDimensions,
  Platform,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCaseState } from '@/context/CaseContext';
import { EvidenceTimelineCard } from '@/components/proofpath';
import { useTranslation } from '@/context/LanguageContext';
import { apiCaseService } from '@/services/api-case-service';
import { ObservationProposal, Evidence, Observation } from '@/types/proofpath.types';

export default function EvidenceScreen() {
  const { t } = useTranslation();
  const {
    currentCase,
    availableCases,
    evidence,
    observations,
    claims,
    isLoading,
    uploadEvidenceToCase,
    addObservationToCase,
    linkClaimObservation,
    selectCase,
    refreshData,
  } = useCaseState();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  // Add Evidence modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
  const [textFileName, setTextFileName] = useState('');
  const [textContent, setTextContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Review Extracted Facts modal state
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedArtifactForReview, setSelectedArtifactForReview] = useState<Evidence | null>(null);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [proposals, setProposals] = useState<ObservationProposal[]>([]);
  const [proposalTargets, setProposalTargets] = useState<{ [index: number]: { claimId: string; relation: 'SUPPORTS' | 'CONTRADICTS' | 'CONTEXT' } }>({});
  const [editingProposalIdx, setEditingProposalIdx] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [proposalSuccess, setProposalSuccess] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [allSavedNotice, setAllSavedNotice] = useState(false);

  // Add Manual Fact modal state
  const [manualFactModalVisible, setManualFactModalVisible] = useState(false);
  const [targetArtifactForManual, setTargetArtifactForManual] = useState<Evidence | null>(null);
  const [manualField, setManualField] = useState('message_content');
  const [manualValue, setManualValue] = useState('');
  const [manualClaimId, setManualClaimId] = useState<string>('');
  const [manualRelation, setManualRelation] = useState<'SUPPORTS' | 'CONTRADICTS' | 'CONTEXT'>('SUPPORTS');
  const [isSavingManualFact, setIsSavingManualFact] = useState(false);
  const [manualFactError, setManualFactError] = useState<string | null>(null);
  const [manualFactSuccess, setManualFactSuccess] = useState(false);

  const caseId = currentCase?.id || 'case_demo_01';

  // Filtered and sorted evidence
  const filteredEvidence = useMemo(() => {
    return evidence.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sha256 && item.sha256.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = selectedType === 'all' || item.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [evidence, searchQuery, selectedType]);

  const sortedEvidence = useMemo(() => {
    return [...filteredEvidence].sort((a, b) => {
      const timeA = new Date(a.ingestedAt).getTime();
      const timeB = new Date(b.ingestedAt).getTime();
      return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [filteredEvidence, sortDirection]);

  // Upload helpers
  const handlePickDocument = async () => {
    try {
      setUploadError(null);
      const res = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'text/csv', 'application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) {
        return;
      }

      const asset = res.assets[0];
      setIsUploading(true);

      const fileObj = {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
        file: (asset as any).file,
      };

      const uploaded = await uploadEvidenceToCase(caseId, fileObj);
      setUploadSuccess(`Successfully saved ${uploaded.name}!`);
      setTimeout(() => {
        setUploadSuccess(null);
        setModalVisible(false);
        // Immediately show "Review details from this evidence" within the same flow
        const ext = uploaded.name.split('.').pop()?.toLowerCase();
        if (ext === 'txt' || ext === 'csv') {
          handleOpenReviewFacts(uploaded);
        } else {
          // If extraction is unsupported (e.g. PDF/image/unsupported), open manual entry with clear explanation
          handleOpenAddObservation(uploaded);
        }
      }, 700);
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err?.message || (err?.detail ? JSON.stringify(err.detail) : 'Failed to pick or upload document');
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      setUploadError(null);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setUploadError('Permission to access photos/media is required to upload images.');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) {
        return;
      }

      const asset = res.assets[0];
      setIsUploading(true);

      const filename = asset.fileName || `evidence_photo_${Date.now()}.jpg`;
      const fileObj = {
        uri: asset.uri,
        name: filename,
        type: asset.mimeType || 'image/jpeg',
        file: (asset as any).file,
      };

      const uploaded = await uploadEvidenceToCase(caseId, fileObj);
      setUploadSuccess(`Successfully saved ${uploaded.name}!`);
      setTimeout(() => {
        setUploadSuccess(null);
        setModalVisible(false);
        // Automatic text extraction does not run on image binaries; immediately offer manual detail review
        handleOpenAddObservation(uploaded);
      }, 700);
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err?.message || (err?.detail ? JSON.stringify(err.detail) : 'Failed to select or upload image');
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadTextNote = async () => {
    if (!textContent.trim()) {
      setUploadError('Please enter some text content to save.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      const cleanTitle = (textFileName.trim() || 'incident_statement')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_\-]/g, '_');
      const filename = `${cleanTitle}.txt`;

      let fileObj: any;
      if (Platform.OS === 'web' && typeof Blob !== 'undefined') {
        fileObj = new File([textContent], filename, { type: 'text/plain' });
      } else {
        // Data URI for React Native fetch / FormData
        const encodedData = encodeURIComponent(textContent);
        fileObj = {
          uri: `data:text/plain;charset=utf-8,${encodedData}`,
          name: filename,
          type: 'text/plain',
        };
      }

      const uploaded = await uploadEvidenceToCase(caseId, fileObj);
      setUploadSuccess(`Text file "${filename}" recorded and hashed!`);
      setTextContent('');
      setTextFileName('');
      setTimeout(() => {
        setUploadSuccess(null);
        setModalVisible(false);
        // Immediately offer review workflow for the newly created text evidence
        handleOpenReviewFacts(uploaded);
      }, 700);
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err?.message || (err?.detail ? JSON.stringify(err.detail) : 'Failed to upload text file');
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  // Review Facts Workflow
  const handleOpenReviewFacts = async (art: Evidence) => {
    setSelectedArtifactForReview(art);
    setProposals([]);
    setProposalTargets({});
    setEditingProposalIdx(null);
    setEditingValue('');
    setProposalError(null);
    setProposalSuccess(null);
    setSavedCount(0);
    setAllSavedNotice(false);
    setReviewModalVisible(true);
    setIsLoadingProposals(true);

    const targetCaseId = art.caseId || caseId;

    try {
      const res = await apiCaseService.proposeObservations(art.id, targetCaseId);
      const proposedList = res.proposed || [];
      setProposals(proposedList);
      
      // Filter claims to ensure they strictly belong to this case
      const caseClaims = claims.filter((c) => !c.id || (c as any).case_id === targetCaseId || (c as any).caseId === targetCaseId || targetCaseId === caseId);
      const defaultClaimId = caseClaims.length > 0 ? caseClaims[0].id : '';
      const initialTargets: { [idx: number]: { claimId: string; relation: 'SUPPORTS' | 'CONTRADICTS' | 'CONTEXT' } } = {};
      proposedList.forEach((_, idx) => {
        initialTargets[idx] = { claimId: defaultClaimId, relation: 'SUPPORTS' };
      });
      setProposalTargets(initialTargets);
    } catch (err: any) {
      setProposalError(err?.message || 'Failed to extract details from document.');
    } finally {
      setIsLoadingProposals(false);
    }
  };

  const handleSaveProposal = async (prop: ObservationProposal, idx: number) => {
    if (!selectedArtifactForReview) return;
    const targetCaseId = selectedArtifactForReview.caseId || caseId;
    const finalVal = editingProposalIdx === idx && editingValue.trim() ? editingValue.trim() : prop.value;
    try {
      setProposalError(null);
      // Create observation
      const obs = await addObservationToCase(
        targetCaseId,
        prop.field,
        finalVal,
        selectedArtifactForReview.id
      );
      // If a statement is selected, link it
      const target = proposalTargets[idx];
      if (target && target.claimId) {
        await linkClaimObservation(targetCaseId, target.claimId, obs.id, target.relation);
      }
      setProposalSuccess(`Saved detail: "${finalVal.slice(0, 40)}"`);
      await refreshData();
      setSavedCount((c) => c + 1);
      // Remove the proposal from the list once saved
      const remaining = proposals.filter((_, i) => i !== idx);
      setProposals(remaining);
      setEditingProposalIdx(null);
      setEditingValue('');
      if (remaining.length === 0) {
        setAllSavedNotice(true);
      }
    } catch (err: any) {
      setProposalError(err?.message || 'Failed to save detail.');
    }
  };

  // Manual Fact Entry Workflow
  const handleOpenAddObservation = (art: Evidence) => {
    setTargetArtifactForManual(art);
    setManualField('message_content');
    setManualValue('');
    setManualClaimId(claims.length > 0 ? claims[0].id : '');
    setManualRelation('SUPPORTS');
    setManualFactError(null);
    setManualFactSuccess(false);
    setManualFactModalVisible(true);
  };

  const handleSaveManualFact = async () => {
    if (!targetArtifactForManual) return;
    if (!manualValue.trim()) {
      setManualFactError('Please enter a detail value or observation text.');
      return;
    }
    setIsSavingManualFact(true);
    setManualFactError(null);
    try {
      const obs = await addObservationToCase(
        caseId,
        manualField,
        manualValue.trim(),
        targetArtifactForManual.id
      );
      if (manualClaimId) {
        await linkClaimObservation(caseId, manualClaimId, obs.id, manualRelation);
      }
      await refreshData();
      setManualFactSuccess(true);
    } catch (err: any) {
      setManualFactError(err?.message || 'Failed to record detail.');
    } finally {
      setIsSavingManualFact(false);
    }
  };

  const handleLinkObservation = async (
    obs: Observation,
    targetClaimId: string,
    relation: 'SUPPORTS' | 'CONTRADICTS' | 'CONTEXT'
  ) => {
    try {
      await linkClaimObservation(caseId, targetClaimId, obs.id, relation);
      await refreshData();
    } catch (err: any) {
      Alert.alert('Link Failed', err?.message || 'Could not link fact to claim.');
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
            <View style={styles.badgeRow}>
              <View style={styles.workspacePill}>
                <ThemedText style={styles.workspacePillText}>EVIDENCE REPOSITORY</ThemedText>
              </View>
              {availableCases.length > 1 ? (
                <View style={styles.casePickerRow}>
                  {availableCases.map((c) => {
                    const isSelected = c.id === caseId;
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
                          {c.title ? (c.title.length > 20 ? `${c.title.slice(0, 20)}...` : c.title) : c.id}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <ThemedText type="small" style={styles.caseBadge}>
                  {currentCase?.title || `Case #${caseId}`}
                </ThemedText>
              )}
            </View>
            <ThemedText type="title">{t.evidence.title}</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              Chronological log of uploaded digital artifacts, SHA-256 integrity digests, and linked factual observations for case record <ThemedText type="smallBold">"{currentCase?.title || caseId}"</ThemedText>.
            </ThemedText>
          </View>

          {/* Transparent Integrity Notice */}
          <ThemedView type="backgroundElement" style={styles.noticeBanner}>
            <ThemedText type="smallBold" style={styles.noticeBannerTitle}>
              🛡 INTEGRITY BOUNDARY NOTICE
            </ThemedText>
            <ThemedText type="small" style={styles.noticeBannerText}>
              ProofPath runs on-device SHA-256 hash checks to detect unexpected file modification. Passing hash validation establishes file consistency, but does not certify historical truth, intent, or legal admissibility.
            </ThemedText>
          </ThemedView>

          {/* Quick Action Banner to Add Evidence */}
          <ThemedView type="backgroundElement" style={styles.uploadCtaCard}>
            <View style={styles.uploadCtaInfo}>
              <ThemedText type="subtitle" style={styles.uploadCtaTitle}>
                Add Incident Evidence
              </ThemedText>
              <ThemedText type="small" style={styles.uploadCtaSub}>
                Upload photos, documents, or create a tamper-evident text statement with instant cryptographic hashing.
              </ThemedText>
            </View>
            <Pressable
              style={styles.openUploadBtn}
              onPress={() => {
                setUploadError(null);
                setUploadSuccess(null);
                setModalVisible(true);
              }}
            >
              <ThemedText style={styles.openUploadBtnText}>+ Add Evidence</ThemedText>
            </Pressable>
          </ThemedView>

          {/* Search, Filter, and Sorting Rail */}
          <ThemedView type="backgroundElement" style={styles.filterCard}>
            <View style={styles.searchRow}>
              <ThemedText style={styles.searchIcon}>🔍</ThemedText>
              <TextInput
                style={styles.searchInput}
                placeholder="Search artifacts by name, ID, or SHA-256..."
                placeholderTextColor={Colors.light.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                accessibilityLabel="Search artifacts"
              />
              {searchQuery.length > 0 ? (
                <Pressable onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                  <ThemedText style={styles.clearBtnText}>✕</ThemedText>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.filterControlsRow}>
              {/* Type Pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typePillScroll}>
                {['all', 'image', 'document', 'transcript', 'url', 'session'].map((tp) => {
                  const active = selectedType === tp;
                  return (
                    <Pressable
                      key={tp}
                      style={[styles.typePill, active && styles.typePillActive]}
                      onPress={() => setSelectedType(tp)}
                    >
                      <ThemedText
                        type="smallBold"
                        style={active ? styles.typePillTextActive : styles.typePillTextInactive}
                      >
                        {tp === 'all' ? 'All Types' : tp.charAt(0).toUpperCase() + tp.slice(1)}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Sort Toggle */}
              <View style={styles.sortButtonGroup}>
                <Pressable
                  style={[styles.sortButton, sortDirection === 'asc' && styles.sortButtonActive]}
                  onPress={() => setSortDirection('asc')}
                >
                  <ThemedText
                    type="smallBold"
                    style={sortDirection === 'asc' ? styles.sortTextActive : styles.sortTextInactive}
                  >
                    Oldest
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.sortButton, sortDirection === 'desc' && styles.sortButtonActive]}
                  onPress={() => setSortDirection('desc')}
                >
                  <ThemedText
                    type="smallBold"
                    style={sortDirection === 'desc' ? styles.sortTextActive : styles.sortTextInactive}
                  >
                    Newest
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </ThemedView>

          {/* Chronological Evidence Cards */}
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="smallBold" style={styles.sectionHeader}>
              EVIDENCE ARTIFACTS ({sortedEvidence.length} of {evidence.length})
            </ThemedText>
            <View style={styles.sectionActionButtons}>
              <Pressable
                style={styles.addEvidenceSmallBtn}
                onPress={() => {
                  setUploadError(null);
                  setUploadSuccess(null);
                  setModalVisible(true);
                }}
              >
                <ThemedText style={styles.addEvidenceSmallBtnText}>+ Add Evidence</ThemedText>
              </Pressable>
              <Pressable
                style={styles.addRecordBtn}
                onPress={() => router.push(`/incident/${caseId}`)}
              >
                <ThemedText style={styles.addRecordBtnText}>View Incident →</ThemedText>
              </Pressable>
            </View>
          </View>

          {isLoading ? (
            <ThemedText style={styles.loadingText}>Loading evidence timeline...</ThemedText>
          ) : sortedEvidence.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <ThemedText type="subtitle" style={styles.emptyTitle}>
                No artifacts match your filter
              </ThemedText>
              <ThemedText type="small" style={styles.emptyDesc}>
                Try adjusting your search query or type filter to view recorded evidence.
              </ThemedText>
              <Pressable
                style={styles.emptyAddBtn}
                onPress={() => {
                  setUploadError(null);
                  setUploadSuccess(null);
                  setModalVisible(true);
                }}
              >
                <ThemedText style={styles.emptyAddBtnText}>+ Add First Evidence Artifact</ThemedText>
              </Pressable>
            </ThemedView>
          ) : (
            sortedEvidence.map((item, idx) => {
              const linkedObs = observations.filter((obs) => obs.evidenceId === item.id);
              return (
                <EvidenceTimelineCard
                  key={item.id}
                  evidence={item}
                  observations={linkedObs}
                  claims={claims}
                  stepNumber={idx + 1}
                  isFirst={idx === 0}
                  isLast={idx === sortedEvidence.length - 1}
                  onAddObservation={handleOpenAddObservation}
                  onReviewFacts={handleOpenReviewFacts}
                  onLinkObservationToClaim={handleLinkObservation}
                />
              );
            })
          )}

          {/* Obvious Next Action Card */}
          <ThemedView type="backgroundElement" style={styles.nextActionCard}>
            <ThemedText type="tag" style={styles.nextActionTag}>
              NEXT WORKFLOW STEP
            </ThemedText>
            <ThemedText type="subtitle" style={styles.nextActionTitle}>
              Simulate Claim Consistency in Time Machine
            </ThemedText>
            <ThemedText type="small" style={styles.nextActionDesc}>
              Discover how conclusions hold up if a key piece of evidence is missing or contested.
            </ThemedText>
            <Pressable
              style={styles.nextActionButton}
              onPress={() => router.push('/time-machine')}
            >
              <ThemedText type="smallBold" style={styles.nextActionButtonText}>
                Open Time Machine & Analysis →
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ScrollView>

        {/* Modal: Add Evidence Artifact (Image, File, Text) */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <ThemedView type="backgroundElement" style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <ThemedText type="subtitle" style={styles.modalTitle}>
                    Add Evidence Artifact
                  </ThemedText>
                  <ThemedText type="small" style={styles.modalSubtitle}>
                    Stored in private encrypted vault with SHA-256 integrity hash.
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => !isUploading && setModalVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <ThemedText style={styles.modalCloseText}>✕</ThemedText>
                </Pressable>
              </View>

              {/* Mode switch */}
              <View style={styles.modeTabsRow}>
                <Pressable
                  style={[styles.modeTab, uploadMode === 'file' && styles.modeTabActive]}
                  onPress={() => setUploadMode('file')}
                >
                  <ThemedText
                    type="smallBold"
                    style={uploadMode === 'file' ? styles.modeTabTextActive : styles.modeTabTextInactive}
                  >
                    📁 Upload File / Image
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.modeTab, uploadMode === 'text' && styles.modeTabActive]}
                  onPress={() => setUploadMode('text')}
                >
                  <ThemedText
                    type="smallBold"
                    style={uploadMode === 'text' ? styles.modeTabTextActive : styles.modeTabTextInactive}
                  >
                    📝 Write Text Statement
                  </ThemedText>
                </Pressable>
              </View>

              {uploadError ? (
                <View style={styles.errorNotice}>
                  <ThemedText type="smallBold" style={styles.errorNoticeText}>
                    ⚠ {uploadError}
                  </ThemedText>
                </View>
              ) : null}

              {uploadSuccess ? (
                <View style={styles.successNotice}>
                  <ThemedText type="smallBold" style={styles.successNoticeText}>
                    ✓ {uploadSuccess}
                  </ThemedText>
                </View>
              ) : null}

              {uploadMode === 'file' ? (
                <View style={styles.fileOptionsArea}>
                  <Pressable
                    style={[styles.actionOptionCard, isUploading && styles.disabledCard]}
                    onPress={handlePickImage}
                    disabled={isUploading}
                  >
                    <View style={styles.actionIconCircle}>
                      <ThemedText style={styles.actionIcon}>🖼</ThemedText>
                    </View>
                    <View style={styles.actionOptionTextCol}>
                      <ThemedText type="smallBold" style={styles.actionOptionTitle}>
                        Choose Image / Screenshot
                      </ThemedText>
                      <ThemedText type="small" style={styles.actionOptionDesc}>
                        Select PNG or JPEG photos from gallery or files.
                      </ThemedText>
                    </View>
                  </Pressable>

                  <Pressable
                    style={[styles.actionOptionCard, isUploading && styles.disabledCard]}
                    onPress={handlePickDocument}
                    disabled={isUploading}
                  >
                    <View style={styles.actionIconCircle}>
                      <ThemedText style={styles.actionIcon}>📄</ThemedText>
                    </View>
                    <View style={styles.actionOptionTextCol}>
                      <ThemedText type="smallBold" style={styles.actionOptionTitle}>
                        Choose Document / Text File
                      </ThemedText>
                      <ThemedText type="small" style={styles.actionOptionDesc}>
                        Upload PDF, TXT, or CSV logs directly from your device.
                      </ThemedText>
                    </View>
                  </Pressable>

                  {isUploading && (
                    <View style={styles.uploadingIndicatorRow}>
                      <ActivityIndicator size="small" color={BrandColors.indigo} />
                      <ThemedText type="small" style={styles.uploadingText}>
                        Hashing and registering artifact in vault...
                      </ThemedText>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.textInputArea}>
                  <ThemedText type="smallBold" style={styles.inputLabel}>
                    STATEMENT OR FILE NAME
                  </ThemedText>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. incident_summary_log"
                    placeholderTextColor={Colors.light.textMuted}
                    value={textFileName}
                    onChangeText={setTextFileName}
                    editable={!isUploading}
                  />

                  <ThemedText type="smallBold" style={styles.inputLabel}>
                    EVIDENCE TEXT / NOTES CONTENT *
                  </ThemedText>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Enter factual statements, email excerpts, or notes to save as an immutable text artifact..."
                    placeholderTextColor={Colors.light.textMuted}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    value={textContent}
                    onChangeText={setTextContent}
                    editable={!isUploading}
                  />

                  <Pressable
                    style={[styles.submitTextBtn, isUploading && styles.disabledBtn]}
                    onPress={handleUploadTextNote}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <ThemedText type="smallBold" style={styles.submitTextBtnLabel}>
                        Save as Text Evidence File (.txt)
                      </ThemedText>
                    )}
                  </Pressable>
                </View>
              )}
            </ThemedView>
          </View>
        </Modal>

        {/* Modal: Review Extracted Facts */}
        <Modal
          visible={reviewModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setReviewModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <ThemedView type="backgroundElement" style={[styles.modalContent, styles.largeModalContent]}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="subtitle" style={styles.modalTitle}>
                    ⚡ Review What Happened
                  </ThemedText>
                  <ThemedText type="small" style={styles.modalSubtitle}>
                    Evidence: {selectedArtifactForReview?.name} (Verified tamper-free)
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => setReviewModalVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <ThemedText style={styles.modalCloseText}>✕</ThemedText>
                </Pressable>
              </View>

              {proposalError ? (
                <View style={styles.errorNotice}>
                  <ThemedText type="smallBold" style={styles.errorNoticeText}>
                    ⚠ {proposalError}
                  </ThemedText>
                </View>
              ) : null}

              {proposalSuccess ? (
                <View style={styles.successNotice}>
                  <ThemedText type="smallBold" style={styles.successNoticeText}>
                    ✓ {proposalSuccess}
                  </ThemedText>
                </View>
              ) : null}

              {isLoadingProposals ? (
                <View style={styles.loadingProposalsArea}>
                  <ActivityIndicator size="large" color={BrandColors.indigo} />
                  <ThemedText type="smallBold" style={styles.loadingProposalsText}>
                    Reading dates and text details from this evidence...
                  </ThemedText>
                </View>
              ) : allSavedNotice || proposals.length === 0 ? (
                <View style={styles.completedReviewCard}>
                  <ThemedText style={styles.completedReviewIcon}>✓</ThemedText>
                  <ThemedText type="subtitle" style={styles.completedReviewTitle}>
                    Your evidence has been added to your record.
                  </ThemedText>
                  <ThemedText type="small" style={styles.completedReviewDesc}>
                    {savedCount > 0
                      ? `${savedCount} detail(s) have been verified and securely connected to your case timeline.`
                      : 'This evidence file is safely registered in your private vault.'}
                  </ThemedText>
                  <Pressable
                    style={styles.reviewRecordPrimaryBtn}
                    onPress={() => {
                      setReviewModalVisible(false);
                      router.push(`/incident/${caseId}` as any);
                    }}
                  >
                    <ThemedText style={styles.reviewRecordPrimaryBtnText}>
                      Review my record →
                    </ThemedText>
                  </Pressable>
                </View>
              ) : (
                <ScrollView style={styles.proposalsScroll} showsVerticalScrollIndicator={true}>
                  <ThemedText type="small" style={styles.reviewInstructionNotice}>
                    Review details found in this evidence below. You can confirm, edit, or connect each detail to a statement. ProofPath never automatically asserts extracted text as true without your review.
                  </ThemedText>

                  {proposals.map((prop, idx) => {
                    const currentTarget = proposalTargets[idx] || { claimId: claims[0]?.id || '', relation: 'SUPPORTS' };
                    const isEditing = editingProposalIdx === idx;
                    return (
                      <View key={`${prop.field}_${idx}`} style={styles.proposalItemCard}>
                        <View style={styles.proposalTopRow}>
                          <View style={styles.proposalBadge}>
                            <ThemedText style={styles.proposalBadgeText}>{prop.field.replace('_', ' ').toUpperCase()}</ThemedText>
                          </View>
                          <Pressable
                            onPress={() => {
                              if (isEditing) {
                                setEditingProposalIdx(null);
                              } else {
                                setEditingProposalIdx(idx);
                                setEditingValue(prop.value);
                              }
                            }}
                            style={styles.editDetailBtn}
                          >
                            <ThemedText style={styles.editDetailBtnText}>
                              {isEditing ? 'Cancel Edit' : '✏ Edit text'}
                            </ThemedText>
                          </Pressable>
                        </View>

                        {isEditing ? (
                          <View style={styles.editDetailInputBox}>
                            <TextInput
                              style={styles.editDetailInput}
                              value={editingValue}
                              onChangeText={setEditingValue}
                              multiline
                            />
                            <ThemedText type="small" style={styles.editHintText}>
                              Adjust wording or timestamp if needed before saving.
                            </ThemedText>
                          </View>
                        ) : (
                          <ThemedText style={styles.proposalValueText}>
                            "{prop.value}"
                          </ThemedText>
                        )}

                        {prop.excerpt ? (
                          <ThemedText type="small" style={styles.proposalExcerpt}>
                            Found in text: "{prop.excerpt}"
                          </ThemedText>
                        ) : null}

                        {/* Statement selector & relation */}
                        {claims.length > 0 && (
                          <View style={styles.proposalTargetBox}>
                            <ThemedText type="smallBold" style={styles.targetBoxLabel}>
                              CONNECT TO A STATEMENT:
                            </ThemedText>
                            <View style={styles.claimsPillsRow}>
                              {claims.map((clm) => {
                                const isSelected = currentTarget.claimId === clm.id;
                                return (
                                  <Pressable
                                    key={clm.id}
                                    style={[styles.claimPill, isSelected && styles.claimPillActive]}
                                    onPress={() =>
                                      setProposalTargets((prev) => ({
                                        ...prev,
                                        [idx]: { ...currentTarget, claimId: clm.id },
                                      }))
                                    }
                                  >
                                    <ThemedText
                                      style={isSelected ? styles.claimPillTextActive : styles.claimPillText}
                                      numberOfLines={1}
                                    >
                                      {clm.text}
                                    </ThemedText>
                                  </Pressable>
                                );
                              })}
                            </View>

                            <ThemedText type="smallBold" style={[styles.targetBoxLabel, { marginTop: 8 }]}>
                              HOW DOES THIS DETAIL RELATE?
                            </ThemedText>
                            <View style={styles.relationPillsCol}>
                              {(
                                [
                                  { rel: 'SUPPORTS', label: '✓ Supports this statement', desc: 'Confirms that this statement occurred' },
                                  { rel: 'CONTRADICTS', label: "✕ Doesn't match this statement", desc: 'Shows a different date, sender, or story that clashes' },
                                  { rel: 'CONTEXT', label: 'ℹ Adds background information', desc: 'Helpful context that does not prove or disprove' },
                                ] as const
                              ).map((item) => {
                                const isRelSelected = currentTarget.relation === item.rel;
                                return (
                                  <Pressable
                                    key={item.rel}
                                    style={[
                                      styles.relChoiceRow,
                                      isRelSelected && styles.relChoiceRowActive,
                                      item.rel === 'SUPPORTS' && isRelSelected && styles.relChoiceRowSupport,
                                      item.rel === 'CONTRADICTS' && isRelSelected && styles.relChoiceRowConflict,
                                      item.rel === 'CONTEXT' && isRelSelected && styles.relChoiceRowContext,
                                    ]}
                                    onPress={() =>
                                      setProposalTargets((prev) => ({
                                        ...prev,
                                        [idx]: { ...currentTarget, relation: item.rel },
                                      }))
                                    }
                                  >
                                    <View style={styles.relRadioCircle}>
                                      {isRelSelected ? <View style={styles.relRadioDot} /> : null}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                      <ThemedText
                                        style={[
                                          styles.relChoiceLabel,
                                          isRelSelected && styles.relChoiceLabelActive,
                                        ]}
                                      >
                                        {item.label}
                                      </ThemedText>
                                      <ThemedText type="small" style={styles.relChoiceDesc}>
                                        {item.desc}
                                      </ThemedText>
                                    </View>
                                  </Pressable>
                                );
                              })}
                            </View>
                          </View>
                        )}

                        <Pressable
                          style={styles.saveProposalBtn}
                          onPress={() => handleSaveProposal(prop, idx)}
                        >
                          <ThemedText style={styles.saveProposalBtnText}>
                            Save detail to record →
                          </ThemedText>
                        </Pressable>
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </ThemedView>
          </View>
        </Modal>

        {/* Modal: Add Manual Fact */}
        <Modal
          visible={manualFactModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setManualFactModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <ThemedView type="backgroundElement" style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="subtitle" style={styles.modalTitle}>
                    📝 Review & Record Detail
                  </ThemedText>
                  <ThemedText type="small" style={styles.modalSubtitle}>
                    Evidence: {targetArtifactForManual?.name}
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => !isSavingManualFact && setManualFactModalVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <ThemedText style={styles.modalCloseText}>✕</ThemedText>
                </Pressable>
              </View>

              {/* Extraction explanation banner */}
              <View style={styles.unsupportedExtractionNotice}>
                <ThemedText type="smallBold" style={styles.unsupportedExtractionTitle}>
                  ℹ️ Why manual entry?
                </ThemedText>
                <ThemedText type="small" style={styles.unsupportedExtractionText}>
                  Automatic key-value extraction is only supported for plain text (.txt, .csv) logs. For images, PDFs, or photos, ProofPath never guesses or fabricates text. Enter the detail you want recorded from this evidence below.
                </ThemedText>
              </View>

              {manualFactError ? (
                <View style={styles.errorNotice}>
                  <ThemedText type="smallBold" style={styles.errorNoticeText}>
                    ⚠ {manualFactError}
                  </ThemedText>
                </View>
              ) : null}

              {manualFactSuccess ? (
                <View style={styles.completedReviewCard}>
                  <ThemedText style={styles.completedReviewIcon}>✓</ThemedText>
                  <ThemedText type="subtitle" style={styles.completedReviewTitle}>
                    Your evidence has been added to your record.
                  </ThemedText>
                  <ThemedText type="small" style={styles.completedReviewDesc}>
                    Detail recorded and linked securely to your case timeline.
                  </ThemedText>
                  <Pressable
                    style={styles.reviewRecordPrimaryBtn}
                    onPress={() => {
                      setManualFactModalVisible(false);
                      router.push(`/incident/${caseId}` as any);
                    }}
                  >
                    <ThemedText style={styles.reviewRecordPrimaryBtnText}>
                      Review my record →
                    </ThemedText>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.textInputArea}>
                  <ThemedText type="smallBold" style={styles.inputLabel}>
                    DETAIL TYPE / FIELD
                  </ThemedText>
                  <View style={styles.fieldPickerRow}>
                    {[
                      { label: 'Date / Time', value: 'timestamp' },
                      { label: 'Sender / Person', value: 'sender' },
                      { label: 'Message or Action', value: 'message_content' },
                      { label: 'Platform / App', value: 'platform' },
                    ].map((f) => {
                      const isSelected = manualField === f.value;
                      return (
                        <Pressable
                          key={f.value}
                          style={[styles.fieldPickerPill, isSelected && styles.fieldPickerPillActive]}
                          onPress={() => setManualField(f.value)}
                        >
                          <ThemedText style={isSelected ? styles.fieldPickerTextActive : styles.fieldPickerText}>
                            {f.label}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>

                  <ThemedText type="smallBold" style={styles.inputLabel}>
                    DETAIL VALUE / WHAT HAPPENED *
                  </ThemedText>
                  <TextInput
                    style={styles.textArea}
                    placeholder="e.g. 2026-10-18 10:20 AM or exact text recorded in screenshot..."
                    placeholderTextColor={Colors.light.textMuted}
                    multiline
                    numberOfLines={3}
                    value={manualValue}
                    onChangeText={setManualValue}
                    editable={!isSavingManualFact}
                  />

                  {claims.length > 0 && (
                    <View style={styles.proposalTargetBox}>
                      <ThemedText type="smallBold" style={styles.targetBoxLabel}>
                        CONNECT TO A STATEMENT:
                      </ThemedText>
                      <View style={styles.claimsPillsRow}>
                        {claims.map((clm) => {
                          const isSelected = manualClaimId === clm.id;
                          return (
                            <Pressable
                              key={clm.id}
                              style={[styles.claimPill, isSelected && styles.claimPillActive]}
                              onPress={() => setManualClaimId(isSelected ? '' : clm.id)}
                            >
                              <ThemedText
                                style={isSelected ? styles.claimPillTextActive : styles.claimPillText}
                                numberOfLines={1}
                              >
                                {clm.text}
                              </ThemedText>
                            </Pressable>
                          );
                        })}
                      </View>

                      {manualClaimId ? (
                        <>
                          <ThemedText type="smallBold" style={[styles.targetBoxLabel, { marginTop: 8 }]}>
                            HOW DOES THIS DETAIL RELATE?
                          </ThemedText>
                          <View style={styles.relationPillsCol}>
                            {(
                              [
                                { rel: 'SUPPORTS', label: '✓ Supports this statement', desc: 'Confirms that this statement occurred' },
                                { rel: 'CONTRADICTS', label: "✕ Doesn't match this statement", desc: 'Shows a different date, sender, or story that clashes' },
                                { rel: 'CONTEXT', label: 'ℹ Adds background information', desc: 'Helpful context that does not prove or disprove' },
                              ] as const
                            ).map((item) => {
                              const isRelSelected = manualRelation === item.rel;
                              return (
                                <Pressable
                                  key={item.rel}
                                  style={[
                                    styles.relChoiceRow,
                                    isRelSelected && styles.relChoiceRowActive,
                                    item.rel === 'SUPPORTS' && isRelSelected && styles.relChoiceRowSupport,
                                    item.rel === 'CONTRADICTS' && isRelSelected && styles.relChoiceRowConflict,
                                    item.rel === 'CONTEXT' && isRelSelected && styles.relChoiceRowContext,
                                  ]}
                                  onPress={() => setManualRelation(item.rel)}
                                >
                                  <View style={styles.relRadioCircle}>
                                    {isRelSelected ? <View style={styles.relRadioDot} /> : null}
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <ThemedText
                                      style={[
                                        styles.relChoiceLabel,
                                        isRelSelected && styles.relChoiceLabelActive,
                                      ]}
                                    >
                                      {item.label}
                                    </ThemedText>
                                    <ThemedText type="small" style={styles.relChoiceDesc}>
                                      {item.desc}
                                    </ThemedText>
                                  </View>
                                </Pressable>
                              );
                            })}
                          </View>
                        </>
                      ) : null}
                    </View>
                  )}

                  <Pressable
                    style={[styles.submitTextBtn, isSavingManualFact && styles.disabledBtn]}
                    onPress={handleSaveManualFact}
                    disabled={isSavingManualFact}
                  >
                    {isSavingManualFact ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <ThemedText type="smallBold" style={styles.submitTextBtnLabel}>
                        Save detail to record →
                      </ThemedText>
                    )}
                  </Pressable>
                </View>
              )}
            </ThemedView>
          </View>
        </Modal>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
    gap: 16,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
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
    marginBottom: 4,
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
    fontWeight: '500',
  },
  subtitle: {
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  noticeBanner: {
    backgroundColor: BrandColors.tealLight,
    borderWidth: 1,
    borderColor: BrandColors.tealBorder,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  noticeBannerTitle: {
    color: BrandColors.teal,
    letterSpacing: 0.5,
  },
  noticeBannerText: {
    color: '#0F766E',
    lineHeight: 18,
  },
  filterCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 14,
    gap: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    outlineStyle: 'none' as any,
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  filterControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  typePillScroll: {
    flexGrow: 0,
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    backgroundColor: Colors.light.backgroundSubtle,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  typePillActive: {
    backgroundColor: BrandColors.indigo,
    borderColor: BrandColors.indigo,
  },
  typePillTextActive: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  typePillTextInactive: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  sortButtonGroup: {
    flexDirection: 'row',
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sortButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sortButtonActive: {
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' ? { boxShadow: '0 1px 2px rgba(0,0,0,0.05)' } : { elevation: 1 }),
  },
  sortTextActive: {
    fontSize: 12,
    color: BrandColors.indigo,
  },
  sortTextInactive: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sectionHeader: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  addRecordBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  addRecordBtnText: {
    fontSize: 13,
    color: BrandColors.indigo,
    fontWeight: '600',
  },
  loadingText: {
    paddingVertical: 20,
    textAlign: 'center',
    color: Colors.light.textSecondary,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    color: Colors.light.text,
  },
  emptyDesc: {
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  nextActionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BrandColors.indigoBorder,
    backgroundColor: BrandColors.indigoLight,
    padding: 20,
    gap: 8,
    marginTop: 16,
  },
  nextActionTag: {
    color: BrandColors.indigo,
  },
  nextActionTitle: {
    color: Colors.light.text,
    fontSize: 17,
  },
  nextActionDesc: {
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  nextActionButton: {
    alignSelf: 'flex-start',
    backgroundColor: BrandColors.indigo,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  nextActionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  /* Upload CTA & Action Buttons */
  uploadCtaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BrandColors.indigoBorder,
    backgroundColor: BrandColors.indigoLight,
    gap: 12,
  },
  uploadCtaInfo: {
    flex: 1,
    gap: 4,
  },
  uploadCtaTitle: {
    color: BrandColors.indigo,
    fontSize: 15,
    fontWeight: '700',
  },
  uploadCtaSub: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  openUploadBtn: {
    backgroundColor: BrandColors.indigo,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    alignSelf: 'center',
  },
  openUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addEvidenceSmallBtn: {
    backgroundColor: BrandColors.indigo,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addEvidenceSmallBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyAddBtn: {
    marginTop: 8,
    backgroundColor: BrandColors.indigo,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  modalSubtitle: {
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: Colors.light.border,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  modeTabsRow: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: Colors.light.border,
    padding: 3,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeTabTextActive: {
    color: BrandColors.indigo,
    fontSize: 13,
  },
  modeTabTextInactive: {
    color: Colors.light.textSecondary,
    fontSize: 13,
  },
  errorNotice: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
    padding: 10,
    borderRadius: 8,
  },
  errorNoticeText: {
    color: '#991B1B',
    fontSize: 12,
  },
  successNotice: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#4ADE80',
    padding: 10,
    borderRadius: 8,
  },
  successNoticeText: {
    color: '#166534',
    fontSize: 12,
  },
  fileOptionsArea: {
    gap: 12,
    marginTop: 4,
  },
  actionOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    gap: 14,
  },
  disabledCard: {
    opacity: 0.6,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BrandColors.indigoLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 22,
  },
  actionOptionTextCol: {
    flex: 1,
    gap: 2,
  },
  actionOptionTitle: {
    fontSize: 14,
    color: Colors.light.text,
  },
  actionOptionDesc: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  uploadingIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  uploadingText: {
    color: BrandColors.indigo,
    fontWeight: '600',
  },
  textInputArea: {
    gap: 10,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    color: Colors.light.textSecondary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
    minHeight: 110,
  },
  submitTextBtn: {
    backgroundColor: BrandColors.indigo,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitTextBtnLabel: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  disabledBtn: {
    opacity: 0.6,
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
  largeModalContent: {
    maxHeight: '90%',
  },
  loadingProposalsArea: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 12,
  },
  loadingProposalsText: {
    color: BrandColors.indigo,
    fontSize: 13,
  },
  emptyProposalsArea: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 10,
  },
  emptyProposalsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  emptyProposalsSub: {
    textAlign: 'center',
    color: Colors.light.textSecondary,
    maxWidth: 320,
    lineHeight: 18,
  },
  switchManualBtn: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: BrandColors.indigo,
  },
  switchManualBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  proposalsScroll: {
    marginTop: 8,
    maxHeight: 460,
  },
  reviewInstructionNotice: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    color: '#1E40AF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    lineHeight: 16,
  },
  proposalItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  proposalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  proposalBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  proposalBadgeText: {
    color: '#6D28D9',
    fontSize: 11,
    fontWeight: '800',
  },
  proposalConfidence: {
    color: '#16A34A',
    fontSize: 11,
  },
  proposalValueText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  proposalExcerpt: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  proposalTargetBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 8,
    gap: 4,
  },
  targetBoxLabel: {
    fontSize: 10,
    color: '#475569',
    letterSpacing: 0.5,
  },
  claimsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  claimPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    maxWidth: 240,
  },
  claimPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  claimPillText: {
    fontSize: 11,
    color: '#475569',
  },
  claimPillTextActive: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '700',
  },
  relationPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  relPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  relPillSupportActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  relPillConflictActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  relPillContextActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  relPillText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  relPillTextSelected: {
    color: '#0F172A',
    fontWeight: '700',
  },
  saveProposalBtn: {
    backgroundColor: BrandColors.indigo,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  saveProposalBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  fieldPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  fieldPickerPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  fieldPickerPillActive: {
    backgroundColor: BrandColors.indigoLight,
    borderColor: BrandColors.indigo,
  },
  fieldPickerText: {
    fontSize: 12,
    color: '#475569',
  },
  fieldPickerTextActive: {
    fontSize: 12,
    color: BrandColors.indigo,
    fontWeight: '700',
  },
  relHelpText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 4,
  },
  completedReviewCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    padding: 24,
    alignItems: 'center',
    gap: 12,
    marginVertical: 12,
  },
  completedReviewIcon: {
    fontSize: 32,
    color: '#16A34A',
    fontWeight: '800',
    backgroundColor: '#DCFCE7',
    width: 52,
    height: 52,
    borderRadius: 26,
    textAlign: 'center',
    lineHeight: 50,
  },
  completedReviewTitle: {
    color: '#166534',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  completedReviewDesc: {
    color: '#15803D',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  reviewRecordPrimaryBtn: {
    backgroundColor: BrandColors.indigo,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 6,
    shadowColor: BrandColors.indigo,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewRecordPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  editDetailBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  editDetailBtnText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  editDetailInputBox: {
    gap: 4,
    marginVertical: 4,
  },
  editDetailInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: BrandColors.indigo,
    borderRadius: 6,
    padding: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  editHintText: {
    fontSize: 11,
    color: '#64748B',
  },
  relationPillsCol: {
    gap: 6,
    marginTop: 4,
  },
  relChoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
  },
  relChoiceRowActive: {
    borderWidth: 1.5,
  },
  relChoiceRowSupport: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
  },
  relChoiceRowConflict: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  relChoiceRowContext: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  relRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  relRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandColors.indigo,
  },
  relChoiceLabel: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  relChoiceLabelActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  relChoiceDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  unsupportedExtractionNotice: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 10,
    gap: 4,
    marginVertical: 6,
  },
  unsupportedExtractionTitle: {
    fontSize: 12,
    color: '#1D4ED8',
  },
  unsupportedExtractionText: {
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 16,
  },
});
