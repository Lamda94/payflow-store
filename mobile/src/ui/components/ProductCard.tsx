import React from 'react';
import { Image, Pressable, StyleSheet, Text } from 'react-native';
import type { Product } from '../../domain/types';
import { formatMoney } from '../../domain/money';
import { colors, spacing, typography } from '../theme';

interface Props {
  product: Product;
  onPress: () => void;
}

export function ProductCard({ product, onPress }: Props) {
  const outOfStock = product.stock <= 0;

  return (
    <Pressable
      testID={`product-card-${product.id}`}
      onPress={onPress}
      disabled={outOfStock}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        outOfStock && styles.cardDisabled,
      ]}
    >
      <Image
        source={{ uri: product.imageUrl }}
        style={styles.image}
        resizeMode="cover"
        accessibilityLabel={product.name}
      />
      <Text style={styles.name} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={styles.price}>{formatMoney(product.priceInCents, product.currency)}</Text>
      <Text style={outOfStock ? styles.outOfStock : styles.stock}>
        {outOfStock ? 'Out of stock' : `${product.stock} in stock`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: spacing.sm,
    backgroundColor: colors.border,
  },
  name: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  price: {
    ...typography.price,
    color: colors.primary,
  },
  stock: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  outOfStock: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
