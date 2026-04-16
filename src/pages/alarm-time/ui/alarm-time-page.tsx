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
      setLastSaved({
        enabled: nextAlarm.enabled,
        hour: nextAlarm.hour,
        minute: nextAlarm.minute,
        vibrationPatternId: nextAlarm.vibrationPatternId,
      });
      setIsAlarmArmed(Boolean(nextAlarm.enabled && notificationId));
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
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Alarm</ThemedText>

          <ThemedView type="backgroundElement" style={styles.section}>
            <View style={styles.row}>
              <ThemedText type="smallBold">Enabled</ThemedText>
              <Switch
                value={alarm.enabled}
              onValueChange={(value) => {
                setAlarm((prev) => (prev ? { ...prev, enabled: value } : prev));
                setIsAlarmArmed(false);
              }}
              />
            </View>

            <ThemedText type="small">Time</ThemedText>
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
                  style={styles.timeInput}
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
                  style={styles.timeInput}
                />
              </View>
            ) : (
              <Pressable onPress={() => setTimePickerOpen(true)} style={styles.timePickerPressable}>
                <ThemedText type="title">{hourInput}:{minuteInput}</ThemedText>
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

          <ThemedText type="smallBold">Patterns</ThemedText>
          {sortedPatterns.map((pattern) => (
            <Pressable
              key={pattern.id}
              onPress={() => {
                setAlarm((prev) => (prev ? { ...prev, vibrationPatternId: pattern.id } : prev));
                setIsAlarmArmed(false);
              }}
              style={styles.patternPress}>
              <ThemedView
                type={alarm.vibrationPatternId === pattern.id ? 'backgroundSelected' : 'backgroundElement'}
                style={styles.patternCard}>
                <View style={styles.patternText}>
                  <ThemedText type="smallBold">{pattern.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {pattern.sequenceMs.join(', ')} ms
                  </ThemedText>
                </View>
                <Pressable onPress={() => playPattern(pattern)} hitSlop={12}>
                  <ThemedText type="small">Preview</ThemedText>
                </Pressable>
              </ThemedView>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.bottomBar}>
          <Pressable
            onPress={onSave}
            disabled={!isDirty}
            style={[styles.saveButton, !isDirty && isAlarmArmed ? styles.saveButtonSaved : null]}>
            <ThemedText type="smallBold">{!isDirty && isAlarmArmed ? 'Saved' : 'Save'}</ThemedText>
          </Pressable>
        </View>
      </View>
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
    paddingBottom: 120,
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
  patternText: {
    flex: 1,
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
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  saveButton: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#5f5f5f',
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  saveButtonSaved: {
    backgroundColor: '#1f7a3f',
    borderColor: '#1f7a3f',
  },
});
