import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeUserPatternSequence } from '@/shared/lib/vibration';

import { presetPatterns } from './presets';
import type { VibrationPattern } from './types';

const STORAGE_KEY = 'vibratingclock:user-patterns:v1';

function sanitizePattern(pattern: VibrationPattern): VibrationPattern | null {
  const name = pattern.name.trim();
  const sequence = normalizeUserPatternSequence(pattern.sequenceMs);
  if (!name || sequence.length === 0 || sequence.length > 20) {
    return null;
  }
  return {
    id: pattern.id,
    name,
    sequenceMs: sequence,
    isPreset: false,
  };
}

export async function getAllPatterns(): Promise<VibrationPattern[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return presetPatterns;
  }
  try {
    const parsed = JSON.parse(raw) as VibrationPattern[];
    const custom = parsed.map(sanitizePattern).filter(Boolean) as VibrationPattern[];
    return [...presetPatterns, ...custom];
  } catch {
    return presetPatterns;
  }
}

export async function saveCustomPatterns(patterns: VibrationPattern[]) {
  const custom = patterns.filter((item) => !item.isPreset).map(sanitizePattern).filter(Boolean);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
}
