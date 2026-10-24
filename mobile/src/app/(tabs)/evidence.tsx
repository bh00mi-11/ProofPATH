import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, DemoNotice, EmptyState, EvidenceCard, Screen } from '@/components/proofpath-ui';
import { ProofPathPalette as P } from '@/constants/theme';
import { useCaseContext } from '@/context/case-context';
import { demoEvidence, demoObservations } from '@/mocks/demo-case';

export default function EvidenceScreen() {
  const { caseId, evidence, observations: allObservations, loading, error } = useCaseContext();
  const items = [...evidence].sort((a, b) => a.ingestedAt.localeCompare(b.ingestedAt));

  return (
    <Screen eyebrow="EVIDENCE VAULT" title="Evidence timeline" subtitle="Review ingested case artifacts and cryptographic tamper-proof checks.">
      <DemoNotice>SHA-256 cryptographic hashes protect evidence against post-intake modification. Linking an observation does not unilaterally prove forensic authenticity.</DemoNotice>
      {items.length === 0 ? (
        <EmptyState title="No evidence in this record" description="No evidence artifacts ingested for this case yet." />
      ) : items.map((item, index) => {
        const observations = allObservations.filter((observation) => observation.evidenceId === item.id);
        return (
          <View key={item.id} style={styles.timelineRow}>
            <View style={styles.timelineRail}>
              <View style={[styles.dot, index === 0 && styles.firstDot]} />
              {index < items.length - 1 ? <View style={styles.line} /> : null}
            </View>
            <View style={styles.itemContent}>
              <EvidenceCard evidence={item} />
              <Card style={styles.observationCard}>
                <Text style={styles.observationHeading}>Linked observations · {observations.length}</Text>
                {observations.map((observation) => (
                  <Text key={observation.id} style={styles.observationText}>• {observation.text}</Text>
                ))}
              </Card>
            </View>
          </View>
        );
      })}
      <Card>
        <Text style={styles.observationHeading}>Review linked claims</Text>
        <Text style={styles.observationText}>Open the incident overview to see how sample observations connect to claims.</Text>
        <Link href={{ pathname: '/incident/[id]/index', params: { id: caseId } } as Href} asChild>
          <Pressable accessibilityRole="button" style={styles.linkButton}><Text style={styles.linkText}>Open incident overview  →</Text></Pressable>
        </Link>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  timelineRow: { flexDirection: 'row', gap: 10 },
  timelineRail: { width: 18, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 10, marginTop: 18, backgroundColor: P.accent, zIndex: 1 },
  firstDot: { backgroundColor: P.primary },
  line: { position: 'absolute', width: 2, top: 27, bottom: -10, backgroundColor: '#DED9F2' },
  itemContent: { flex: 1, gap: 8 },
  observationCard: { padding: 12, backgroundColor: '#FFFFFF' },
  observationHeading: { color: '#172033', fontSize: 13, fontWeight: '800' },
  observationText: { color: '#667085', fontSize: 12, lineHeight: 18 },
  linkButton: { minHeight: 40, justifyContent: 'center' },
  linkText: { color: P.primary, fontWeight: '700', fontSize: 14 },
});
