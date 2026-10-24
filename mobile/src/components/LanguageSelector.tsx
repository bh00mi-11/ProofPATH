import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useTranslation } from '@/context/LanguageContext';
import { BrandColors, Spacing } from '@/constants/theme';
import { SupportedLanguage } from '@/i18n/types';

export function LanguageSelector() {
  const { language, setLanguage, availableLanguages } = useTranslation();

  return (
    <View style={styles.container} accessibilityRole="toolbar" accessibilityLabel="Language selector">
      {availableLanguages.map((lang) => {
        const isActive = language === lang.code;
        return (
          <Pressable
            key={lang.code}
            onPress={() => setLanguage(lang.code)}
            style={({ pressed }) => [
              styles.pill,
              isActive ? styles.pillActive : styles.pillInactive,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`Switch language to ${lang.label}`}>
            <Text style={[styles.pillText, isActive ? styles.pillTextActive : styles.pillTextInactive]}>
              {lang.nativeLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    padding: 3,
    gap: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pill: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.two,
    borderRadius: 16,
  },
  pillActive: {
    backgroundColor: BrandColors.indigo,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  pillInactive: {
    backgroundColor: 'transparent',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pillTextInactive: {
    color: '#475569',
  },
  pressed: {
    opacity: 0.7,
  },
});
