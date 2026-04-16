import React, { useEffect, useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { getAlarmSettings, saveAlarmSettings, type AlarmSettings } from '@/entities/alarm';
import { getAllPatterns, type VibrationPattern } from '@/entities/vibration-pattern';
import {
  cancelAlarm,
  ExactAlarmPermissionError,
  openExactAlarmPermissionSettings,
  scheduleAlarm,
} from '@/features/alarm-scheduler';
import { playPattern } from '@/features/pattern-playback';
import { Spacing } from '@/shared/config';
import { useTheme } from '@/shared/lib/hooks';
import { ThemedText, ThemedView, VibrationWaveDiagram } from '@/shared/ui';

function clampTime(value: string, max: number) {
  const numeric = Number(value.replace(/\D/g, ''));
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.min(Math.max(numeric, 0), max);
}

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

export function AlarmTimePage() {
  const theme = useTheme();
  const [alarm, setAlarm] = useState<AlarmSettings | null>(null);
  const [patterns, setPatterns] = useState<VibrationPattern[]>([]);
  const [hourInput, setHourInput] = useState('07');
  const [minuteInput, setMinuteInput] = useState('00');
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [iosPickerDraft, setIosPickerDraft] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAlarmArmed, setIsAlarmArmed] = useState(false);
  const [lastSaved, setLastSaved] = useState<{
    enabled: boolean;
    hour: number;
    minute: number;
    vibrationPatternId: string;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      const [savedAlarm, loadedPatterns] = await Promise.all([getAlarmSettings(), getAllPatterns()]);
      setAlarm(savedAlarm);
      setPatterns(loadedPatterns);
      setHourInput(pad2(savedAlarm.hour));
      setMinuteInput(pad2(savedAlarm.minute));
      setLastSaved({
        enabled: savedAlarm.enabled,
        hour: savedAlarm.hour,
        minute: savedAlarm.minute,
        vibrationPatternId: savedAlarm.vibrationPatternId,
      });
      setIsAlarmArmed(Boolean(savedAlarm.enabled && savedAlarm.scheduledNotificationId));
    };
    load();
  }, []);

  const selectedPattern =
    patterns.find((item) => item.id === alarm?.vibrationPatternId) ??
    patterns[0] ??
    ({ id: 'preset-gentle', name: 'Gentle', sequenceMs: [200, 200, 200], isPreset: true } as VibrationPattern);

  const sortedPatterns = useMemo(() => [...patterns], [patterns]);

  const timePickerValue = useMemo(() => {
    const nextHour = clampTime(hourInput, 23);
    const nextMinute = clampTime(minuteInput, 59);
    const d = new Date();
    d.setHours(nextHour, nextMinute, 0, 0);
    return d;
  }, [hourInput, minuteInput]);

  const onTimePicked = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'ios') {
      if (date) {
        setIosPickerDraft(date);
      }
      return;
    }
    if (Platform.OS === 'android') {
      setTimePickerOpen(false);
    }
    if (event.type !== 'set' || !date) {
      return;
    }
    setHourInput(pad2(date.getHours()));
    setMinuteInput(pad2(date.getMinutes()));
    setIsAlarmArmed(false);
  };

  const openTimePicker = () => {
    if (Platform.OS === 'ios') {
      setIosPickerDraft(timePickerValue);
    }
    setTimePickerOpen(true);
  };

  const closeIosPicker = () => {
    setTimePickerOpen(false);
    setIosPickerDraft(null);
  };

  const confirmIosPicker = () => {
    if (iosPickerDraft) {
      setHourInput(pad2(iosPickerDraft.getHours()));
      setMinuteInput(pad2(iosPickerDraft.getMinutes()));
      setIsAlarmArmed(false);
    }
    closeIosPicker();
  };

  const currentDraft = useMemo(() => {
    if (!alarm) {
      return null;
    }
    const nextHour = clampTime(hourInput, 23);
    const nextMinute = clampTime(minuteInput, 59);
    return {
      enabled: alarm.enabled,
      hour: nextHour,
      minute: nextMinute,
      vibrationPatternId: alarm.vibrationPatternId,
    };
  }, [alarm, hourInput, minuteInput]);

  const isDirty = useMemo(() => {
    if (!lastSaved || !currentDraft) {
      return false;
    }
    return (
      lastSaved.enabled !== currentDraft.enabled ||
      lastSaved.hour !== currentDraft.hour ||
      lastSaved.minute !== currentDraft.minute ||
      lastSaved.vibrationPatternId !== currentDraft.vibrationPatternId
    );
  }, [currentDraft, lastSaved]);

  const onSave = async () => {
    if (!alarm || !selectedPattern || isSaving) {
      return;
    }

    const nextHour = clampTime(hourInput, 23);
    const nextMinute = clampTime(minuteInput, 59);

    const nextAlarm: AlarmSettings = {
      ...alarm,
      hour: nextHour,
      minute: nextMinute,
      vibrationPatternId: selectedPattern.id,
    };

    setIsSaving(true);
    try {
      await cancelAlarm(alarm.id);
      let notificationId: string | undefined = undefined;
      if (nextAlarm.enabled) {
        notificationId = await scheduleAlarm(nextAlarm, selectedPattern);
      }
      await saveAlarmSettings({ ...nextAlarm, scheduledNotificationId: notificationId });
      setAlarm({ ...nextAlarm, scheduledNotificationId: notificationId });
      setLastSaved({
        enabled: nextAlarm.enabled,
        hour: nextAlarm.hour,
        minute: nextAlarm.minute,
        vibrationPatternId: nextAlarm.vibrationPatternId,
      });
      setIsAlarmArmed(Boolean(nextAlarm.enabled && notificationId));
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Haptics may be unavailable on some devices/emulators.
      }
      Alert.alert('Saved', 'Alarm has been updated.');
    } catch (error) {
      if (error instanceof ExactAlarmPermissionError) {
        Alert.alert('Permission required', error.message, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open settings', onPress: () => openExactAlarmPermissionSettings() },
        ]);
        return;
      }
      Alert.alert('Error', (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!alarm) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedText>Loading...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Alarm</ThemedText>

          <ThemedView
            type="background"
            style={[styles.heroSection, { borderColor: theme.surfaceVariant, backgroundColor: theme.background }]}>
            <View style={styles.row}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Enabled
              </ThemedText>
              <Switch
                value={alarm.enabled}
                trackColor={{ false: theme.surfaceVariant, true: theme.primaryContainer }}
                thumbColor={alarm.enabled ? theme.primary : theme.outline}
                onValueChange={(value) => {
                  setAlarm((prev) => (prev ? { ...prev, enabled: value } : prev));
                  setIsAlarmArmed(false);
                }}
              />
            </View>

            <ThemedText type="caption" themeColor="textSecondary">
              Time
            </ThemedText>
            {Platform.OS === 'web' ? (
              <View style={styles.timeRow}>
                <TextInput
                  value={hourInput}
                  onChangeText={(value) => {
                    setHourInput(value);
                    setIsAlarmArmed(false);
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                  style={[styles.timeInput, { borderColor: theme.outline, color: theme.text, backgroundColor: theme.background }]}
                />
                <ThemedText type="subtitle">:</ThemedText>
                <TextInput
                  value={minuteInput}
                  onChangeText={(value) => {
                    setMinuteInput(value);
                    setIsAlarmArmed(false);
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                  style={[styles.timeInput, { borderColor: theme.outline, color: theme.text, backgroundColor: theme.background }]}
                />
              </View>
            ) : (
              <Pressable
                onPress={openTimePicker}
                style={[
                  styles.timePickerPressable,
                  { backgroundColor: theme.background, borderColor: theme.surfaceVariant },
                ]}>
                <ThemedText type="display">{hourInput}:{minuteInput}</ThemedText>
              </Pressable>
            )}

            <ThemedText type="caption" themeColor="textSecondary">
              Repeats daily
            </ThemedText>

            {Platform.OS === 'android' && timePickerOpen ? (
              <DateTimePicker
                value={timePickerValue}
                mode="time"
                is24Hour
                display="default"
                onChange={onTimePicked}
              />
            ) : null}
          </ThemedView>

          <ThemedText type="smallBold" themeColor="textSecondary">
            Patterns
          </ThemedText>
          {sortedPatterns.map((pattern) => (
            <Pressable
              key={pattern.id}
              onPress={() => {
                setAlarm((prev) => (prev ? { ...prev, vibrationPatternId: pattern.id } : prev));
                setIsAlarmArmed(false);
                Haptics.selectionAsync().catch(() => {
                  // Haptics may be unavailable on some devices/emulators.
                });
              }}
              style={styles.patternPress}>
              <ThemedView
                type={alarm.vibrationPatternId === pattern.id ? 'primaryContainer' : 'background'}
                style={styles.patternCard}>
                <View style={styles.patternText}>
                  <ThemedText type="smallBold">{pattern.name}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {pattern.sequenceMs.join(', ')} ms
                  </ThemedText>
                  <VibrationWaveDiagram sequenceMs={pattern.sequenceMs} height={30} />
                </View>
                <Pressable onPress={() => playPattern(pattern)} hitSlop={12}>
                  <ThemedText type="small" themeColor="primary">
                    Preview
                  </ThemedText>
                </Pressable>
                <View pointerEvents="none" style={styles.patternCheck}>
                  <ThemedText
                    type="smallBold"
                    themeColor={alarm.vibrationPatternId === pattern.id ? 'onPrimaryContainer' : 'outline'}>
                    {alarm.vibrationPatternId === pattern.id ? '●' : '○'}
                  </ThemedText>
                </View>
              </ThemedView>
            </Pressable>
          ))}

          {selectedPattern ? (
            <ThemedView type="surfaceContainer" style={styles.selectedDiagramCard}>
              <ThemedText type="smallBold">Selected pattern timeline</ThemedText>
              <VibrationWaveDiagram sequenceMs={selectedPattern.sequenceMs} height={90} showAxis showSegmentLabels />
            </ThemedView>
          ) : null}
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: theme.background }]}>
          <ThemedText type="caption" themeColor="textSecondary">
            {!alarm.enabled ? 'Alarm disabled' : isAlarmArmed ? 'Alarm armed' : 'Save to arm alarm'}
          </ThemedText>
          <Pressable
            onPress={onSave}
            disabled={!isDirty || isSaving}
            style={[
              styles.saveButton,
              { backgroundColor: theme.primary, borderColor: theme.primary },
              !isDirty && isAlarmArmed
                ? { backgroundColor: theme.primaryContainer, borderColor: theme.primaryContainer }
                : null,
              (!isDirty || isSaving) && !( !isDirty && isAlarmArmed) ? styles.saveButtonDisabled : null,
            ]}>
            <ThemedText type="label" themeColor={!isDirty && isAlarmArmed ? 'onPrimaryContainer' : 'onPrimary'}>
              {isSaving ? 'Saving...' : !isDirty && isAlarmArmed ? 'Alarm armed' : 'Save'}
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {Platform.OS === 'ios' ? (
        <Modal visible={timePickerOpen} transparent animationType="slide" onRequestClose={closeIosPicker}>
          <View style={styles.modalBackdrop}>
            <ThemedView type="surfaceContainer" style={styles.modalSheet}>
              <View style={styles.modalActions}>
                <Pressable onPress={closeIosPicker} hitSlop={12}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Cancel
                  </ThemedText>
                </Pressable>
                <Pressable onPress={confirmIosPicker} hitSlop={12}>
                  <ThemedText type="smallBold" themeColor="primary">
                    Done
                  </ThemedText>
                </Pressable>
              </View>
              <DateTimePicker
                value={iosPickerDraft ?? timePickerValue}
                mode="time"
                is24Hour
                display="spinner"
                onChange={onTimePicked}
              />
            </ThemedView>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: 140,
  },
  heroSection: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  timeInput: {
    minWidth: 64,
    borderWidth: 1,
    borderColor: '#5f5f5f',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    color: '#ffffff',
    fontSize: 24,
    textAlign: 'center',
  },
  timePickerPressable: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignSelf: 'flex-start',
  },
  patternText: {
    flex: 1,
    gap: Spacing.one,
  },
  patternPress: {
    borderRadius: Spacing.three,
  },
  patternCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: Spacing.two,
  },
  patternCheck: {
    marginLeft: 'auto',
  },
  selectedDiagramCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    gap: Spacing.one,
  },
  saveButton: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.55,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
