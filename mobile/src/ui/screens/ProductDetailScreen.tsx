import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProducts, selectProductById, selectProductsStatus } from '../../store/slices/productsSlice';
import { selectProduct as addProductToCart } from '../../store/slices/cartSlice';
import { formatMoney } from '../../domain/money';
import { QuantityStepper } from '../components/QuantityStepper';
import { colors, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export function ProductDetailScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const dispatch = useAppDispatch();
  const product = useAppSelector(selectProductById(productId));
  const productsStatus = useAppSelector(selectProductsStatus);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!product && productsStatus === 'idle') {
      dispatch(fetchProducts());
    }
  }, [product, productsStatus, dispatch]);

  if (!product) {
    return (
      <View style={styles.center} testID="product-detail-not-found">
        <Text style={styles.message}>Product not found</Text>
      </View>
    );
  }

  const outOfStock = product.stock <= 0;

  return (
    <View style={styles.container} testID="product-detail-screen">
      <Image
        source={{ uri: product.imageUrl }}
        style={styles.image}
        resizeMode="cover"
        accessibilityLabel={product.name}
      />
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.description}>{product.description}</Text>
      <Text style={styles.price}>{formatMoney(product.priceInCents, product.currency)}</Text>

      {outOfStock ? (
        <Text style={styles.outOfStock}>Out of stock</Text>
      ) : (
        <>
          <QuantityStepper quantity={quantity} max={product.stock} onChange={setQuantity} />
          <Pressable
            testID="add-to-cart-button"
            style={styles.addButton}
            onPress={() => {
              dispatch(addProductToCart({ productId: product.id, quantity }));
              navigation.navigate('Home');
            }}
          >
            <Text style={styles.addButtonText}>Add to cart</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  name: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  price: {
    ...typography.price,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  outOfStock: {
    ...typography.body,
    color: colors.danger,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  addButtonText: {
    ...typography.subtitle,
    color: colors.background,
    fontWeight: '700',
  },
});
