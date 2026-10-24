import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Card, DemoNotice, Screen } from '@/components/proofpath-ui';
import { ProofPathPalette as P } from '@/constants/theme';

export default function SupportPreviewScreen() {
  return (
    <Screen eyebrow="FUTURE WORK · SUPPORT" title="Explore support options" subtitle="A future version may help you prepare a private, recipient-specific summary.">
      <DemoNotice>PREVIEW ONLY. No support organization, legal professional, or service is contacted from this demo.</DemoNotice>
      <Card>
        <Text style={styles.heading}>Planned for a later version</Text>
        <Text style={styles.body}>A support directory and a carefully reviewed handoff could help you decide what information to share and with whom.</Text>
      </Card>
      <Card>
        <Text style={styles.heading}>Not available in this demo</Text>
        <Text style={styles.body}>Verified provider listings, appointments, legal advice, crisis response, and report delivery are not implemented. For immediate danger, contact your local emergency service directly.</Text>
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
