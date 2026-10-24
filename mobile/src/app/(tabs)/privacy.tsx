import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton, Card, DemoNotice, FieldToggle, Screen } from '@/components/proofpath-ui';
import { ProofPathPalette as P } from '@/constants/theme';
import { useCaseContext } from '@/context/case-context';
import { demoRecipients, disclosureFields } from '@/mocks/demo-case';

export default function PrivacyScreen() {
  const { recipient, setRecipient, includedFields, toggleField, disclosure } = useCaseContext();
  return (
    <Screen eyebrow="PRIVACY REVIEW" title="Choose what to include" subtitle="Review the sample fields before opening a report preview.">
      <DemoNotice>MOCK DEMO PREVIEW — NOT LEGAL REDACTION. These client-side toggles are illustrative. No certified redaction, privacy guarantee, or real export is connected.</DemoNotice>

      <Card>
        <Text style={styles.heading}>Who is this preview for?</Text>
        <Text style={styles.body}>Choose one recipient type. This selection does not send information.</Text>
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
        <Text style={styles.heading}>Fields in the sample report</Text>
        <Text style={styles.body}>Exact location and contact identifiers start excluded. Nothing is silently added.</Text>
        {disclosureFields.map((field) => <FieldToggle key={field} label={field} selected={includedFields.includes(field)} onPress={() => toggleField(field)} />)}
      </Card>

      <Card>
        <Text style={styles.heading}>Preview checks</Text>
        {disclosure.warnings.map((warning) => <Text key={warning} style={styles.warning}>• {warning}</Text>)}
        <View style={styles.stateRow}><Text style={styles.body}>Real privacy check</Text><Text style={styles.unavailable}>Not connected</Text></View>
        <Link href={'/report/preview' as Href} asChild>
          <Pressable accessibilityRole="button" style={styles.linkButton}><Text style={styles.linkText}>Review report preview  →</Text></Pressable>
        </Link>
        <ActionButton label="Export PDF (not connected)" onPress={() => undefined} disabled={!disclosure.canExport} />
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
  stateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unavailable: { color: '#667085', fontSize: 11, fontWeight: '800' },
  linkButton: { minHeight: 42, justifyContent: 'center' },
  linkText: { color: P.primary, textAlign: 'center', fontSize: 13, fontWeight: '800' },
});
