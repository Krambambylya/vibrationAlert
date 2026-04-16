import { cancelNativeAlarm } from '@/shared/lib/alarm';

export async function cancelAlarm(alarmId?: string) {
  await cancelNativeAlarm(alarmId ?? 'primary-alarm');
}
