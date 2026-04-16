export function normalizeUserPatternSequence(sequence: number[]) {
  const withoutLegacyDelay =
    sequence.length > 0 && Number(sequence[0]) === 0 ? sequence.slice(1) : sequence;

  return withoutLegacyDelay
    .map((value) => Math.round(value))
    .filter((value) => Number.isFinite(value) && value > 0 && value <= 5000);
}

export function toNativeVibrationPattern(userSequence: number[]) {
  const normalized = normalizeUserPatternSequence(userSequence);
  if (normalized.length === 0) {
    return [0, 300];
  }
  // React Native and Android notification channels interpret the first item as delay.
  // We prepend 0 so user input "200,500,200,500" means vibrate 200, pause 500, etc.
  return [0, ...normalized];
}

export function getPatternFingerprint(userSequence: number[]) {
  const normalized = normalizeUserPatternSequence(userSequence);
  let hash = 0;
  for (const value of normalized) {
    hash = (hash * 31 + value) >>> 0;
  }
  return hash.toString(36);
}
