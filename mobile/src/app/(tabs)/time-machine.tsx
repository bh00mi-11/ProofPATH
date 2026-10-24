import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton, Card, DemoNotice, EmptyState, EvidenceCard, Screen, StatusPill } from '@/components/proofpath-ui';
import { ProofPathPalette as P } from '@/constants/theme';
import { useCaseContext } from '@/context/case-context';
import { demoClaims, demoEvidence } from '@/mocks/demo-case';

export default function TimeMachineScreen() {
  const { caseId, excludedEvidenceIds, toggleEvidence, restoreOriginalState, scenario } = useCaseContext();
  const evidence = caseId === 'case_demo_01' ? demoEvidence : [];
  const changes = scenario.changes;

  return (
    <Screen eyebrow="EVIDENCE TIME MACHINE" title="Try a what-if scenario" subtitle="Temporarily exclude a demo item to preview a prepared scenario.">
      <DemoNotice>SIMULATION ONLY — MOCK DEMO RESULT. This reversible, in-memory example is not a legal evidence analysis or forensic determination. Original demo records are not changed.</DemoNotice>
      {evidence.length === 0 ? (
        <EmptyState title="No sample evidence in this record" description="The prepared scenario is available with the fictional demo record." />
      ) : (
        <Card>
          <Text style={styles.heading}>Choose an item to exclude</Text>
          <Text style={styles.body}>For a prepared example, exclude “Message screenshot”. Tap it again to restore it.</Text>
          <View style={{ gap: 10, marginTop: 4 }}>
            {evidence.map((item) => {
              const excluded = excludedEvidenceIds.includes(item.id);
              return (
                <Pressable key={item.id} accessibilityRole="checkbox" accessibilityState={{ checked: excluded }} onPress={() => toggleEvidence(item.id)}>
                  <EvidenceCard evidence={item} selected={excluded} />
                  <Text style={[styles.toggleLabel, excluded && styles.toggleLabelActive]}>{excluded ? 'Excluded from this demo scenario · tap to restore' : 'Included in baseline · tap to exclude temporarily'}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      )}

      <Card>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.heading}>Baseline → scenario</Text>
            <Text style={styles.body}>{excludedEvidenceIds.length ? `${excludedEvidenceIds.length} item${excludedEvidenceIds.length === 1 ? '' : 's'} temporarily excluded` : 'All original demo items are included.'}</Text>
          </View>
          <Text style={styles.demoTag}>MOCK</Text>
        </View>
        {changes.length ? changes.map((change) => {
          const claim = demoClaims.find((item) => item.id === change.claimId);
          return (
            <View key={change.claimId} style={styles.changeCard}>
              <Text style={styles.changeLabel}>SIMULATED STATE CHANGE</Text>
              <Text style={styles.claim}>{claim?.text ?? change.claimId}</Text>
              <View style={styles.statusRow}><StatusPill status={change.before} /><Text style={styles.arrow}>→</Text><StatusPill status={change.after} /></View>
              <Text style={styles.body}>{change.reason}</Text>
            </View>
          );
        }) : excludedEvidenceIds.length ? (
          <Text style={styles.body}>No prepared change is available for this selection in the mock demo. This does not mean the item has no effect in a real review.</Text>
        ) : <Text style={styles.body}>Choose the prepared screenshot scenario to see sample changes.</Text>}
      </Card>

      <ActionButton label="Restore original demo state" variant="secondary" onPress={restoreOriginalState} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { color: '#172033', fontSize: 15, fontWeight: '800' },
  body: { color: '#667085', fontSize: 13, lineHeight: 19 },
  toggleLabel: { color: '#667085', fontSize: 11, marginTop: 5, marginLeft: 4 },
  toggleLabelActive: { color: P.primary, fontWeight: '800' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  demoTag: { color: P.primary, backgroundColor: '#F1EEFF', borderRadius: 99, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4, fontSize: 10, fontWeight: '800' },
  changeCard: { backgroundColor: '#FAF9F7', borderColor: '#E7E4EE', borderWidth: 1, borderRadius: 13, padding: 13, gap: 9 },
  changeLabel: { color: P.primary, fontSize: 10, letterSpacing: 0.8, fontWeight: '900' },
  claim: { color: '#172033', fontSize: 14, lineHeight: 20, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrow: { color: P.accent, fontSize: 18, fontWeight: '800' },
});
