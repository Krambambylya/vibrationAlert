import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import type { VibrationPattern } from '@/entities/vibration-pattern';
import { Spacing } from '@/shared/config';
import { formatDuration, normalizeUserPatternSequence } from '@/shared/lib/vibration';
import { ThemedText, ThemedView, VibrationWaveDiagram } from '@/shared/ui';

type PatternEditorSheetProps = {
  visible: boolean;
  initialPattern?: VibrationPattern | null;
  onClose: () => void;
  onSave: (pattern: VibrationPattern) => void;
};

function parseSequence(input: string) {
  return normalizeUserPatternSequence(
    input
    .split(',')
    .map((part) => Number(part.trim()))
  );
}

export function PatternEditorSheet({
  visible,
  initialPattern,
  onClose,
  onSave,
}: PatternEditorSheetProps) {
  const [name, setName] = useState('');
  const [sequence, setSequence] = useState('400, 200, 400');
  const parsedSequence = useMemo(() => parseSequence(sequence), [sequence]);
  const totalMs = useMemo(() => parsedSequence.reduce((sum, item) => sum + item, 0), [parsedSequence]);

  useEffect(() => {
    if (!initialPattern) {
      setName('');
      setSequence('400, 200, 400');
      return;
    }
    setName(initialPattern.name);
    setSequence(initialPattern.sequenceMs.join(', '));
  }, [initialPattern]);

  const save = () => {
    if (!name.trim() || parsedSequence.length === 0 || parsedSequence.length > 20) {
      return;
    }
    onSave({
      id: initialPattern?.id ?? `custom-${Date.now()}`,
      name: name.trim(),
      sequenceMs: parsedSequence,
      isPreset: false,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ThemedView type="backgroundElement" style={styles.sheet}>
          <ThemedText type="subtitle">{initialPattern ? 'Edit pattern' : 'New pattern'}</ThemedText>
          <ThemedText type="small">Name</ThemedText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Pattern name"
            style={styles.input}
            placeholderTextColor="#7a7a7a"
          />

          <ThemedText type="small">Sequence (vibrate,pause,vibrate... in ms)</ThemedText>
          <TextInput
            value={sequence}
            onChangeText={setSequence}
            placeholder="200, 500, 200, 500"
            style={styles.input}
            placeholderTextColor="#7a7a7a"
          />

          <ThemedView type="surfaceContainer" style={styles.diagramCard}>
            <VibrationWaveDiagram sequenceMs={parsedSequence} height={86} showAxis showSegmentLabels />
            <View style={styles.legendRow}>
              <ThemedText type="caption" themeColor="textSecondary">
                Vibrate + Pause
              </ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                Total: {formatDuration(totalMs)}
              </ThemedText>
            </View>
          </ThemedView>

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.actionButton}>
              <ThemedText type="small">Cancel</ThemedText>
            </Pressable>
            <Pressable onPress={save} style={styles.actionButton}>
              <ThemedText type="smallBold">Save</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderColor: '#4f4f4f',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    color: '#ffffff',
  },
  diagramCard: {
    borderRadius: Spacing.two,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    marginTop: Spacing.two,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.three,
  },
  actionButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
});
