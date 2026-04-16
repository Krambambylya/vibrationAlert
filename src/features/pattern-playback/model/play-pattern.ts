import { Vibration } from 'react-native';

import type { VibrationPattern } from '@/entities/vibration-pattern';
import { toNativeVibrationPattern } from '@/shared/lib/vibration';

export function playPattern(pattern: VibrationPattern) {
  Vibration.cancel();
  Vibration.vibrate(toNativeVibrationPattern(pattern.sequenceMs), false);
}

export function stopPatternPlayback() {
  Vibration.cancel();
}
