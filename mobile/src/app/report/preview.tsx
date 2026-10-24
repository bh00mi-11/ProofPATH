import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { ActionButton, Card, DemoNotice, Screen } from '@/components/proofpath-ui';
import { useCaseContext } from '@/context/case-context';
import { demoEvidence, demoObservations } from '@/mocks/demo-case';

function PreviewField({ title, value, included }: { title: string; value: string; included: boolean }) {
  return (
    <Card style={styles.field}>
      <Text style={styles.fieldTitle}>{title}</Text>
      <Text style={included ? styles.fieldValue : styles.redacted}>{included ? value : '[REDACTED IN PREVIEW]'}</Text>
    </Card>
  );
}

export default function ReportPreviewScreen() {
  const { activeCase, disclosure } = useCaseContext();
  const included = new Set(disclosure.includedFields);
  const sampleNames = demoEvidence.map((item) => item.name).join(', ');
  const sampleDates = demoEvidence.map((item) => new Date(item.ingestedAt).toLocaleDateString()).join(' · ');
  const sampleNotes = demoObservations.slice(0, 2).map((item) => item.text).join(' ');

  return (
    <Screen eyebrow="REPORT PREVIEW" title="Sample disclosure" subtitle={`${disclosure.recipient.replaceAll('_', ' ').toLowerCase()} · preview only`}>
      <DemoNotice>SAMPLE / DEMO REPORT — NOT AN OFFICIAL DISCLOSURE. This screen previews field choices only. It is not a PDF and has not passed a backend privacy check.</DemoNotice>
      <Card style={styles.reportHeader}>
        <Text style={styles.watermark}>SAMPLE / DEMO REPORT</Text>
        <Text style={styles.reportTitle}>{activeCase.title}</Text>
        <Text style={styles.reportSub}>Fictional example · Created {new Date(activeCase.createdAt).toLocaleDateString()}</Text>
      </Card>
      <PreviewField title="Incident summary" value={activeCase.description} included={included.has('Incident summary')} />
      <PreviewField title="Evidence names" value={sampleNames} included={included.has('Evidence names')} />
      <PreviewField title="Timeline dates" value={sampleDates} included={included.has('Timeline dates')} />
      <PreviewField title="Observation notes" value={sampleNotes} included={included.has('Observation notes')} />
      <PreviewField title="Exact location" value="[Fictional demo value omitted]" included={included.has('Exact location')} />
      <PreviewField title="Contact identifiers" value="[Fictional demo value omitted]" included={included.has('Contact identifiers')} />
      <ActionButton label="Export PDF (not connected)" onPress={() => undefined} disabled={!disclosure.canExport} />
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
  redacted: { color: '#667085', fontSize: 14, fontWeight: '700', backgroundColor: '#F2F4F7', padding: 8, borderRadius: 8 },
});
