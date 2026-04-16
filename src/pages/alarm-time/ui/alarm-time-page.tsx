import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
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
import { ThemedText, ThemedView } from '@/shared/ui';

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
  const [alarm, setAlarm] = useState<AlarmSettings | null>(null);
  const [patterns, setPatterns] = useState<VibrationPattern[]>([]);
  const [hourInput, setHourInput] = useState('07');
  const [minuteInput, setMinuteInput] = useState('00');
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [savedAlarm, loadedPatterns] = await Promise.all([getAlarmSettings(), getAllPatterns()]);
      setAlarm(savedAlarm);
      setPatterns(loadedPatterns);
      setHourInput(pad2(savedAlarm.hour));
      setMinuteInput(pad2(savedAlarm.minute));
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
    if (Platform.OS === 'android') {
      setTimePickerOpen(false);
    }
    if (event.type !== 'set' || !date) {
      return;
    }
    setHourInput(pad2(date.getHours()));
    setMinuteInput(pad2(date.getMinutes()));
  };

  const onSave = async () => {
    if (!alarm || !selectedPattern) {
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

    try {
      await cancelAlarm(alarm.id);
      let notificationId: string | undefined = undefined;
      if (nextAlarm.enabled) {
        notificationId = await scheduleAlarm(nextAlarm, selectedPattern);
      }
      await saveAlarmSettings({ ...nextAlarm, scheduledNotificationId: notificationId });
      setAlarm({ ...nextAlarm, scheduledNotificationId: notificationId });
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
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Alarm time</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Silent alarm with vibration only.
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.section}>
          <View style={styles.row}>
            <ThemedText type="smallBold">Enable alarm</ThemedText>
            <Switch
              value={alarm.enabled}
              onValueChange={(value) => setAlarm((prev) => (prev ? { ...prev, enabled: value } : prev))}
            />
          </View>

          <ThemedText type="small">Time (HH:mm)</ThemedText>
          {Platform.OS === 'web' ? (
            <View style={styles.timeRow}>
              <TextInput
                value={hourInput}
                onChangeText={setHourInput}
                keyboardType="number-pad"
                maxLength={2}
                style={styles.timeInput}
              />
              <ThemedText type="subtitle">:</ThemedText>
              <TextInput
                value={minuteInput}
                onChangeText={setMinuteInput}
                keyboardType="number-pad"
                maxLength={2}
                style={styles.timeInput}
              />
            </View>
          ) : (
            <Pressable onPress={() => setTimePickerOpen(true)} style={styles.timePickerPressable}>
              <ThemedText type="subtitle">{hourInput}:{minuteInput}</ThemedText>
            </Pressable>
          )}

          {Platform.OS !== 'web' && timePickerOpen ? (
            <DateTimePicker
              value={timePickerValue}
              mode="time"
              is24Hour
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimePicked}
            />
          ) : null}
        </ThemedView>

        <ThemedText type="smallBold">Pattern</ThemedText>
        {sortedPatterns.map((pattern) => (
          <Pressable
            key={pattern.id}
            onPress={() => setAlarm((prev) => (prev ? { ...prev, vibrationPatternId: pattern.id } : prev))}
            style={styles.patternPress}>
            <ThemedView
              type={alarm.vibrationPatternId === pattern.id ? 'backgroundSelected' : 'backgroundElement'}
              style={styles.patternCard}>
              <View>
                <ThemedText type="smallBold">{pattern.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {pattern.sequenceMs.join(', ')} ms
                </ThemedText>
              </View>
              <Pressable onPress={() => playPattern(pattern)}>
                <ThemedText type="small">Preview</ThemedText>
              </Pressable>
            </ThemedView>
          </Pressable>
        ))}

        <Pressable onPress={onSave} style={styles.saveButton}>
          <ThemedText type="smallBold">Save alarm</ThemedText>
        </Pressable>
      </ScrollView>
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
  section: {
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
    borderColor: '#5f5f5f',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignSelf: 'flex-start',
  },
  patternPress: {
    borderRadius: Spacing.three,
  },
  patternCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveButton: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#5f5f5f',
    alignSelf: 'flex-start',
  },
});
