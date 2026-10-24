import { Link, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';

import { ActionButton, Card, DemoNotice, FieldToggle, Screen } from '@/components/proofpath-ui';
import { ProofPathPalette as P } from '@/constants/theme';
import { useCaseContext } from '@/context/case-context';
import { demoRecipients } from '@/mocks/demo-case';

export default function PrivacyScreen() {
  const {
    recipient,
    setRecipient,
    includedFields,
    toggleField,
    disclosure,
    confirmedExport,
    setConfirmedExport,
    exportPdfDocument,
    loading: contextLoading
  } = useCaseContext();

  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!confirmedExport) {
      setExportError('Please check the confirmation box below to confirm you reviewed the approved disclosure profile.');
      return;
    }

    setExporting(true);
    setExportError(null);
    setExportMessage(null);

    try {
      const pdfBlob = await exportPdfDocument();
      setExportMessage(`PDF successfully compiled via ProofPath backend (${pdfBlob.size} bytes). Document is verified and ready.`);
    } catch (err: any) {
      setExportError(err.message || 'Export failed privacy verification or backend error.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen eyebrow="PRIVACY REVIEW" title="Choose what to include" subtitle="Review the recipient profile allowlist before generating a verified disclosure.">
      <DemoNotice>SERVER-SIDE FIELD ALLOWLISTS ACTIVE. Sensitive fields not explicitly approved for the selected recipient profile are withheld by the backend. Raw images are excluded to prevent visual leakage.</DemoNotice>

      <Card>
        <Text style={styles.heading}>Who is this disclosure for?</Text>
        <Text style={styles.body}>Select a recipient profile. The backend will enforce the approved server allowlist.</Text>
        <View style={{ gap: 8, marginTop: 4 }}>
          {demoRecipients.map((item) => {
            const selected = recipient === item.id;
            return (
              <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => setRecipient(item.id)} style={[styles.recipient, selected && styles.recipientSelected]}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[styles.recipientTitle, selected && { color: P.primary }]}>{item.label}</Text>
                  <Text style={styles.body}>{item.helper}</Text>
                </View>
                <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text style={styles.heading}>Approved fields for this profile</Text>
        <Text style={styles.body}>The following fields are permitted by the server-side allowlist:</Text>
        <View style={{ gap: 6, marginTop: 4 }}>
          {disclosure.includedFields.map((field) => (
            <FieldToggle key={field} label={field} selected={includedFields.includes(field)} onPress={() => toggleField(field)} />
          ))}
        </View>
        {disclosure.excludedFields.length > 0 ? (
          <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
            <Text style={[styles.heading, { fontSize: 13, color: '#64748B' }]}>Strictly excluded fields ({disclosure.excludedFields.length})</Text>
            <Text style={styles.body}>
              {disclosure.excludedFields.join(' · ')}
            </Text>
          </View>
        ) : null}
      </Card>

      <Card>
        <Text style={styles.heading}>Preview checks & warnings</Text>
        {disclosure.warnings.map((warning) => (
          <Text key={warning} style={styles.warning}>• {warning}</Text>
        ))}
        {disclosure.disclaimer ? (
          <Text style={[styles.body, { fontStyle: 'italic', fontSize: 11 }]}>{disclosure.disclaimer}</Text>
        ) : null}
        
        <View style={styles.stateRow}>
          <Text style={styles.body}>Privacy verification scan</Text>
          <Text style={{ color: '#059669', fontSize: 11, fontWeight: '800' }}>Active on backend</Text>
        </View>

        {/* Requirement 8: Explicit Confirmation Checkbox */}
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: confirmedExport }}
          onPress={() => setConfirmedExport(!confirmedExport)}
          style={[styles.confirmationBox, confirmedExport && styles.confirmationBoxActive]}
        >
          <View style={[styles.checkbox, confirmedExport && styles.checkboxActive]}>
            {confirmedExport ? <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>✓</Text> : null}
          </View>
          <Text style={styles.confirmationText}>
            I confirm that I have reviewed the allowed fields and approve generating this disclosure report.
          </Text>
        </Pressable>

        {exportError ? (
          <Text style={styles.errorText}>{exportError}</Text>
        ) : null}

        {exportMessage ? (
          <Text style={styles.successText}>{exportMessage}</Text>
        ) : null}

        <Link href={'/report/preview' as Href} asChild>
          <Pressable accessibilityRole="button" style={styles.linkButton}>
            <Text style={styles.linkText}>Review formatted report preview  →</Text>
          </Pressable>
        </Link>

        {exporting ? (
          <ActivityIndicator size="small" color={P.primary} style={{ marginTop: 8 }} />
        ) : (
          <ActionButton
            label={confirmedExport ? "Export Verified PDF (FastAPI)" : "Confirm approval above to export"}
            onPress={handleExport}
            disabled={!confirmedExport || exporting}
          />
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { color: '#172033', fontSize: 15, fontWeight: '800' },
  body: { color: '#667085', fontSize: 12, lineHeight: 18 },
  recipient: { minHeight: 62, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E7E4EE', borderRadius: 13, paddingHorizontal: 12, paddingVertical: 10, gap: 12, backgroundColor: '#fff' },
  recipientSelected: { borderColor: P.accent, backgroundColor: '#F8F6FF' },
  recipientTitle: { color: '#172033', fontSize: 14, fontWeight: '800' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#98A2B3', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: P.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: P.primary },
  warning: { color: '#92400E', backgroundColor: '#FFFAEB', borderRadius: 10, padding: 10, fontSize: 12, lineHeight: 18 },
  stateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  linkButton: { minHeight: 42, justifyContent: 'center' },
  linkText: { color: P.primary, textAlign: 'center', fontSize: 13, fontWeight: '800' },
  confirmationBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1', marginTop: 6 },
  confirmationBoxActive: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: '#64748B', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  confirmationText: { flex: 1, fontSize: 12, color: '#334155', lineHeight: 16, fontWeight: '600' },
  errorText: { color: '#DC2626', fontSize: 12, fontWeight: '700', backgroundColor: '#FEF2F2', padding: 8, borderRadius: 8, marginTop: 4 },
  successText: { color: '#16A34A', fontSize: 12, fontWeight: '700', backgroundColor: '#F0FDF4', padding: 8, borderRadius: 8, marginTop: 4 },
});
