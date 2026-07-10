import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearCart } from '../../store/slices/cartSlice';
import { openCheckout, resetCheckout } from '../../store/slices/checkoutSlice';
import { fetchProducts } from '../../store/slices/productsSlice';
import {
  archiveCurrentTransaction,
  selectCurrentTransaction,
} from '../../store/slices/transactionSlice';
import { formatMoney } from '../../domain/money';
import { colors, spacing, typography } from '../theme';

export function PaymentResultView() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const transaction = useAppSelector(selectCurrentTransaction);

  if (!transaction) {
    return null;
  }

  const isApproved = transaction.status === 'APPROVED';

  function backToHome() {
    dispatch(archiveCurrentTransaction());
    dispatch(clearCart());
    dispatch(resetCheckout());
    dispatch(fetchProducts());
    navigation.navigate('Home');
  }

  function tryAgain() {
    dispatch(archiveCurrentTransaction());
    dispatch(openCheckout());
  }

  return (
    <View testID="payment-result">
      <Text style={isApproved ? styles.titleSuccess : styles.titleFailure}>
        {isApproved ? 'Payment approved' : 'Payment declined'}
      </Text>

      {isApproved ? (
        <>
          <Text style={styles.label}>Reference</Text>
          <Text style={styles.value}>{transaction.reference}</Text>
          <Text style={styles.amount}>
            {formatMoney(transaction.amountInCents, transaction.currency)}
          </Text>
        </>
      ) : (
        <Text style={styles.message}>
          {transaction.status === 'ERROR'
            ? 'The payment provider could not process this card.'
            : 'Your card was declined. Please try a different card.'}
        </Text>
      )}

      {!isApproved && (
        <Pressable testID="try-again-button" style={styles.secondaryButton} onPress={tryAgain}>
          <Text style={styles.secondaryButtonText}>Try again</Text>
        </Pressable>
      )}

      <Pressable testID="back-to-home-button" style={styles.primaryButton} onPress={backToHome}>
        <Text style={styles.primaryButtonText}>Back to Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  titleSuccess: {
    ...typography.title,
    color: colors.success,
    marginBottom: spacing.md,
  },
  titleFailure: {
    ...typography.title,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  value: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  amount: {
    ...typography.price,
    fontSize: 22,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.subtitle,
    color: colors.background,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  secondaryButtonText: {
    ...typography.body,
    color: colors.primary,
  },
});
