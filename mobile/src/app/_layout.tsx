import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useState, useEffect } from 'react';
import { Platform, View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { API_BASE_URL, setAuthToken } from '@/services/api-case-service';

import AppTabs from '@/components/app-tabs';
import { CaseProvider } from '@/context/CaseContext';
import { LanguageProvider } from '@/context/LanguageContext';

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

export default function RootLayout() {
  const [user, setUser] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true); setError('');
    try {
      const url = `${API_BASE_URL}/api/auth/${mode}`;
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Authentication failed');
      if (mode === 'register') { setMode('login'); setError('Account created. Log in to continue.'); }
      else { setAuthToken(data.access_token); setUser(data.user.email); }
    } catch (e: any) { setError(e.message || 'Connection failed'); }
    finally { setBusy(false); }
  };
  const [mounted, setMounted] = useState(Platform.OS !== 'web');

  useEffect(() => {
    setMounted(true);
    if (Platform.OS !== 'web') {
      // A splash screen held with preventAutoHideAsync must be released explicitly.
      // Otherwise Expo Go can remain on a blank screen despite a successful bundle.
      SplashScreen.hideAsync().catch((error) => {
        console.warn('Unable to dismiss splash screen', error);
      });
    }
  }, []);

  if (!mounted) {
    return null;
  }

  if (!user) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 24 }}>
      <View style={{ width: '100%', maxWidth: 400, gap: 14, backgroundColor: 'white', padding: 26, borderRadius: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#312e81' }}>ProofPATH</Text>
        <Text style={{ color: '#475569' }}>Synthetic demo only. Do not enter real incident information.</Text>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>{mode === 'login' ? 'Sign in' : 'Create user account'}</Text>
        <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="Email" value={email} onChangeText={setEmail} style={{ borderWidth: 1, borderColor: '#cbd5e1', padding: 12, borderRadius: 8 }} />
        <TextInput secureTextEntry placeholder="Password (12+ characters)" value={password} onChangeText={setPassword} style={{ borderWidth: 1, borderColor: '#cbd5e1', padding: 12, borderRadius: 8 }} />
        {!!error && <Text style={{ color: '#b91c1c' }}>{error}</Text>}
        <Pressable disabled={busy} onPress={submit} style={{ backgroundColor: '#4338ca', padding: 14, borderRadius: 8, alignItems: 'center' }}>
          <Text style={{ color: 'white', fontWeight: '700' }}>{busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Register'}</Text>
        </Pressable>
        <Pressable onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          <Text style={{ color: '#4338ca' }}>{mode === 'login' ? 'Create an account' : 'Already registered? Sign in'}</Text>
        </Pressable>
      </View>
    </View>
  );
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
