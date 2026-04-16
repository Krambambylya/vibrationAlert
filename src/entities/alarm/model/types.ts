export type AlarmSettings = {
  id: string;
  hour: number;
  minute: number;
  enabled: boolean;
  vibrationPatternId: string;
  scheduledNotificationId?: string;
};
