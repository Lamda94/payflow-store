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
import { colors, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const products = useAppSelector(selectProducts);
  const status = useAppSelector(selectProductsStatus);
  const error = useAppSelector(selectProductsError);
  const cart = useAppSelector(selectCart);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchProducts());
    }
  }, [status, dispatch]);

  function renderContent() {
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

  return (
    <View style={styles.container}>
      {renderContent()}
      {/* A native-stack headerRight button doesn't fire onPress on Android
          with the New Architecture (open react-native-screens bug) — the
          cart entry point lives in the screen body instead, as a FAB. */}
      {cart.quantity > 0 && (
        <Pressable testID="cart-fab" style={styles.cartFab} onPress={() => navigation.navigate('Checkout')}>
          <Text style={styles.cartFabText}>Cart ({cart.quantity})</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  cartFab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cartFabText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '700',
  },
});
