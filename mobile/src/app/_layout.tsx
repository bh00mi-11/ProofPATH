import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useState, useEffect } from 'react';
import { Platform, useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { CaseProvider } from '@/context/CaseContext';
import { LanguageProvider } from '@/context/LanguageContext';

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [mounted, setMounted] = useState(Platform.OS !== 'web');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <LanguageProvider>
        <CaseProvider>
          <AppTabs />
        </CaseProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
