import { Link, usePathname, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProofPathPalette as P } from '@/constants/theme';

const tabs: { label: string; href: Href; path: string }[] = [
  { label: 'Home', href: '/(tabs)', path: '/(tabs)' },
  { label: 'Evidence', href: '/(tabs)/evidence', path: '/(tabs)/evidence' },
  { label: 'Time Machine', href: '/(tabs)/time-machine', path: '/(tabs)/time-machine' },
  { label: 'Privacy', href: '/(tabs)/privacy', path: '/(tabs)/privacy' },
];

export default function AppTabs() {
  const pathname = usePathname();
  return (
    <View style={styles.shell}>
      <View style={styles.bar}>
        <Text style={styles.brand}>ProofPath</Text>
        <View style={styles.links}>
          {tabs.map((tab) => {
            const active = pathname === tab.path || (tab.label === 'Home' && pathname === '/');
            return (
              <Link key={tab.label} href={tab.href} asChild>
                <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} style={[styles.tab, active && styles.activeTab]}>
                  <Text style={[styles.label, active && styles.activeLabel]}>{tab.label}</Text>
                </Pressable>
              </Link>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14 },
  bar: { width: '100%', maxWidth: 760, minHeight: 64, borderRadius: 18, backgroundColor: '#FFFFFF', borderColor: '#E7E4EE', borderWidth: 1, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#172033', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  brand: { color: P.primary, fontWeight: '800', fontSize: 14, paddingHorizontal: 8 },
  links: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', gap: 4 },
  tab: { minHeight: 42, borderRadius: 12, paddingHorizontal: 11, justifyContent: 'center' },
  activeTab: { backgroundColor: '#F1EEFF' },
  label: { color: '#667085', fontSize: 12, fontWeight: '600' },
  activeLabel: { color: P.primary, fontWeight: '800' },
});
