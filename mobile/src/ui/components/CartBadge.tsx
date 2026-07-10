import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';

interface Props {
  quantity: number;
}

export function CartBadge({ quantity }: Props) {
  if (quantity <= 0) {
    return null;
  }

  return (
    <View style={styles.badge} testID="cart-badge">
      <Text style={styles.text}>{quantity}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  text: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '700',
  },
});
