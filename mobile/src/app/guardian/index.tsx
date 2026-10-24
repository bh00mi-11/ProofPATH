import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Card, DemoNotice, Screen } from '@/components/proofpath-ui';
import { ProofPathPalette as P } from '@/constants/theme';

export default function GuardianPreviewScreen() {
  return (
    <Screen eyebrow="FUTURE WORK · GUARDIAN MODE" title="Choose support on your terms" subtitle="A future version may help you prepare a limited update for someone you trust.">
      <DemoNotice>PREVIEW ONLY. This screen does not contact anyone, share your location, monitor safety, or provide emergency response.</DemoNotice>
      <Card>
        <Text style={styles.heading}>Planned for a later version</Text>
        <Text style={styles.body}>You could choose a trusted contact, review exactly what a check-in contains, and decide whether to share it. Every share would require an explicit action.</Text>
      </Card>
      <Card>
        <Text style={styles.heading}>Not available in this demo</Text>
        <Text style={styles.body}>Contact setup, live location, check-in delivery, background monitoring, and emergency dispatch are not implemented.</Text>
      </Card>
      <Link href={'/(tabs)' as Href} asChild>
        <Pressable accessibilityRole="button" style={styles.button}><Text style={styles.buttonText}>Back to your records</Text></Pressable>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { color: '#172033', fontSize: 15, fontWeight: '800' },
  body: { color: '#667085', fontSize: 13, lineHeight: 20 },
  button: { minHeight: 48, borderRadius: 13, backgroundColor: P.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
