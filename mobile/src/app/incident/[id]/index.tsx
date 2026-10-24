import { Link, useLocalSearchParams, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Card, DemoNotice, EmptyState, Screen, StatusPill } from '@/components/proofpath-ui';
import { ProofPathPalette as P } from '@/constants/theme';
import { useCaseContext } from '@/context/case-context';
import { demoClaims, demoEvidence } from '@/mocks/demo-case';

export default function IncidentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cases, claims, evidence, loading } = useCaseContext();
  const incident = cases.find((item) => item.id === id);
  const evidenceCount = evidence.length;

  if (!incident) {
    return <Screen title="Record not found"><EmptyState title="This record is unavailable" description="Return home and choose an available demo record." /></Screen>;
  }

  return (
    <Screen eyebrow="INCIDENT OVERVIEW" title={incident.title} subtitle={incident.description}>
      <DemoNotice>This is a fictional prototype record. Claim labels describe linked demo observations and are not findings about real events.</DemoNotice>
      <Card>
        <Text style={styles.kicker}>RECORD SUMMARY</Text>
        <Text style={styles.body}>Created {new Date(incident.createdAt).toLocaleDateString()} · {evidenceCount} evidence items · {claims.length} claims</Text>
        <Link href={'/(tabs)/evidence' as Href} asChild>
          <Pressable accessibilityRole="button" style={styles.linkButton}><Text style={styles.linkText}>Open Evidence Vault  →</Text></Pressable>
        </Link>
      </Card>
      {claims.length === 0 ? (
        <EmptyState title="No claims in this record yet" description="Claim review is available in the fictional demo record." />
      ) : claims.map((claim) => (
        <Link key={claim.id} href={{ pathname: '/incident/[id]/claim/[claimId]', params: { id: incident.id, claimId: claim.id } } as Href} asChild>
          <Pressable accessibilityRole="button" style={styles.claimCard}>
            <StatusPill status={claim.status} />
            <Text style={styles.claimText}>{claim.text}</Text>
            <Text style={styles.body}>{claim.explanation}</Text>
            <Text style={styles.linkText}>Review linked observations  →</Text>
          </Pressable>
        </Link>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: '#667085', fontSize: 10, letterSpacing: 1, fontWeight: '800' },
  body: { color: '#667085', fontSize: 13, lineHeight: 19 },
  linkButton: { minHeight: 42, justifyContent: 'center' },
  linkText: { color: P.primary, fontSize: 13, fontWeight: '800' },
  claimCard: { backgroundColor: '#fff', borderColor: '#E7E4EE', borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  claimText: { color: '#172033', fontSize: 16, lineHeight: 22, fontWeight: '700' },
});
