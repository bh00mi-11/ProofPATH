import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

import { BrandColors, Colors } from '@/constants/theme';
import { useTranslation } from '@/context/LanguageContext';

export default function AppTabs() {
  const colors = Colors.light;
  const { t } = useTranslation();

  return (
    <NativeTabs
      backgroundColor={colors.backgroundElement}
      indicatorColor={BrandColors.indigoLight}
      labelStyle={{ selected: { color: BrandColors.indigo } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t.navigation.home}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="evidence">
        <NativeTabs.Trigger.Label>{t.navigation.evidenceTimeline}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="time-machine">
        <NativeTabs.Trigger.Label>{t.navigation.analysis}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="privacy">
        <NativeTabs.Trigger.Label>{t.navigation.shareSafely}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="support">
        <NativeTabs.Trigger.Label>{t.navigation.supportSection}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
