/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1B1B1F',
    background: '#FCF8FF',
    backgroundElement: '#F3EDF7',
    backgroundSelected: '#E8DEF8',
    textSecondary: '#49454F',
    surface: '#FCF8FF',
    surfaceVariant: '#E7E0EC',
    surfaceContainer: '#F3EDF7',
    surfaceContainerHigh: '#ECE6F0',
    outline: '#79747E',
    primary: '#6750A4',
    onPrimary: '#FFFFFF',
    primaryContainer: '#EADDFF',
    onPrimaryContainer: '#21005D',
    accent: '#7D5260',
    success: '#1E7D45',
    onSuccess: '#FFFFFF',
  },
  dark: {
    text: '#E6E1E5',
    background: '#10131A',
    backgroundElement: '#1A1F2A',
    backgroundSelected: '#253147',
    textSecondary: '#BFC6D6',
    surface: '#10131A',
    surfaceVariant: '#2A2F3B',
    surfaceContainer: '#1A1F2A',
    surfaceContainerHigh: '#242A36',
    outline: '#8E93A3',
    primary: '#CFBCFF',
    onPrimary: '#381E72',
    primaryContainer: '#4F378B',
    onPrimaryContainer: '#EADDFF',
    accent: '#EFB8C8',
    success: '#52D17D',
    onSuccess: '#0B2E1C',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
