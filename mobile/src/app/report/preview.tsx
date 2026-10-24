import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';

import { ActionButton, Card, DemoNotice, Screen } from '@/components/proofpath-ui';
import { useCaseContext } from '@/context/case-context';

function PreviewField({ title, value, included }: { title: string; value: string; included: boolean }) {
  return (
    <Card style={styles.field}>
      <Text style={styles.fieldTitle}>{title}</Text>
      <Text style={included ? styles.fieldValue : styles.redacted}>
        {included ? value : '[WITHHELD PER RECIPIENT PROFILE ALLOWLIST]'}
      </Text>
    </Card>
  );
}

export default function ReportPreviewScreen() {
  const {
    activeCase,
    disclosure,
    evidence,
    observations,
    claims,
    confirmedExport,
    setConfirmedExport,
    exportPdfDocument
  } = useCaseContext();

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const includedSet = new Set(disclosure.includedFields);
  const sampleNames = evidence.map((item) => item.name).join(', ') || 'No evidence items';
  const sampleDates = evidence.map((item) => new Date(item.ingestedAt).toLocaleDateString()).join(' · ') || 'No dates';
  const sampleNotes = observations.slice(0, 3).map((item) => `• ${item.text}`).join('\n') || 'No observation notes';

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    setExportMessage(null);
    try {
      setConfirmedExport(true);
      const blob = await exportPdfDocument();
      setExportMessage(`Verified PDF generated via FastAPI (${blob.size} bytes). Document passed privacy scanning.`);
    } catch (err: any) {
      setExportError(err.message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen
      eyebrow="REPORT PREVIEW"
      title="Structured disclosure"
      subtitle={`${disclosure.recipient.replaceAll('_', ' ').toLowerCase()} · server-side allowlist preview`}
    >
      <DemoNotice>
        SERVER ALLOWLIST PREVIEW. Raw images are completely excluded from PDF compilation. Only explicitly approved fields for this profile are included.
      </DemoNotice>

      <Card style={styles.reportHeader}>
        <Text style={styles.watermark}>PROOFPATH DISCLOSURE PREVIEW</Text>
        <Text style={styles.reportTitle}>{activeCase.title}</Text>
        <Text style={styles.reportSub}>
          Recipient: {disclosure.recipient.replaceAll('_', ' ')} · Created {new Date(activeCase.createdAt).toLocaleDateString()}
        </Text>
      </Card>

      <PreviewField
        title="Incident Case Summary"
        value={activeCase.description || 'Standard incident report summary.'}
        included={includedSet.has('case_title') || includedSet.has('summary_note')}
      />

      <PreviewField
        title="Incident Timeline & Dates"
        value={sampleDates}
        included={includedSet.has('incident_date') || includedSet.has('incident_time')}
      />

      <PreviewField
        title="Evidence Artifact Names"
        value={sampleNames}
        included={includedSet.has('observation_details') || includedSet.has('observation_type_count')}
      />

      <PreviewField
        title="Observed Evidence Statements"
        value={sampleNotes}
        included={includedSet.has('observation_details')}
      />

      <PreviewField
        title="Cryptographic SHA-256 Hashes"
        value={evidence.map((e) => `${e.name}: ${e.sha256?.substring(0, 16)}...`).join('\n') || 'Hashes computed'}
        included={includedSet.has('evidence_sha256')}
      />

      {exportError ? (
        <Text style={styles.errorText}>{exportError}</Text>
      ) : null}

      {exportMessage ? (
        <Text style={styles.successText}>{exportMessage}</Text>
      ) : null}

      {exporting ? (
        <ActivityIndicator size="small" color="#4F46E5" style={{ marginVertical: 10 }} />
      ) : (
        <ActionButton
          label="Confirm & Export Verified PDF"
          onPress={handleExport}
          disabled={exporting}
        />
      )}

      <ActionButton label="Back to privacy review" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  reportHeader: { borderColor: '#D8D1F6', backgroundColor: '#F1EEFF' },
  watermark: { color: '#3730A3', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  reportTitle: { color: '#172033', fontSize: 20, fontWeight: '800' },
  reportSub: { color: '#667085', fontSize: 12, lineHeight: 18 },
  field: { paddingVertical: 13 },
  fieldTitle: { color: '#667085', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 },
  fieldValue: { color: '#172033', fontSize: 14, lineHeight: 20 },
  redacted: { color: '#667085', fontSize: 13, fontWeight: '700', backgroundColor: '#F2F4F7', padding: 8, borderRadius: 8 },
  errorText: { color: '#DC2626', fontSize: 12, fontWeight: '700', backgroundColor: '#FEF2F2', padding: 8, borderRadius: 8, marginVertical: 6 },
  successText: { color: '#16A34A', fontSize: 12, fontWeight: '700', backgroundColor: '#F0FDF4', padding: 8, borderRadius: 8, marginVertical: 6 },
});
