import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AlarmSettings } from './types';

const STORAGE_KEY = 'vibratingclock:alarm:v1';

export const DEFAULT_ALARM: AlarmSettings = {
  id: 'primary-alarm',
  hour: 7,
  minute: 0,
  enabled: false,
  vibrationPatternId: 'preset-gentle',
};

export async function getAlarmSettings(): Promise<AlarmSettings> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULT_ALARM;
  }
  try {
    const parsed = JSON.parse(raw) as AlarmSettings;
    return {
      ...DEFAULT_ALARM,
      ...parsed,
    };
  } catch {
    return DEFAULT_ALARM;
  }
}

export async function saveAlarmSettings(alarm: AlarmSettings) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(alarm));
}
