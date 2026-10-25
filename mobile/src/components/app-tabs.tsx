import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { BrandColors, Colors } from '@/constants/theme';
import { useTranslation } from '@/context/LanguageContext';

// JavaScript tabs keep text labels visible in Expo Go across Android versions.
export default function AppTabs() {
  const { t } = useTranslation();
  const items = [
    { name: 'index', title: t.navigation.home, icon: '⌂' },
    { name: 'evidence', title: 'Evidence', icon: '▤' },
    { name: 'time-machine', title: 'Review', icon: '◷' },
    { name: 'privacy', title: 'Share', icon: '▣' },
    { name: 'support', title: 'Support', icon: '♡' },
  ];
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarShowLabel: true,
      tabBarActiveTintColor: BrandColors.indigo,
      tabBarInactiveTintColor: Colors.light.textSecondary,
      tabBarStyle: { backgroundColor: Colors.light.backgroundElement, height: 66, paddingBottom: 8, paddingTop: 6 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      {['accountability', 'claim/[id]', 'explore', 'guardian', 'incident/[id]', 'incident/create', 'legal-context', 'remedies', 'report/preview', 'stress-test'].map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
      {items.map((item) => (
        <Tabs.Screen key={item.name} name={item.name} options={{
          title: item.title,
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 21 }}>{item.icon}</Text>,
        }} />
      ))}
    </Tabs>
  );
}
