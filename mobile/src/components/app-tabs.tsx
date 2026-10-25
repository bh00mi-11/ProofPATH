import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { BrandColors, Colors } from '@/constants/theme';
import { useTranslation } from '@/context/LanguageContext';

const primaryRoutes = ['index', 'evidence', 'time-machine', 'privacy', 'support'] as const;
const secondaryRoutes = [
  'accountability', 'claim/[id]', 'explore', 'guardian', 'incident/[id]',
  'incident/create', 'legal-context', 'remedies', 'report/preview', 'stress-test',
];

// Render our own text labels: some Android/Expo Go tab bars only show the
// focused label even when tabBarShowLabel is enabled.
function VisibleTabBar({ state, descriptors }: any) {
  const router = useRouter();
  return (
    <View style={{
      flexDirection: 'row', backgroundColor: Colors.light.backgroundElement,
      borderTopWidth: 1, borderTopColor: Colors.light.border,
      paddingTop: 8, paddingBottom: 12, minHeight: 72,
    }}>
      {state.routes.map((route: any, index: number) => {
        if (!primaryRoutes.includes(route.name)) return null;
        const options = descriptors[route.key]?.options || {};
        const selected = state.index === index;
        const color = selected ? BrandColors.indigo : Colors.light.textSecondary;
        const title = typeof options.title === 'string' ? options.title : route.name;
        const icons: Record<string, string> = {
          index: '⌂', evidence: '▤', 'time-machine': '◷', privacy: '▣', support: '♡',
        };
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={title}
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) router.navigate(route.name === 'index' ? '/' : `/${route.name}` as any);
            }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: 0, gap: 3 }}>
            <Text style={{ fontSize: 22, color, fontWeight: selected ? '700' : '400' }}>
              {icons[route.name] || '•'}
            </Text>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}
              style={{ fontSize: 11, color, fontWeight: selected ? '700' : '600', textAlign: 'center' }}>
              {title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function AppTabs() {
  const { t } = useTranslation();
  const items = [
    { name: 'index', title: t.navigation.home },
    { name: 'evidence', title: 'Evidence' },
    { name: 'time-machine', title: 'Review' },
    { name: 'privacy', title: 'Share' },
    { name: 'support', title: 'Support' },
  ];
  return (
    <Tabs tabBar={(props) => <VisibleTabBar {...props} />}
      screenOptions={{ headerShown: false, tabBarShowLabel: true }}>
      {secondaryRoutes.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ title: name }} />
      ))}
      {items.map((item) => (
        <Tabs.Screen key={item.name} name={item.name} options={{ title: item.title }} />
      ))}
    </Tabs>
  );
}
