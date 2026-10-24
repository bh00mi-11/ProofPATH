import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Spacing } from '@/constants/theme';

interface FieldCheckboxListProps {
  fields: readonly string[];
  includedFields: string[];
  onToggleField: (field: string) => void;
}

const FIELD_DESCRIPTIONS: Record<string, { label: string; description: string }> = {
  name: {
    label: 'File or item name',
    description: 'The title or filename for each piece of evidence.',
  },
  type: {
    label: 'Item type',
    description: 'Whether it is an image, document, transcript, or session note.',
  },
  ingestedAt: {
    label: 'Date & time added',
    description: 'When this evidence was first recorded in the system.',
  },
  integrity: {
    label: 'Demo check status',
    description: 'Example integrity check showing if the file matches.',
  },
  observations: {
    label: 'Key facts',
    description: 'Short factual details discovered in each item.',
  },
  explanation: {
    label: 'Case notes & reasoning',
    description: 'Helpful explanations showing how facts support or conflict with claims.',
  },
};

export function FieldCheckboxList({
  fields,
  includedFields,
  onToggleField,
}: FieldCheckboxListProps) {
  return (
    <View style={styles.container}>
      {fields.map((field) => {
        const isIncluded = includedFields.includes(field);
        const meta = FIELD_DESCRIPTIONS[field] ?? {
          label: field,
          description: `Controls whether the ${field} field is visible in the report.`,
        };

        return (
          <Pressable
            key={field}
            onPress={() => onToggleField(field)}
            style={({ pressed }) => [pressed && styles.pressed]}>
            <ThemedView
              type="backgroundElement"
              style={[
                styles.row,
                !isIncluded && styles.rowRedacted,
              ]}>
              <View style={styles.textContainer}>
                <ThemedText
                  type="smallBold"
                  style={[
                    styles.label,
                    !isIncluded && styles.strikethrough,
                  ]}>
                  {meta.label}
                </ThemedText>
                <ThemedText type="small" style={styles.descriptionText}>
                  {meta.description}
                </ThemedText>
              </View>

              <View
                style={[
                  styles.pill,
                  isIncluded ? styles.pillIncluded : styles.pillRedacted,
                ]}>
                <ThemedText
                  type="smallBold"
                  style={[
                    styles.pillText,
                    isIncluded ? styles.textIncluded : styles.textRedacted,
                  ]}>
                  {isIncluded ? '✓ Included' : '✕ Hidden'}
                </ThemedText>
              </View>
            </ThemedView>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  row: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BrandColors.border,
    gap: Spacing.two,
  },
  rowRedacted: {
    opacity: 0.75,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  textContainer: {
    flex: 1,
    paddingRight: Spacing.two,
    gap: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 12,
    opacity: 0.65,
    lineHeight: 16,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  pill: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 4,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  pillIncluded: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  pillRedacted: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  textIncluded: {
    color: '#059669',
  },
  textRedacted: {
    color: '#475569',
  },
  pressed: {
    opacity: 0.75,
  },
});
