import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface Props {
  quantity: number;
  max: number;
  min?: number;
  onChange: (quantity: number) => void;
}

export function QuantityStepper({ quantity, max, min = 1, onChange }: Props) {
  const canDecrement = quantity > min;
  const canIncrement = quantity < max;

  return (
    <View style={styles.container}>
      <Pressable
        testID="quantity-decrement"
        accessibilityLabel="Decrease quantity"
        disabled={!canDecrement}
        onPress={() => onChange(quantity - 1)}
        style={[styles.button, !canDecrement && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>-</Text>
      </Pressable>
      <Text style={styles.quantity} testID="quantity-value">
        {quantity}
      </Text>
      <Pressable
        testID="quantity-increment"
        accessibilityLabel="Increase quantity"
        disabled={!canIncrement}
        onPress={() => onChange(quantity + 1)}
        style={[styles.button, !canIncrement && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  quantity: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginHorizontal: spacing.md,
    minWidth: 24,
    textAlign: 'center',
  },
});
