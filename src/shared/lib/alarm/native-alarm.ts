import { NativeModules, Platform } from 'react-native';

import { toNativeVibrationPattern } from '@/shared/lib/vibration';

type AlarmPattern = {
  sequenceMs: number[];
};

type AlarmClockNativeModule = {
  hasExactAlarmPermission: () => Promise<boolean>;
  openExactAlarmSettings: () => void;
  scheduleAlarm: (
    alarmId: string,
    hour: number,
    minute: number,
    pattern: number[],
  ) => Promise<{ alarmId: string; triggerAt: number }>;
  cancelAlarm: (alarmId: string) => Promise<void>;
};

const nativeModule = NativeModules.AlarmClockModule as AlarmClockNativeModule | undefined;

function ensureAndroid() {
  if (Platform.OS !== 'android') {
    throw new Error('Native alarm scheduler is supported only on Android.');
  }
  if (!nativeModule) {
    throw new Error('AlarmClockModule is not available. Rebuild Android app.');
  }
}

export async function ensureAlarmPermissions() {
  ensureAndroid();
  const hasExact = await nativeModule!.hasExactAlarmPermission();
  return {
    exactAlarmGranted: hasExact,
  };
}

export async function openExactAlarmPermissionSettings() {
  ensureAndroid();
  nativeModule!.openExactAlarmSettings();
}

export async function scheduleNativeAlarm(args: {
  alarmId: string;
  hour: number;
  minute: number;
  pattern: AlarmPattern;
}) {
  ensureAndroid();
  const nativePattern = toNativeVibrationPattern(args.pattern.sequenceMs);
  return nativeModule!.scheduleAlarm(args.alarmId, args.hour, args.minute, nativePattern);
}

export async function cancelNativeAlarm(alarmId: string) {
  ensureAndroid();
  await nativeModule!.cancelAlarm(alarmId);
}
