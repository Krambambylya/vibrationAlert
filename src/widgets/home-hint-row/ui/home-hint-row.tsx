import React, { type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';
import { ThemedText, ThemedView } from '@/shared/ui';

type HomeHintRowProps = {
  title?: string;
  hint?: ReactNode;
};

export function HomeHintRow({ title = 'Try editing', hint = 'app/index.tsx' }: HomeHintRowProps) {
  return (
    <View style={styles.stepRow}>
      <ThemedText type="small">{title}</ThemedText>
      <ThemedView type="backgroundSelected" style={styles.codeSnippet}>
        <ThemedText themeColor="textSecondary">{hint}</ThemedText>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  codeSnippet: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
});
