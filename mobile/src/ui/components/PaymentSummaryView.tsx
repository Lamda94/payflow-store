import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectCart, selectCartProduct, selectCartTotalInCents } from '../../store/slices/cartSlice';
import { goToProcessing, openCheckout, selectCardDraft } from '../../store/slices/checkoutSlice';
import { formatMoney } from '../../domain/money';
import { colors, spacing, typography } from '../theme';

export function PaymentSummaryView() {
  const dispatch = useAppDispatch();
  const cart = useAppSelector(selectCart);
  const product = useAppSelector(selectCartProduct);
  const totalInCents = useAppSelector(selectCartTotalInCents);
  const card = useAppSelector(selectCardDraft);

  if (!product) {
    return (
      <View testID="payment-summary-empty">
        <Text style={styles.message}>Your cart is empty.</Text>
      </View>
    );
  }

  const last4 = card.cardNumber.slice(-4);

  return (
    <View testID="payment-summary">
      <Text style={styles.title}>Payment summary</Text>

      <View style={styles.row}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.quantity}>x{cart.quantity}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.label}>Total</Text>
        <Text style={styles.total}>{formatMoney(totalInCents, product.currency)}</Text>
      </View>

      <Text style={styles.cardInfo}>
        Card ending in {last4} · {card.installments} installment
        {card.installments > 1 ? 's' : ''}
      </Text>

      <Pressable
        testID="edit-card-button"
        style={styles.editButton}
        onPress={() => dispatch(openCheckout())}
      >
        <Text style={styles.editButtonText}>Edit card details</Text>
      </Pressable>

      <Pressable testID="pay-button" style={styles.payButton} onPress={() => dispatch(goToProcessing())}>
        <Text style={styles.payButtonText}>Pay {formatMoney(totalInCents, product.currency)}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  productName: {
    ...typography.body,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  quantity: {
    ...typography.body,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  label: {
    ...typography.body,
    color: colors.textSecondary,
  },
  total: {
    ...typography.price,
    fontSize: 20,
    color: colors.primary,
  },
  cardInfo: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
  },
  editButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  editButtonText: {
    ...typography.body,
    color: colors.primary,
  },
  payButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonText: {
    ...typography.subtitle,
    color: colors.background,
    fontWeight: '700',
  },
});
