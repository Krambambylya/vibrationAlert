import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAllPatterns, saveCustomPatterns, type VibrationPattern } from '@/entities/vibration-pattern';
import { PatternEditorSheet } from '@/features/pattern-editor';
import { playPattern, stopPatternPlayback } from '@/features/pattern-playback';
import { Spacing } from '@/shared/config';
import { ThemedText, ThemedView } from '@/shared/ui';

export function PatternsPage() {
  const [patterns, setPatterns] = useState<VibrationPattern[]>([]);
  const [editingPattern, setEditingPattern] = useState<VibrationPattern | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const load = useCallback(async () => {
    const all = await getAllPatterns();
    setPatterns(all);
  }, []);

  useEffect(() => {
    load();
    return () => stopPatternPlayback();
  }, [load]);

  const customPatterns = useMemo(() => patterns.filter((item) => !item.isPreset), [patterns]);

  const upsertPattern = async (nextPattern: VibrationPattern) => {
    const next = [...patterns.filter((item) => item.id !== nextPattern.id), nextPattern];
    await saveCustomPatterns(next);
    await load();
  };

  const removePattern = async (pattern: VibrationPattern) => {
    if (pattern.isPreset) {
      return;
    }
    const next = patterns.filter((item) => item.id !== pattern.id);
    await saveCustomPatterns(next);
    await load();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Vibration patterns</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Build patterns and preview them before assigning to the alarm.
        </ThemedText>

        <Pressable
          onPress={() => {
            setEditingPattern(null);
            setIsEditorOpen(true);
          }}
          style={styles.primaryButton}>
          <ThemedText type="smallBold">Create pattern</ThemedText>
        </Pressable>

        {patterns.map((pattern) => (
          <ThemedView key={pattern.id} type="backgroundElement" style={styles.patternCard}>
            <View>
              <ThemedText type="smallBold">{pattern.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {pattern.sequenceMs.join(', ')} ms
              </ThemedText>
            </View>
            <View style={styles.actions}>
              <Pressable onPress={() => playPattern(pattern)}>
                <ThemedText type="small">Play</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => {
                  setEditingPattern(pattern);
                  setIsEditorOpen(true);
                }}>
                <ThemedText type="small">Edit</ThemedText>
              </Pressable>
              <Pressable
                onPress={() =>
                  upsertPattern({
                    ...pattern,
                    id: `custom-${Date.now()}`,
                    isPreset: false,
                    name: `${pattern.name} copy`,
                  })
                }>
                <ThemedText type="small">Duplicate</ThemedText>
              </Pressable>
              {!pattern.isPreset && (
                <Pressable
                  onPress={() =>
                    Alert.alert('Delete pattern?', pattern.name, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => removePattern(pattern) },
                    ])
                  }>
                  <ThemedText type="small">Delete</ThemedText>
                </Pressable>
              )}
            </View>
          </ThemedView>
        ))}

        {customPatterns.length === 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            No custom patterns yet.
          </ThemedText>
        )}
      </ScrollView>

      <PatternEditorSheet
        visible={isEditorOpen}
        initialPattern={editingPattern}
        onClose={() => setIsEditorOpen(false)}
        onSave={upsertPattern}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  primaryButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#5f5f5f',
    alignSelf: 'flex-start',
  },
  patternCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
