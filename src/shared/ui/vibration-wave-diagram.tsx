import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/shared/lib/hooks';
import { buildWaveSegments, fitSegmentsToWidth, formatDuration, getTotalDurationMs } from '@/shared/lib/vibration';

type VibrationWaveDiagramProps = {
  sequenceMs: number[];
  height?: number;
  showAxis?: boolean;
  showSegmentLabels?: boolean;
  animated?: boolean;
  progress?: number;
};

const DEFAULT_HEIGHT = 56;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildVibratePath(x: number, yTop: number, width: number, yBottom: number) {
  const endX = x + width;
  const p1 = x + width * 0.2;
  const p2 = x + width * 0.5;
  const p3 = x + width * 0.8;

  return [
    `M ${x} ${yBottom}`,
    `L ${x} ${yTop}`,
    `C ${p1} ${yTop - 4}, ${p2} ${yTop + 4}, ${p3} ${yTop - 2}`,
    `C ${x + width * 0.9} ${yTop - 1}, ${endX} ${yTop + 1}, ${endX} ${yTop}`,
    `L ${endX} ${yBottom}`,
    `Z`,
  ].join(' ');
}

export function VibrationWaveDiagram({
  sequenceMs,
  height = DEFAULT_HEIGHT,
  showAxis = false,
  showSegmentLabels = false,
  animated = false,
  progress,
}: VibrationWaveDiagramProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  const segments = useMemo(() => buildWaveSegments(sequenceMs), [sequenceMs]);
  const totalMs = useMemo(() => getTotalDurationMs(segments), [segments]);
  const layout = useMemo(() => fitSegmentsToWidth(segments, width, 3), [segments, width]);

  const axisHeight = showAxis ? 14 : 0;
  const waveTop = 8;
  const waveBottom = Math.max(waveTop + 8, height - axisHeight - 6);
  const pauseTop = waveBottom - (waveBottom - waveTop) * 0.35;
  const vibrateTop = waveTop;
  const playheadProgress = clamp(progress ?? 0, 0, 1);
  const playheadX = width * playheadProgress;

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(Math.max(0, event.nativeEvent.layout.width));
  };

  return (
    <View style={[styles.container, { height }]} onLayout={onLayout}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="activeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={theme.waveActive} stopOpacity={1} />
              <Stop offset="100%" stopColor={theme.waveActive} stopOpacity={0.75} />
            </LinearGradient>
          </Defs>

          {layout.map((segment, index) => {
            const hasLabel = showSegmentLabels && segment.width >= 34;
            const centerX = segment.x + segment.width / 2;
            const labelY = 10;

            return (
              <G key={`${segment.kind}-${segment.startMs}-${index}`}>
                {segment.kind === 'vibrate' ? (
                  <Path
                    d={buildVibratePath(segment.x, vibrateTop, segment.width, waveBottom)}
                    fill="url(#activeGradient)"
                  />
                ) : (
                  <Rect
                    x={segment.x}
                    y={pauseTop}
                    width={segment.width}
                    height={waveBottom - pauseTop}
                    rx={3}
                    fill={theme.wavePause}
                  />
                )}
                {hasLabel ? (
                  <SvgText
                    x={centerX}
                    y={labelY}
                    fontSize="10"
                    fill={theme.waveLabel}
                    textAnchor="middle">
                    {formatDuration(segment.ms)}
                  </SvgText>
                ) : null}
              </G>
            );
          })}

          {showAxis ? (
            <G>
              <Line
                x1={0}
                y1={height - axisHeight + 2}
                x2={width}
                y2={height - axisHeight + 2}
                stroke={theme.waveAxis}
                strokeWidth={1}
              />
              <SvgText x={0} y={height - 2} fontSize="10" fill={theme.waveLabel}>
                0
              </SvgText>
              <SvgText x={width / 2} y={height - 2} fontSize="10" fill={theme.waveLabel} textAnchor="middle">
                {formatDuration(totalMs / 2)}
              </SvgText>
              <SvgText x={width} y={height - 2} fontSize="10" fill={theme.waveLabel} textAnchor="end">
                {formatDuration(totalMs)}
              </SvgText>
            </G>
          ) : null}

          {animated ? (
            <G>
              <Line x1={playheadX} y1={4} x2={playheadX} y2={waveBottom + 2} stroke={theme.primary} strokeWidth={2} />
            </G>
          ) : null}
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

