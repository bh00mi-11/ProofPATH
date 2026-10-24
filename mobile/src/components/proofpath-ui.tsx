import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type PressableProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProofPathPalette as P, Spacing } from '@/constants/theme';
import type { ClaimStatus, Evidence } from '@/types/proofpath.types';

export function Screen({
  title,
  eyebrow,
  subtitle,
  children,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.stack}>{children}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function DemoNotice({ children }: { children: ReactNode }) {
  return (
    <View accessibilityRole="summary" style={styles.notice}>
      <Text style={styles.noticeTitle}>DEMO ONLY</Text>
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: {
  label: string;
  onPress: PressableProps['onPress'];
  variant?: 'primary' | 'secondary' | 'quiet';
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' ? styles.primaryButton : variant === 'secondary' ? styles.secondaryButton : styles.quietButton,
        pressed && !disabled ? styles.pressed : undefined,
        disabled ? styles.disabled : undefined,
      ]}>
      <Text style={variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function StatusPill({ status }: { status: ClaimStatus }) {
  const palette: Record<ClaimStatus, { bg: string; fg: string; label: string }> = {
    SUPPORTED: { bg: '#D8F3EC', fg: '#0F766E', label: 'Supported' },
    CONFLICTED: { bg: '#FEF0C7', fg: '#92400E', label: 'Conflicted' },
    UNVERIFIED: { bg: '#E8EAF0', fg: '#475467', label: 'Unverified' },
    REVIEW_NEEDED: { bg: '#FCE4E2', fg: '#9A3412', label: 'Review needed' },
  };
  const item = palette[status];
  return <Text style={[styles.pill, { backgroundColor: item.bg, color: item.fg }]}>{item.label}</Text>;
}

export function EvidenceCard({ evidence, selected, onPress }: { evidence: Evidence; selected?: boolean; onPress?: () => void }) {
  const integrityColor = evidence.integrity === 'MATCH' ? P.success : evidence.integrity === 'MISMATCH' ? P.danger : P.warning;
  const date = new Date(evidence.ingestedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} style={({ pressed }) => [styles.evidenceCard, selected && styles.selectedCard, pressed && styles.pressed]}>
      <View style={styles.evidenceTop}>
        <Text style={styles.evidenceType}>{evidence.type.toUpperCase()}</Text>
        <Text style={[styles.integrity, { color: integrityColor }]}>{evidence.integrity}</Text>
      </View>
      <Text style={styles.cardTitle}>{evidence.name}</Text>
      <Text style={styles.muted}>{date} · Mock integrity flag</Text>
    </Pressable>
  );
}

export function FieldToggle({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={onPress} style={styles.fieldToggle}>
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>{selected ? <Text style={styles.checkmark}>✓</Text> : null}</View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={selected ? styles.includedText : styles.excludedText}>{selected ? 'Included' : 'Excluded'}</Text>
    </Pressable>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.muted}>{description}</Text>
    </Card>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF9F7' },
  scroll: { flexGrow: 1, paddingBottom: 28 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 12 },
  eyebrow: { color: P.primary, textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  title: { color: '#172033', fontSize: 28, lineHeight: 34, fontWeight: '700' },
  subtitle: { color: '#667085', fontSize: 15, lineHeight: 22, marginTop: 6 },
  stack: { gap: 14, marginTop: 20 },
  card: { backgroundColor: P.white, borderColor: P.border, borderWidth: 1, borderRadius: 16, padding: 16, gap: 9 },
  notice: { backgroundColor: '#F1EEFF', borderColor: '#D8D1F6', borderWidth: 1, borderRadius: 14, padding: 14, gap: 5 },
  noticeTitle: { color: P.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  noticeText: { color: '#38345A', fontSize: 13, lineHeight: 19 },
  button: { minHeight: 48, borderRadius: 13, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { backgroundColor: P.primary },
  secondaryButton: { backgroundColor: P.white, borderWidth: 1, borderColor: P.border },
  quietButton: { backgroundColor: 'transparent' },
  primaryButtonText: { color: P.white, fontWeight: '700', fontSize: 15 },
  secondaryButtonText: { color: P.primary, fontWeight: '700', fontSize: 15 },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.45 },
  pill: { alignSelf: 'flex-start', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 12, fontWeight: '700' },
  evidenceCard: { backgroundColor: P.white, borderColor: P.border, borderWidth: 1, borderRadius: 14, padding: 14, gap: 7 },
  selectedCard: { borderColor: P.accent, backgroundColor: '#F8F6FF' },
  evidenceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  evidenceType: { fontSize: 10, color: '#667085', fontWeight: '800', letterSpacing: 0.8 },
  integrity: { fontSize: 11, fontWeight: '800' },
  cardTitle: { color: '#172033', fontSize: 16, fontWeight: '700' },
  muted: { color: '#667085', fontSize: 13, lineHeight: 19 },
  fieldToggle: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: P.border },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#98A2B3', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: P.primary, borderColor: P.primary },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '800' },
  fieldLabel: { color: '#172033', flex: 1, fontSize: 14 },
  includedText: { color: P.success, fontSize: 11, fontWeight: '700' },
  excludedText: { color: '#667085', fontSize: 11, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: P.border, marginVertical: Spacing.one },
});
