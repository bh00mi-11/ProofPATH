import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, DemoNotice, Screen, StatusPill } from '@/components/proofpath-ui';
import { ProofPathPalette as P } from '@/constants/theme';
import { useCaseContext } from '@/context/case-context';
import { demoClaims, demoEvidence } from '@/mocks/demo-case';

function QuickLink({ label, detail, href }: { label: string; detail: string; href: Href }) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="button" style={({ pressed }) => [styles.quickLink, pressed && { opacity: 0.76 }]}>
        <View style={styles.quickIcon}><Text style={styles.quickArrow}>↗</Text></View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.quickTitle}>{label}</Text>
          <Text style={styles.quickDetail}>{detail}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

export default function HomeScreen() {
  const { caseId, activeCase, cases, selectCase } = useCaseContext();
  const evidenceCount = caseId === 'case_demo_01' ? demoEvidence.length : 0;
  const claims = caseId === 'case_demo_01' ? demoClaims : [];
  return (
    <Screen eyebrow="PROOFPATH · PRIVATE BY DESIGN" title="Your safety, your choice" subtitle="Keep incident records organized and decide what you choose to share.">
      <DemoNotice>This prototype uses fictional demo records. It does not verify evidence or provide emergency response.</DemoNotice>

      <Card style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>START A RECORD</Text>
        <Text style={styles.heroTitle}>Document an incident</Text>
        <Text style={styles.heroCopy}>Create a private record, then review the evidence and linked observations at your pace.</Text>
        <Link href={'/incident/new' as Href} asChild>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.8 }]}>
            <Text style={styles.primaryButtonText}>Create an incident  →</Text>
          </Pressable>
        </Link>
      </Card>

      <Card>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.sectionKicker}>CONTINUE A DEMO RECORD</Text>
            <Text style={styles.cardTitle}>{activeCase.title}</Text>
            <Text style={styles.body}>{activeCase.description}</Text>
          </View>
          <Text style={styles.caseBadge}>DEMO</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statValue}>{evidenceCount}</Text><Text style={styles.statLabel}>Evidence items</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{claims.length}</Text><Text style={styles.statLabel}>Claims</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{claims.filter((claim) => claim.status === 'REVIEW_NEEDED' || claim.status === 'CONFLICTED').length}</Text><Text style={styles.statLabel}>For review</Text></View>
        </View>
        <Link href={{ pathname: '/incident/[id]/index', params: { id: caseId } } as Href} asChild>
          <Pressable accessibilityRole="button" style={styles.textLink}><Text style={styles.textLinkText}>Open incident overview  →</Text></Pressable>
        </Link>
      </Card>

      {claims.length > 0 ? (
        <View style={{ gap: 10 }}>
          <Text style={styles.sectionTitle}>Claim status snapshot</Text>
          {claims.slice(0, 2).map((claim) => (
            <Link key={claim.id} href={{ pathname: '/incident/[id]/claim/[claimId]', params: { id: caseId, claimId: claim.id } } as Href} asChild>
              <Pressable accessibilityRole="button" style={styles.claimRow}>
                <Text style={styles.claimText}>{claim.text}</Text>
                <StatusPill status={claim.status} />
              </Pressable>
            </Link>
          ))}
        </View>
      ) : (
        <Card><Text style={styles.cardTitle}>Your record is ready</Text><Text style={styles.body}>Add demo data later to explore the evidence workflow. New incident entries stay in memory during this session only.</Text></Card>
      )}

      <View style={{ gap: 10 }}>
        <Text style={styles.sectionTitle}>Explore the record</Text>
        <QuickLink label="Evidence Vault" detail="Chronology, source labels, and mock integrity flags" href={'/(tabs)/evidence' as Href} />
        <QuickLink label="Evidence Time Machine" detail="Try a prepared, reversible what-if scenario" href={'/(tabs)/time-machine' as Href} />
        <QuickLink label="Privacy Review" detail="Choose which sample fields appear in a preview" href={'/(tabs)/privacy' as Href} />
        <QuickLink label="Guardian Mode preview" detail="See what is planned for a future version" href={'/guardian' as Href} />
        <QuickLink label="Support preview" detail="See future recipient and support options" href={'/support' as Href} />
      </View>

      {cases.length > 1 ? (
        <View style={{ gap: 8 }}>
          <Text style={styles.sectionTitle}>Your session records</Text>
          {cases.filter((item) => item.id !== caseId).map((item) => (
            <Pressable key={item.id} onPress={() => selectCase(item.id)} style={styles.claimRow}>
              <Text style={styles.claimText}>{item.title}</Text>
              <Text style={styles.body}>Select this session-only record</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: { backgroundColor: '#F1EEFF', borderColor: '#D8D1F6', padding: 18 },
  heroEyebrow: { color: P.primary, fontSize: 11, letterSpacing: 1, fontWeight: '800' },
  heroTitle: { color: '#172033', fontSize: 22, lineHeight: 27, fontWeight: '800' },
  heroCopy: { color: '#4C4A63', fontSize: 14, lineHeight: 20 },
  primaryButton: { backgroundColor: P.primary, paddingHorizontal: 16, minHeight: 48, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginTop: 5 },
  primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  sectionKicker: { color: '#667085', fontSize: 10, letterSpacing: 1, fontWeight: '800' },
  cardTitle: { color: '#172033', fontSize: 16, lineHeight: 22, fontWeight: '700' },
  body: { color: '#667085', fontSize: 13, lineHeight: 19 },
  caseBadge: { color: P.primary, backgroundColor: '#F1EEFF', fontSize: 10, fontWeight: '800', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  stat: { flex: 1, backgroundColor: '#FAF9F7', borderRadius: 12, padding: 10, gap: 3 },
  statValue: { color: P.primary, fontSize: 21, fontWeight: '800' },
  statLabel: { color: '#667085', fontSize: 10, lineHeight: 14 },
  textLink: { minHeight: 40, justifyContent: 'center' },
  textLinkText: { color: P.primary, fontSize: 14, fontWeight: '700' },
  sectionTitle: { color: '#172033', fontSize: 17, fontWeight: '800' },
  claimRow: { backgroundColor: '#fff', borderColor: '#E7E4EE', borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  claimText: { color: '#172033', fontSize: 14, lineHeight: 20, fontWeight: '600' },
  quickLink: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: '#fff', borderColor: '#E7E4EE', borderWidth: 1, borderRadius: 14 },
  quickIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F1EEFF', alignItems: 'center', justifyContent: 'center' },
  quickArrow: { color: P.primary, fontSize: 19, fontWeight: '700' },
  quickTitle: { color: '#172033', fontSize: 14, fontWeight: '700' },
  quickDetail: { color: '#667085', fontSize: 12, lineHeight: 17 },
});
