import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AppTabs } from '@/app/navigation';
import { resyncAlarmSchedule } from '@/features/alarm-scheduler';
import { AnimatedSplashOverlay } from '@/shared/ui';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    resyncAlarmSchedule().catch(() => {
      // Keep startup resilient; UI should remain usable even if resync fails.
    });
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
