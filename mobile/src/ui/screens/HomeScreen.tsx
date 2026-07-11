import React, { useEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { selectTransactionHistory } from '../../store/slices/transactionSlice';
import { ProductCard } from '../components/ProductCard';
import { colors, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const products = useAppSelector(selectProducts);
  const status = useAppSelector(selectProductsStatus);
  const error = useAppSelector(selectProductsError);
  const cart = useAppSelector(selectCart);
  const history = useAppSelector(selectTransactionHistory);
  const insets = useSafeAreaInsets();

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
      {/* Custom header rendered in the screen body (native header disabled
          for this route): a native-stack headerRight button doesn't fire
          onPress on Android with the New Architecture (open
          react-native-screens bug), so the action icons live in a plain
          View header where touches work normally. */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerTitle}>PayFlow Store</Text>
        <View style={styles.headerActions}>
          {history.length > 0 && (
            <Pressable
              testID="header-history-button"
              accessibilityRole="button"
              accessibilityLabel="Purchase history"
              style={styles.headerButton}
              onPress={() => navigation.navigate('History')}
            >
              <Text style={styles.headerIcon}>🧾</Text>
            </Pressable>
          )}
          {cart.quantity > 0 && (
            <Pressable
              testID="header-cart-button"
              accessibilityRole="button"
              accessibilityLabel={`Cart with ${cart.quantity} items`}
              style={styles.headerButton}
              onPress={() => navigation.navigate('Checkout')}
            >
              <Text style={styles.headerIcon}>🛒</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cart.quantity}</Text>
              </View>
            </Pressable>
          )}
        </View>
      </View>
      {renderContent()}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  headerIcon: {
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: '700',
  },
});
