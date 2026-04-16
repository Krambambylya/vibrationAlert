import type { AlarmSettings } from '@/entities/alarm';
import type { VibrationPattern } from '@/entities/vibration-pattern';
import {
  ensureAlarmPermissions,
  scheduleNativeAlarm,
} from '@/shared/lib/alarm';

export class ExactAlarmPermissionError extends Error {
  constructor() {
    super('Allow exact alarms in Android settings to save this alarm.');
    this.name = 'ExactAlarmPermissionError';
  }
}

export async function scheduleAlarm(alarm: AlarmSettings, pattern: VibrationPattern) {
  const permissions = await ensureAlarmPermissions();
  if (!permissions.exactAlarmGranted) {
    throw new ExactAlarmPermissionError();
  }
  const result = await scheduleNativeAlarm({
    alarmId: alarm.id,
    hour: alarm.hour,
    minute: alarm.minute,
    pattern,
  });

  return result.alarmId;
}
