import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

const AUTO_DISMISS_MS = 3500;

interface Props {
  message: string | null;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: Props) {
  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) {
    return null;
  }

  return (
    <View style={styles.container} testID="toast" pointerEvents="none">
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.lg,
    backgroundColor: colors.danger,
    borderRadius: 8,
    padding: spacing.md,
  },
  text: {
    ...typography.body,
    color: colors.background,
    fontWeight: '600',
    textAlign: 'center',
  },
});
