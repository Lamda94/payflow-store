import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearCart } from '../../store/slices/cartSlice';
import {
  openCheckout,
  resetCheckout,
  selectCardDraft,
} from '../../store/slices/checkoutSlice';
import { fetchProducts } from '../../store/slices/productsSlice';
import {
  archiveCurrentTransaction,
  selectCurrentTransaction,
} from '../../store/slices/transactionSlice';
import { formatMoney } from '../../domain/money';
import { detectCardBrand } from '../../domain/card/brand';
import { colors, spacing, typography } from '../theme';

const BRAND_LABEL: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'MasterCard',
};

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString();
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function PaymentResultView() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const transaction = useAppSelector(selectCurrentTransaction);
  // Card draft lives only in memory (checkout slice is never persisted); it
  // may be empty when the result was recovered after an app restart.
  const card = useAppSelector(selectCardDraft);

  if (!transaction) {
    return null;
  }

  const isApproved = transaction.status === 'APPROVED';
  const cardDigits = card.cardNumber.replace(/\D/g, '');
  const cardLast4 = cardDigits.slice(-4);
  const brand = BRAND_LABEL[detectCardBrand(card.cardNumber)];
  const formattedDate = formatDate(transaction.createdAt);

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

      {!isApproved && (
        <Text style={styles.message}>
          {transaction.status === 'ERROR'
            ? 'The payment provider could not process this card.'
            : 'Your card was declined. Please try a different card.'}
        </Text>
      )}

      <View style={styles.receipt} testID="payment-receipt">
        {transaction.productName !== undefined && (
          <ReceiptRow
            label="Product"
            value={
              transaction.quantity !== undefined && transaction.quantity > 1
                ? `${transaction.productName} × ${transaction.quantity}`
                : transaction.productName
            }
          />
        )}
        <ReceiptRow
          label="Total"
          value={formatMoney(transaction.amountInCents, transaction.currency)}
        />
        {cardLast4.length === 4 && (
          <ReceiptRow
            label="Card"
            value={`${brand ? `${brand} ` : ''}•••• ${cardLast4} · ${
              card.installments
            } installment${card.installments > 1 ? 's' : ''}`}
          />
        )}
        {formattedDate !== '' && <ReceiptRow label="Date" value={formattedDate} />}
        <ReceiptRow label="Reference" value={transaction.reference} />
        <ReceiptRow label="Status" value={transaction.status} />
      </View>

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
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  receipt: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  rowLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginRight: spacing.md,
  },
  rowValue: {
    ...typography.body,
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
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
