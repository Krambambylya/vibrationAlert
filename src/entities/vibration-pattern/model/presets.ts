import type { VibrationPattern } from './types';

export const presetPatterns: VibrationPattern[] = [
  { id: 'preset-gentle', name: 'Gentle', sequenceMs: [200, 200, 200], isPreset: true },
  { id: 'preset-pulse', name: 'Pulse', sequenceMs: [400, 200, 400, 200, 400], isPreset: true },
  { id: 'preset-intense', name: 'Intense', sequenceMs: [700, 150, 700, 150, 700], isPreset: true },
];
