import React, { useEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchProducts,
  selectProducts,
  selectProductsError,
  selectProductsStatus,
} from '../../store/slices/productsSlice';
import { selectCart } from '../../store/slices/cartSlice';
import { ProductCard } from '../components/ProductCard';
import { CartBadge } from '../components/CartBadge';
import { colors, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// Declared in RootNavigator's static screen options — NOT via
// navigation.setOptions() in a useEffect, which triggers a known
// react-navigation bug ("Rendered more/fewer hooks than expected") when a
// custom headerRight is set imperatively. See
// https://github.com/react-navigation/react-navigation/issues/11600
export function HomeHeaderRight() {
  const cart = useAppSelector(selectCart);
  return <CartBadge quantity={cart.quantity} />;
}

export function HomeScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const products = useAppSelector(selectProducts);
  const status = useAppSelector(selectProductsStatus);
  const error = useAppSelector(selectProductsError);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchProducts());
    }
  }, [status, dispatch]);

  if (status === 'loading' || status === 'idle') {
    return (
      <View style={styles.center} testID="home-loading">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (status === 'failed') {
    return (
      <View style={styles.center} testID="home-error">
        <Text style={styles.message}>{error ?? 'Something went wrong'}</Text>
        <Pressable style={styles.retryButton} onPress={() => dispatch(fetchProducts())}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.center} testID="home-empty">
        <Text style={styles.message}>No products available right now</Text>
      </View>
    );
  }

  return (
    <FlatList
      testID="home-product-list"
      style={styles.flatList}
      contentContainerStyle={styles.list}
      data={products}
      keyExtractor={item => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <ProductCard
          product={item}
          onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  flatList: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
  },
  row: {
    justifyContent: 'space-between',
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
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  retryText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '600',
  },
});
