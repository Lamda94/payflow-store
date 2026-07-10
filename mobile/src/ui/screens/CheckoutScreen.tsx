import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  clearCart,
  selectCart,
  selectCartProduct,
  selectCartTotalInCents,
} from '../../store/slices/cartSlice';
import {
  resetCheckout,
  openCheckout,
  selectCheckoutStep,
} from '../../store/slices/checkoutSlice';
import { fetchProducts } from '../../store/slices/productsSlice';
import { archiveCurrentTransaction } from '../../store/slices/transactionSlice';
import { formatMoney } from '../../domain/money';
import { Backdrop } from '../components/Backdrop';
import { CardInfoForm } from '../components/CardInfoForm';
import { PaymentSummaryView } from '../components/PaymentSummaryView';
import { PaymentProcessingView } from '../components/PaymentProcessingView';
import { PaymentResultView } from '../components/PaymentResultView';
import { Toast } from '../components/Toast';
import { colors, spacing, typography } from '../theme';

export function CheckoutScreen() {
  const dispatch = useAppDispatch();
  const cart = useAppSelector(selectCart);
  const product = useAppSelector(selectCartProduct);
  const totalInCents = useAppSelector(selectCartTotalInCents);
  const step = useAppSelector(selectCheckoutStep);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!product) {
    return (
      <View style={styles.center} testID="checkout-empty">
        <Text style={styles.message}>Your cart is empty.</Text>
      </View>
    );
  }

  function handleBackdropClose() {
    if (step === 'processing') {
      // A request is in flight — don't let the user abandon it mid-way.
      return;
    }
    if (step === 'result') {
      dispatch(archiveCurrentTransaction());
      dispatch(clearCart());
      dispatch(fetchProducts());
    }
    dispatch(resetCheckout());
  }

  return (
    <View style={styles.container} testID="checkout-screen">
      <Text style={styles.title}>Order summary</Text>

      <View style={styles.row}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.quantity}>x{cart.quantity}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.label}>Total</Text>
        <Text style={styles.total}>{formatMoney(totalInCents, product.currency)}</Text>
      </View>

      <Pressable
        testID="pay-with-card-button"
        style={styles.payButton}
        onPress={() => dispatch(openCheckout())}
      >
        <Text style={styles.payButtonText}>Pay with credit card</Text>
      </Pressable>

      <Backdrop visible={step !== 'idle'} onClose={handleBackdropClose}>
        {step === 'card-info' && <CardInfoForm />}
        {step === 'summary' && <PaymentSummaryView />}
        {step === 'processing' && <PaymentProcessingView onError={setToastMessage} />}
        {step === 'result' && <PaymentResultView />}
      </Backdrop>

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
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
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  payButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  payButtonText: {
    ...typography.subtitle,
    color: colors.background,
    fontWeight: '700',
  },
});
