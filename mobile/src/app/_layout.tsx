import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { CaseProvider } from '@/context/case-context';
import { Colors } from '@/constants/theme';

const proofPathTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Colors.light.background },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={proofPathTheme}>
      <CaseProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.light.background } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="incident/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="incident/[id]/index" />
          <Stack.Screen name="incident/[id]/claim/[claimId]" />
          <Stack.Screen name="report/preview" />
          <Stack.Screen name="guardian/index" />
          <Stack.Screen name="support/index" />
        </Stack>
      </CaseProvider>
    </ThemeProvider>
  );
}
