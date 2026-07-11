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

function ReceiptRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
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
    <View testID="payment-result" style={styles.container}>
      <View
        style={[
          styles.statusCircle,
          isApproved ? styles.statusCircleSuccess : styles.statusCircleFailure,
        ]}
      >
        <Text style={styles.statusGlyph}>{isApproved ? '✓' : '✕'}</Text>
      </View>

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

      <Text style={styles.heroAmount}>
        {formatMoney(transaction.amountInCents, transaction.currency)}
      </Text>

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
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Status</Text>
          <View
            style={[
              styles.statusPill,
              isApproved ? styles.statusPillSuccess : styles.statusPillFailure,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                isApproved ? styles.statusPillTextSuccess : styles.statusPillTextFailure,
              ]}
            >
              {transaction.status}
            </Text>
          </View>
        </View>
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
  container: {
    alignItems: 'stretch',
  },
  statusCircle: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
  },
  statusCircleSuccess: {
    borderColor: colors.success,
  },
  statusCircleFailure: {
    borderColor: colors.danger,
  },
  statusGlyph: {
    fontSize: 30,
    lineHeight: 36,
    color: colors.textPrimary,
  },
  titleSuccess: {
    ...typography.title,
    color: colors.success,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  titleFailure: {
    ...typography.title,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroAmount: {
    ...typography.price,
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  receipt: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + spacing.xs,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
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
  statusPill: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  statusPillSuccess: {
    borderColor: colors.success,
  },
  statusPillFailure: {
    borderColor: colors.danger,
  },
  statusPillText: {
    ...typography.caption,
    fontWeight: '700',
  },
  statusPillTextSuccess: {
    color: colors.success,
  },
  statusPillTextFailure: {
    color: colors.danger,
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
