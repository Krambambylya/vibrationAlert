import { normalizeUserPatternSequence } from './pattern';

export type WaveSegmentKind = 'vibrate' | 'pause';

export type WaveSegment = {
  kind: WaveSegmentKind;
  ms: number;
  startMs: number;
  endMs: number;
};

export type WaveLayoutSegment = WaveSegment & {
  x: number;
  width: number;
};

const DEFAULT_SEQUENCE = [300];
const MIN_VISIBLE_MS = 1;

export function buildWaveSegments(sequenceMs: number[]): WaveSegment[] {
  const normalized = normalizeUserPatternSequence(sequenceMs);
  const source = normalized.length > 0 ? normalized : DEFAULT_SEQUENCE;

  let cursor = 0;
  return source.map((rawMs, index) => {
    const ms = Math.max(MIN_VISIBLE_MS, Math.round(rawMs));
    const segment: WaveSegment = {
      kind: index % 2 === 0 ? 'vibrate' : 'pause',
      ms,
      startMs: cursor,
      endMs: cursor + ms,
    };
    cursor += ms;
    return segment;
  });
}

export function getTotalDurationMs(segments: WaveSegment[]): number {
  if (segments.length === 0) {
    return 0;
  }
  return segments[segments.length - 1]!.endMs;
}

export function fitSegmentsToWidth(
  segments: WaveSegment[],
  width: number,
  minPxPerSegment = 3,
): WaveLayoutSegment[] {
  if (segments.length === 0 || width <= 0) {
    return [];
  }

  const totalMs = getTotalDurationMs(segments);
  if (totalMs <= 0) {
    const evenWidth = width / segments.length;
    return segments.map((segment, index) => ({
      ...segment,
      x: index * evenWidth,
      width: evenWidth,
    }));
  }

  const rawWidths = segments.map((segment) => (segment.ms / totalMs) * width);
  const layout = rawWidths.map((item) => Math.max(minPxPerSegment, item));
  const minRequired = layout.reduce((sum, item) => sum + item, 0);

  if (minRequired > width) {
    // Fallback: distribute width evenly when min pixels overflow container.
    const evenWidth = width / segments.length;
    let x = 0;
    return segments.map((segment, index) => {
      const currentWidth = index === segments.length - 1 ? width - x : evenWidth;
      const next: WaveLayoutSegment = {
        ...segment,
        x,
        width: Math.max(0, currentWidth),
      };
      x += currentWidth;
      return next;
    });
  }

  const scale = width / minRequired;
  let x = 0;
  return segments.map((segment, index) => {
    const scaled = layout[index]! * scale;
    const currentWidth = index === segments.length - 1 ? width - x : scaled;
    const next: WaveLayoutSegment = {
      ...segment,
      x,
      width: Math.max(0, currentWidth),
    };
    x += currentWidth;
    return next;
  });
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return '0 ms';
  }
  if (ms < 1000) {
    return `${Math.round(ms)} ms`;
  }
  const seconds = ms / 1000;
  if (seconds < 10) {
    return `${seconds.toFixed(1)} s`;
  }
  return `${Math.round(seconds)} s`;
}

