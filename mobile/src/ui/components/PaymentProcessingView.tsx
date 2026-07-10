import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectCart } from '../../store/slices/cartSlice';
import { goToResult, goToSummary, selectCardDraft, selectCustomerEmail } from '../../store/slices/checkoutSlice';
import {
  createTransaction,
  payTransaction,
  selectCurrentTransaction,
} from '../../store/slices/transactionSlice';
import { colors, spacing, typography } from '../theme';

interface Props {
  onError: (message: string) => void;
}

/**
 * `.unwrap()` on a rejected createAsyncThunk doesn't throw a real Error —
 * it throws the action's SerializedError (`{name, message, stack}`), a
 * plain object that fails `instanceof Error`.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  return 'Something went wrong';
}

/**
 * Orchestrates the real payment call graph while checkout.step === 'processing':
 * POST /transactions (if there's no transaction yet) -> POST /transactions/:id/pay.
 * A rejected call (network/validation/PSP-unreachable) is an unhappy path the
 * user can retry from the summary; a *resolved* call — even DECLINED/ERROR —
 * is a real answer from the backend, so it always advances to the result step.
 */
export function PaymentProcessingView({ onError }: Props) {
  const dispatch = useAppDispatch();
  const cart = useAppSelector(selectCart);
  const customerEmail = useAppSelector(selectCustomerEmail);
  const card = useAppSelector(selectCardDraft);
  const currentTransaction = useAppSelector(selectCurrentTransaction);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) {
      return;
    }
    ranRef.current = true;

    let cancelled = false;

    async function run() {
      try {
        let transactionId = currentTransaction?.id;
        if (!transactionId) {
          const created = await dispatch(
            createTransaction({
              productId: cart.productId as string,
              quantity: cart.quantity,
              customerEmail,
            }),
          ).unwrap();
          transactionId = created.id;
        }

        await dispatch(payTransaction({ transactionId, card })).unwrap();

        if (!cancelled) {
          dispatch(goToResult());
        }
      } catch (error) {
        if (!cancelled) {
          onError(getErrorMessage(error));
          dispatch(goToSummary());
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container} testID="checkout-processing">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>Processing payment…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
