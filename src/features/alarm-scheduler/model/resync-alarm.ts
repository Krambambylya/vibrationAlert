import { getAlarmSettings, saveAlarmSettings } from '@/entities/alarm';
import { getAllPatterns } from '@/entities/vibration-pattern';

import { cancelAlarm } from './cancel-alarm';
import { scheduleAlarm } from './schedule-alarm';

export async function resyncAlarmSchedule() {
  const alarm = await getAlarmSettings();
  if (!alarm.enabled) {
    return;
  }

  const patterns = await getAllPatterns();
  const pattern = patterns.find((item) => item.id === alarm.vibrationPatternId) ?? patterns[0];
  if (!pattern) {
    return;
  }

  await cancelAlarm(alarm.id);
  const newAlarmId = await scheduleAlarm(alarm, pattern);
  await saveAlarmSettings({ ...alarm, scheduledNotificationId: newAlarmId });
}
