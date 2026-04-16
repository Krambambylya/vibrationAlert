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

  useEffect(() => {
    const globalEvents = globalThis as unknown as {
      addEventListener?: (type: string, listener: (event: unknown) => void) => void;
      removeEventListener?: (type: string, listener: (event: unknown) => void) => void;
    };

    const handleUnhandledRejection = (event: unknown) => {
      const rejection = event as {
        reason?: unknown;
        preventDefault?: () => void;
      };
      const message =
        rejection.reason instanceof Error
          ? rejection.reason.message
          : typeof rejection.reason === 'string'
            ? rejection.reason
            : '';

      if (
        message.includes("ExpoKeepAwake.activate") &&
        message.toLowerCase().includes('current activity is no longer available')
      ) {
        rejection.preventDefault?.();
      }
    };

    globalEvents.addEventListener?.('unhandledrejection', handleUnhandledRejection);
    return () => {
      globalEvents.removeEventListener?.('unhandledrejection', handleUnhandledRejection);
    };
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
