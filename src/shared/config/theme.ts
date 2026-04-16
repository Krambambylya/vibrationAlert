/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1B1B1F',
    background: '#F7FAFF',
    backgroundElement: '#EDF4FF',
    backgroundSelected: '#DDEBFF',
    textSecondary: '#49454F',
    surface: '#F7FAFF',
    surfaceVariant: '#DCE6F5',
    surfaceContainer: '#EDF4FF',
    surfaceContainerHigh: '#E5EEFA',
    outline: '#79747E',
    primary: '#3B82F6',
    onPrimary: '#FFFFFF',
    primaryContainer: '#DDEBFF',
    onPrimaryContainer: '#0F3A7A',
    accent: '#5E84C4',
    success: '#1E7D45',
    onSuccess: '#FFFFFF',
    waveActive: '#3B82F6',
    wavePause: '#C6D8F4',
    waveAxis: '#7F93B3',
    waveLabel: '#4D5F7D',
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
    primary: '#9CC7FF',
    onPrimary: '#083A7A',
    primaryContainer: '#1E4E8D',
    onPrimaryContainer: '#D9E9FF',
    accent: '#9CC7FF',
    success: '#52D17D',
    onSuccess: '#0B2E1C',
    waveActive: '#9CC7FF',
    wavePause: '#3A4151',
    waveAxis: '#677083',
    waveLabel: '#ABB4C8',
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
