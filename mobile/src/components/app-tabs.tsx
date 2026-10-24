import { NativeTabs } from 'expo-router/native-tabs';

import { Colors, ProofPathPalette } from '@/constants/theme';

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={Colors.light.backgroundElement}
      indicatorColor={Colors.light.backgroundSelected}
      iconColor={{ default: Colors.light.textSecondary, selected: ProofPathPalette.primary }}
      labelStyle={{ default: { color: Colors.light.textSecondary }, selected: { color: ProofPathPalette.primary } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="home" sf="house" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="evidence">
        <NativeTabs.Trigger.Label>Evidence</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="folder_open" sf="folder" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="time-machine">
        <NativeTabs.Trigger.Label>Time Machine</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="history" sf="clock.arrow.circlepath" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="privacy">
        <NativeTabs.Trigger.Label>Privacy</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="tune" sf="slider.horizontal.3" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
