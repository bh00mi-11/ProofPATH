import { Slot } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import AppTabs from '@/components/app-tabs';

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      <Slot />
      <AppTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
