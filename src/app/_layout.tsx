import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { resyncAlarmSchedule } from '@/features/alarm-scheduler';
import { AnimatedSplashOverlay } from '@/shared/ui';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    resyncAlarmSchedule().catch(() => {
      // Keep startup resilient; UI should remain usable even if resync fails.
    });
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar
        style={colorScheme === 'dark' ? 'light' : 'dark'}
        translucent={false}
        backgroundColor={colorScheme === 'dark' ? '#10131A' : '#FCF8FF'}
      />
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </ThemeProvider>
  );
}
