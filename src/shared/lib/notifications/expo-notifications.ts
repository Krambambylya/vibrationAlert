import { Platform } from 'react-native';
import { getPatternFingerprint, toNativeVibrationPattern } from '@/shared/lib/vibration';

const CHANNEL_BASE = 'alarm-vibration';
type NotificationPatternConfig = {
  id: string;
  name: string;
  sequenceMs: number[];
};

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null = null;
let notificationsUnavailable = false;
let handlerInitialized = false;

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (notificationsUnavailable) {
    return null;
  }

  if (notificationsModule) {
    return notificationsModule;
  }

  try {
    notificationsModule = await import('expo-notifications');
    return notificationsModule;
  } catch {
    notificationsUnavailable = true;
    return null;
  }
}

async function ensureNotificationHandler() {
  if (handlerInitialized) {
    return;
  }
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  handlerInitialized = true;
}

export async function requestNotificationPermissions() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return false;
  }
  await ensureNotificationHandler();
  const current = await Notifications.getPermissionsAsync();
  const currentRaw = current as unknown as { granted?: boolean; ios?: { status?: string } };
  if (currentRaw.granted || currentRaw.ios?.status === 'granted') {
    return true;
  }
  const asked = await Notifications.requestPermissionsAsync();
  const askedRaw = asked as unknown as { granted?: boolean; ios?: { status?: string } };
  return Boolean(askedRaw.granted || askedRaw.ios?.status === 'granted');
}

export async function ensureVibrationChannel(pattern: NotificationPatternConfig) {
  if (Platform.OS !== 'android') {
    return undefined;
  }
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return undefined;
  }
  const fingerprint = getPatternFingerprint(pattern.sequenceMs);
  const channelId = `${CHANNEL_BASE}-${pattern.id}-${fingerprint}`;
  await Notifications.setNotificationChannelAsync(channelId, {
    name: `Alarm ${pattern.name}`,
    importance: Notifications.AndroidImportance.MAX,
    sound: null,
    vibrationPattern: toNativeVibrationPattern(pattern.sequenceMs),
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
  });
  return channelId;
}

export async function scheduleLocalAlarmNotification(opts: {
  hour: number;
  minute: number;
  pattern: NotificationPatternConfig;
}) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    throw new Error('Local notifications require a development build (Expo Go is not supported).');
  }
  await ensureNotificationHandler();
  const channelId = await ensureVibrationChannel(opts.pattern);
  const triggerDate = new Date();
  triggerDate.setHours(opts.hour, opts.minute, 0, 0);
  if (triggerDate.getTime() <= Date.now()) {
    triggerDate.setDate(triggerDate.getDate() + 1);
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Alarm',
      body: `Time to wake up (${opts.pattern.name})`,
      priority: Notifications.AndroidNotificationPriority.MAX,
      ...(channelId ? { channelId } : null),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

export async function cancelScheduledNotification(notificationId?: string) {
  if (!notificationId) {
    return;
  }
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function getScheduledNotifications() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return [];
  }
  return Notifications.getAllScheduledNotificationsAsync();
}
