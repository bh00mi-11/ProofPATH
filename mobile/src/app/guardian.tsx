import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  TextInput,
  Text,
  Linking,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { API_BASE_URL } from '@/services/api-case-service';
import { useTranslation } from '@/context/LanguageContext';
import { safeBack } from '@/utils/navigation';

interface GuardianContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

interface GuardianAlert {
  id: string;
  contact_name: string;
  phone: string;
  channel: string;
  delivery_status: string;
  explanation: string;
}

interface ActiveSession {
  id: string;
  status: string;
  incident_note?: string;
  started_at: string;
  selected_contacts: string[];
  alerts?: GuardianAlert[];
}

export default function GuardianScreen() {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<GuardianContact[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRel, setNewRel] = useState('Trusted Contact');
  const [incidentNote, setIncidentNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedContactsForSession, setSelectedContactsForSession] = useState<string[]>([]);
  const [showAddContactForm, setShowAddContactForm] = useState(false);

  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isHostedDemo = Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app');

  const fetchContactsAndSession = useCallback(async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/guardian/contacts`).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/guardian/sessions/active`).then((r) => r.json()),
      ]);
      if (cRes.contacts) setContacts(cRes.contacts);
      if (sRes.session) {
        setActiveSession(sRes.session);
        setSelectedContactsForSession(sRes.session.selected_contacts || []);
      } else {
        setActiveSession(null);
      }
    } catch {
      setStatusMessage('FastAPI backend offline or unreachable.');
    }
  }, []);

  useEffect(() => {
    fetchContactsAndSession();
  }, [fetchContactsAndSession]);

  const handleAddContact = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      setStatusMessage('Please enter contact name and phone number.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/guardian/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), phone: newPhone.trim(), relationship: newRel.trim() }),
      });
      if (res.ok) {
        setNewName('');
        setNewPhone('');
        setStatusMessage('Trusted contact added.');
        await fetchContactsAndSession();
      }
    } catch {
      setStatusMessage('Failed to save contact.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/guardian/contacts/${id}`, { method: 'DELETE' });
      setStatusMessage('Contact removed.');
      await fetchContactsAndSession();
    } catch {
      setStatusMessage('Failed to delete contact.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async () => {
    if (contacts.length === 0) {
      setStatusMessage('Please add at least one trusted contact first.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/guardian/sessions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_note: incidentNote.trim() || 'Active safety check-in',
          selected_contacts: selectedContactsForSession.length > 0 ? selectedContactsForSession : contacts.map((c) => c.id),
        }),
      });
      if (res.ok) {
        setIncidentNote('');
        setStatusMessage('Safety session started.');
        await fetchContactsAndSession();
      }
    } catch {
      setStatusMessage('Could not start safety session.');
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/guardian/sessions/${activeSession.id}/end`, {
        method: 'POST',
      });
      if (res.ok) {
        setStatusMessage('Safety session ended.');
        await fetchContactsAndSession();
      }
    } catch {
      setStatusMessage('Could not end session.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSOS = async () => {
    if (!activeSession) {
      setStatusMessage('Start an active session before triggering SOS.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/guardian/sessions/${activeSession.id}/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: activeSession.id, share_channel: 'MANUAL_SHARE' }),
      });
      if (res.ok) {
        const data = await res.json();
        setStatusMessage(`SOS recorded: ${data.alerts?.length || 0} attempts. No delivery is confirmed. For emergencies, call 112 directly.`);
        await fetchContactsAndSession();
      }
    } catch {
      setStatusMessage('SOS request failed.');
    } finally {
      setLoading(false);
    }
  };

  const confirmSOS = () => {
    if (Platform.OS === 'web') {
      setStatusMessage('SOS records are manual-only. Use Guardian Mode on your phone to confirm an attempt. Call 112 directly in an emergency.');
      return;
    }
    Alert.alert('Record an SOS attempt?', 'This logs an alert attempt only. It does not confirm SMS delivery, dispatch police, or share live location.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Record attempt', onPress: handleTriggerSOS },
    ]);
  };

  const handleCall112 = () => {
    Linking.openURL('tel:112').catch(() => {
      alert('Direct National Emergency Number: 112');
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
            <Pressable onPress={() => safeBack('/')} style={styles.backButton}>
              <ThemedText type="smallBold" style={styles.backButtonText}>
                ← {t.common.backToOverview}
              </ThemedText>
            </Pressable>
            <View style={styles.badgeRow}>
              <View style={styles.workspacePill}>
                <ThemedText style={styles.workspacePillText}>SAFETY CONTINUITY</ThemedText>
              </View>
              <ThemedText type="small" style={styles.caseBadge}>
                Guardian Mode
              </ThemedText>
            </View>
            <ThemedText type="title">{t.guardian.title}</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              {t.guardian.subtitle}
            </ThemedText>
          </View>

          {/* Honest Transparency Notice Banner */}
          <ThemedView type="backgroundElement" style={styles.disclaimerBanner}>
            <ThemedText type="smallBold" style={styles.disclaimerTitle}>
              🛡 SAFETY NOTICE & DISPATCH LIMITATIONS
            </ThemedText>
            <ThemedText type="small" style={styles.disclaimerBody}>
              ProofPath records safety sessions and generates manual SOS alerts honestly marked as "ATTEMPTED". ProofPath does NOT perform automated police dispatch, background cellular tracking, or unconfirmed carrier SMS delivery. In immediate physical danger, dial 112 directly.
            </ThemedText>
          </ThemedView>

          {statusMessage ? (
            <View style={styles.messageBox}>
              <ThemedText style={styles.messageText}>{statusMessage}</ThemedText>
            </View>
          ) : null}

          {/* 1. National Emergency 112 Shortcut */}
          <ThemedView type="backgroundElement" style={styles.cardEmergency}>
            <View style={styles.emergencyTop}>
              <View style={styles.emergencyBadge}>
                <ThemedText style={styles.emergencyBadgeText}>INDIA NATIONAL EMERGENCY</ThemedText>
              </View>
              <ThemedText style={styles.emergencyHelpline}>Direct Line: 112</ThemedText>
            </View>
            <ThemedText type="small" style={styles.emergencyDesc}>
              {t.guardian.nationalEmergencyDesc}
            </ThemedText>
            <Pressable onPress={handleCall112} style={styles.emergency112Button}>
              <ThemedText style={styles.emergency112ButtonText}>
                {t.guardian.call112Button}
              </ThemedText>
            </Pressable>
          </ThemedView>

          {isHostedDemo ? (
            <ThemedView type="backgroundElement" style={styles.disclaimerBanner}>
              <ThemedText type="smallBold" style={styles.disclaimerTitle}>DEMO ONLY: NO CONTACT OR SOS STORAGE</ThemedText>
              <ThemedText type="small" style={styles.disclaimerBody}>
                This hosted preview uses fictional records and cannot save real contacts, start safety sessions or send emergency alerts. Use the 112 phone shortcut above in an emergency.
              </ThemedText>
            </ThemedView>
          ) : (
          <>
          {/* 2. Safety Session Control */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <ThemedText type="subtitle" style={styles.cardTitle}>
                {t.guardian.sessionLifecycleTitle}
              </ThemedText>
              {activeSession ? (
                <View style={styles.activePill}>
                  <ThemedText style={styles.activePillText}>● ACTIVE SESSION</ThemedText>
                </View>
              ) : null}
            </View>

            {activeSession ? (
              <View style={styles.sessionActiveBox}>
                <ThemedText type="default" style={styles.sessionNoteText}>
                  Note: {activeSession.incident_note || 'Safety check-in active'}
                </ThemedText>
                <ThemedText type="small" style={styles.dimText}>
                  Started at {new Date(activeSession.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Session ID: {activeSession.id}
                </ThemedText>

                <View style={styles.sessionActionRow}>
                  <Pressable
                    onPress={confirmSOS}
                    disabled={loading}
                    style={styles.sosButton}
                  >
                    <ThemedText style={styles.sosButtonText}>
                      {t.guardian.triggerSosButton}
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={handleEndSession}
                    disabled={loading}
                    style={styles.endSessionBtn}
                  >
                    <ThemedText style={styles.endSessionBtnText}>
                      {t.guardian.endSessionButton}
                    </ThemedText>
                  </Pressable>
                </View>

                {activeSession.alerts && activeSession.alerts.length > 0 ? (
                  <View style={styles.alertTimeline}>
                    <ThemedText type="smallBold" style={styles.alertSectionTitle}>
                      Logged SOS Alert Events ({activeSession.alerts.length})
                    </ThemedText>
                    {activeSession.alerts.map((alt) => (
                      <View key={alt.id} style={styles.alertItem}>
                        <ThemedText type="smallBold">• {alt.contact_name} ({alt.phone})</ThemedText>
                        <ThemedText type="small" style={styles.alertStatusText}>
                          Status: {alt.delivery_status} — {alt.explanation}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.startSessionBox}>
                <ThemedText type="small" style={styles.dimText}>
                  {t.guardian.startSessionDesc}
                </ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder={t.guardian.incidentNotePlaceholder}
                  placeholderTextColor={Colors.light.textMuted}
                  value={incidentNote}
                  onChangeText={setIncidentNote}
                />
                <Pressable
                  onPress={handleStartSession}
                  disabled={loading}
                  style={styles.startSessionBtn}
                >
                  <ThemedText style={styles.startSessionBtnText}>
                    ▶ Start Safety Session
                  </ThemedText>
                </Pressable>
              </View>
            )}
          </ThemedView>

          {/* 3. Trusted Contacts Manager */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View>
                <ThemedText type="subtitle" style={styles.cardTitle}>
                  Trusted Emergency Contacts ({contacts.length})
                </ThemedText>
                <ThemedText type="small" style={styles.dimText}>
                  Saved contacts for safety check-ins. Automatic SMS delivery is not available.
                </ThemedText>
              </View>
              <Pressable
                onPress={() => setShowAddContactForm((prev) => !prev)}
                style={styles.addMoreToggleBtn}
                accessibilityRole="button"
                accessibilityLabel="Add New Trusted Contact">
                <ThemedText style={styles.addMoreToggleText}>
                  {showAddContactForm ? '✕ Close' : '+ Add Contact'}
                </ThemedText>
              </Pressable>
            </View>

            {/* Existing Contacts List */}
            <View style={styles.contactsList}>
              {contacts.length === 0 ? (
                <View style={styles.emptyContactsBox}>
                  <ThemedText type="smallBold" style={styles.emptyContactsTitle}>
                    No emergency contacts added yet
                  </ThemedText>
                  <ThemedText type="small" style={styles.emptyContactsDesc}>
                    Add family members, trusted colleagues, or legal advocates to keep their contact details available. ProofPath does not automatically send them alerts.
                  </ThemedText>
                </View>
              ) : (
                contacts.map((c) => (
                  <View key={c.id} style={styles.contactItem}>
                    <View style={styles.contactAvatar}>
                      <ThemedText style={styles.contactAvatarText}>
                        {c.name.slice(0, 1).toUpperCase()}
                      </ThemedText>
                    </View>
                    <View style={styles.contactInfo}>
                      <ThemedText type="smallBold" style={styles.contactName}>{c.name}</ThemedText>
                      <ThemedText type="small" style={styles.contactPhone}>
                        📞 {c.phone} • <Text style={styles.contactRelBadge}>{c.relationship}</Text>
                      </ThemedText>
                    </View>
                    <Pressable
                      onPress={() => handleDeleteContact(c.id)}
                      disabled={loading}
                      style={styles.deleteBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${c.name}`}>
                      <ThemedText style={styles.deleteBtnText}>Remove</ThemedText>
                    </Pressable>
                  </View>
                ))
              )}
            </View>

            {/* Add Contact Form (Toggleable & Always Ready) */}
            {showAddContactForm ? (
              <View style={styles.addContactForm}>
                <ThemedText type="smallBold" style={styles.formTitle}>
                  REGISTER TRUSTED ADVOCATE OR CONTACT
                </ThemedText>

                <View style={styles.formInputsRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, minWidth: 200 }]}
                    placeholder="Full Name (e.g. Maya Sharma)"
                    placeholderTextColor={Colors.light.textMuted}
                    value={newName}
                    onChangeText={setNewName}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1, minWidth: 200 }]}
                    placeholder="Phone Number (e.g. +91 98765 43210)"
                    placeholderTextColor={Colors.light.textMuted}
                    value={newPhone}
                    onChangeText={setNewPhone}
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Relationship Tag Selector */}
                <View style={styles.relSelectorRow}>
                  <ThemedText type="smallBold" style={styles.relLabel}>RELATIONSHIP:</ThemedText>
                  {['Family Member', 'Trusted Advocate', 'Legal Counsel', 'Work Colleague', 'Support Worker'].map((rel) => (
                    <Pressable
                      key={rel}
                      onPress={() => setNewRel(rel)}
                      style={[
                        styles.relChip,
                        newRel === rel && styles.relChipActive,
                      ]}>
                      <ThemedText style={[styles.relChipText, newRel === rel && styles.relChipTextActive]}>
                        {rel}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.formActionsRow}>
                  <Pressable
                    onPress={handleAddContact}
                    disabled={loading || !newName.trim() || !newPhone.trim()}
                    style={[
                      styles.addContactBtn,
                      (!newName.trim() || !newPhone.trim() || loading) && styles.btnDisabled,
                    ]}>
                    <ThemedText style={styles.addContactBtnText}>
                      ✓ Save Contact to Secure Vault
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => setShowAddContactForm(false)}
                    style={styles.cancelBtn}>
                    <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
                  </Pressable>
                </View>
              </View>
            ) : null}
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
    backgroundColor: BrandColors.tealLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
  },
  workspacePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: BrandColors.teal,
    letterSpacing: 0.5,
  },
  caseBadge: {
    color: Colors.light.textSecondary,
  },
  subtitle: {
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  disclaimerBanner: {
    backgroundColor: BrandColors.warningLight,
    borderWidth: 1,
    borderColor: BrandColors.warningBorder,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  disclaimerTitle: {
    color: '#92400E',
    letterSpacing: 0.5,
  },
  disclaimerBody: {
    color: '#78350F',
    lineHeight: 18,
  },
  messageBox: {
    backgroundColor: BrandColors.indigoLight,
    borderWidth: 1,
    borderColor: BrandColors.indigoBorder,
    borderRadius: 8,
    padding: 10,
  },
  messageText: {
    color: BrandColors.indigo,
    fontSize: 12,
  },
  cardEmergency: {
    backgroundColor: BrandColors.roseLight,
    borderWidth: 1,
    borderColor: BrandColors.roseBorder,
    borderRadius: 14,
    padding: 18,
    gap: 10,
  },
  emergencyTop: {
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
  emergencyDesc: {
    color: '#881337',
    lineHeight: 18,
  },
  emergency112Button: {
    backgroundColor: BrandColors.rose,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  emergency112ButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 18,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    color: Colors.light.text,
  },
  activePill: {
    backgroundColor: BrandColors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BrandColors.successBorder,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.success,
  },
  sessionActiveBox: {
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  sessionNoteText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '600',
  },
  dimText: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  sessionActionRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  sosButton: {
    backgroundColor: BrandColors.rose,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  sosButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  endSessionBtn: {
    backgroundColor: Colors.light.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  endSessionBtnText: {
    color: Colors.light.text,
    fontWeight: '600',
    fontSize: 13,
  },
  alertTimeline: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
    paddingTop: 10,
    gap: 6,
  },
  alertSectionTitle: {
    fontSize: 12,
    color: Colors.light.text,
  },
  alertItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 8,
    gap: 2,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  alertStatusText: {
    color: BrandColors.warning,
    fontSize: 11,
  },
  startSessionBox: {
    gap: 10,
  },
  input: {
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: Colors.light.text,
  },
  startSessionBtn: {
    backgroundColor: BrandColors.teal,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  startSessionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  addMoreToggleBtn: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
  addMoreToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  emptyContactsBox: {
    padding: 16,
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: 8,
    alignItems: 'center',
    gap: 4,
  },
  emptyContactsTitle: {
    color: Colors.light.text,
    fontSize: 13,
  },
  emptyContactsDesc: {
    color: Colors.light.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 400,
  },
  contactsList: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  contactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  contactAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  contactInfo: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  contactPhone: {
    fontSize: 12,
    color: '#64748B',
  },
  contactRelBadge: {
    fontWeight: '600',
    color: '#4338CA',
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    cursor: 'pointer' as any,
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  addContactForm: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 16,
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  formInputsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  relSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  relLabel: {
    fontSize: 10,
    color: '#64748B',
    letterSpacing: 0.3,
  },
  relChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    cursor: 'pointer' as any,
  },
  relChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  relChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
  },
  relChipTextActive: {
    color: '#4338CA',
    fontWeight: '700',
  },
  formActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  addContactBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed' as any,
  },
  addContactBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    cursor: 'pointer' as any,
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 13,
  },
});
