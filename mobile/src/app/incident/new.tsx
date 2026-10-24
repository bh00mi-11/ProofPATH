import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionButton, Card, DemoNotice, Screen } from '@/components/proofpath-ui';
import { useCaseContext } from '@/context/case-context';

export default function NewIncidentScreen() {
  const { createCase } = useCaseContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  function saveIncident() {
    if (!title.trim()) {
      setError('Add a short title to continue.');
      return;
    }
    createCase(title.trim(), description.trim() || 'No description added.');
    router.replace('/(tabs)' as Href);
  }

  return (
    <Screen eyebrow="NEW RECORD" title="Document an incident" subtitle="Add only what you want to keep in this local demo record.">
      <DemoNotice>This entry stays in app memory for this session only. It is not saved to a server and is not automatically verified.</DemoNotice>
      <Card>
        <View style={styles.field}>
          <Text style={styles.label}>Incident title</Text>
          <TextInput value={title} onChangeText={(value) => { setTitle(value); setError(''); }} placeholder="Example: Message timeline" placeholderTextColor="#98A2B3" style={styles.input} accessibilityLabel="Incident title" />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Short note <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput value={description} onChangeText={setDescription} placeholder="Add a brief note, or leave this blank" placeholderTextColor="#98A2B3" style={[styles.input, styles.multiline]} multiline textAlignVertical="top" accessibilityLabel="Short note" />
          <Text style={styles.helper}>Entries are user-reported unless reviewed against a source.</Text>
        </View>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      </Card>
      <ActionButton label="Create local demo record" onPress={saveIncident} />
      <ActionButton label="Cancel" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { color: '#172033', fontSize: 14, fontWeight: '700' },
  optional: { color: '#667085', fontWeight: '400' },
  input: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: '#D0D5DD', backgroundColor: '#fff', paddingHorizontal: 12, color: '#172033', fontSize: 15 },
  multiline: { minHeight: 120, paddingTop: 12 },
  helper: { color: '#667085', fontSize: 12, lineHeight: 17 },
  error: { color: '#B42318', fontSize: 13, fontWeight: '700' },
});
