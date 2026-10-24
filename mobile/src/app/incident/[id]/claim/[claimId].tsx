import { Link, useLocalSearchParams, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Card, DemoNotice, EmptyState, Screen, StatusPill } from '@/components/proofpath-ui';
import { ProofPathPalette as P } from '@/constants/theme';
import { demoClaims, demoObservations } from '@/mocks/demo-case';

export default function ClaimInspectorScreen() {
  const { id, claimId } = useLocalSearchParams<{ id: string; claimId: string }>();
  const claim = id === 'case_demo_01' ? demoClaims.find((item) => item.id === claimId) : undefined;
  if (!claim) return <Screen title="Claim not found"><EmptyState title="No demo claim here" description="Choose a claim from the incident overview." /></Screen>;

  const supporting = demoObservations.filter((item) => claim.supportingObservationIds.includes(item.id));
  const conflicting = demoObservations.filter((item) => claim.conflictingObservationIds.includes(item.id));
  return (
    <Screen eyebrow="CLAIM INSPECTOR" title="Review a claim" subtitle="See which sample observations are linked to this statement.">
      <DemoNotice>These links are fictional demo data. They do not establish truth, guilt, authenticity, or a legal conclusion.</DemoNotice>
      <Card>
        <StatusPill status={claim.status} />
        <Text style={styles.claim}>{claim.text}</Text>
        <Text style={styles.body}>{claim.explanation}</Text>
      </Card>
      <Card>
        <Text style={styles.heading}>Supporting observations</Text>
        {supporting.length ? supporting.map((item) => <Text key={item.id} style={styles.observation}>• {item.text}</Text>) : <Text style={styles.body}>No supporting observation is linked in this demo.</Text>}
      </Card>
      <Card>
        <Text style={styles.heading}>Conflicting observations</Text>
        {conflicting.length ? conflicting.map((item) => <Text key={item.id} style={styles.observation}>• {item.text}</Text>) : <Text style={styles.body}>No conflicting observation is linked in this demo.</Text>}
      </Card>
      <Link href={'/(tabs)/time-machine' as Href} asChild>
        <Pressable accessibilityRole="button" style={styles.button}><Text style={styles.buttonText}>Explore a what-if scenario  →</Text></Pressable>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  claim: { color: '#172033', fontSize: 18, lineHeight: 25, fontWeight: '800' },
  heading: { color: '#172033', fontSize: 14, fontWeight: '800' },
  body: { color: '#667085', fontSize: 13, lineHeight: 19 },
  observation: { color: '#475467', fontSize: 14, lineHeight: 21 },
  button: { minHeight: 48, borderRadius: 13, backgroundColor: P.primary, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
