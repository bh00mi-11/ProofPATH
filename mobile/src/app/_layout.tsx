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
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [token, setToken] = useState('');
  const [pending, setPending] = useState<any[]>([]);
  const [reviewNotes, setReviewNotes] = useState<Record<string,string>>({});
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
      else { setAuthToken(data.access_token); setToken(data.access_token); setRole(data.user.role === 'admin' ? 'admin' : 'user'); setUser(data.user.email); }
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
  const refreshPending = async () => {
    const res = await fetch(`${API_BASE_URL}/api/admin/accountability/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Could not load review queue');
    const data = await res.json();
    setPending(data.entries || []);
  };
  const review = async (id: string, decision: 'VERIFIED' | 'REJECTED') => {
    const rationale = (reviewNotes[id] || '').trim();
    if (rationale.length < 10) { setError('Review reason must be at least 10 characters'); return; }
    setBusy(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/accountability/${encodeURIComponent(id)}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, rationale }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Review failed');
      await refreshPending();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };
  if (role === 'admin') return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: '#312e81' }}>ProofPATH • Admin review</Text>
      <Text style={{ marginVertical: 8 }}>Internal review is not confirmation by police or any outside institution.</Text>
      <Pressable onPress={() => refreshPending().catch(e => setError(e.message))} style={{ padding: 12, backgroundColor: '#ddd6fe', borderRadius: 8 }}>
        <Text>Refresh pending accountability entries</Text>
      </Pressable>
      {!!error && <Text style={{ color: '#b91c1c' }}>{error}</Text>}
      <View style={{ flex: 1, gap: 12, marginTop: 12 }}>
        {pending.map(entry => (
          <View key={entry.id} style={{ backgroundColor: 'white', padding: 12, borderRadius: 10 }}>
            <Text style={{ fontWeight: '700' }}>{entry.action_type} • {entry.case_id}</Text>
            <Text>{entry.description}</Text>
            <Text>Reported reference: {entry.reference_number || 'None'}</Text>
            <TextInput placeholder="Reason for decision (10+ characters)" value={reviewNotes[entry.id] || ''} onChangeText={v => setReviewNotes(p => ({...p, [entry.id]: v}))} style={{ borderWidth: 1, borderColor: '#cbd5e1', padding: 8, marginTop: 8 }} />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <Pressable disabled={busy} onPress={() => review(entry.id, 'VERIFIED')}><Text style={{ color: '#047857' }}>Verify record</Text></Pressable>
              <Pressable disabled={busy} onPress={() => review(entry.id, 'REJECTED')}><Text style={{ color: '#b91c1c' }}>Reject record</Text></Pressable>
            </View>
          </View>
        ))}
      </View>
      <Pressable onPress={() => { setAuthToken(''); setToken(''); setUser(null); }}><Text>Sign out</Text></Pressable>
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
