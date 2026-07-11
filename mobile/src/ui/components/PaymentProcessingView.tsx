import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectCart } from '../../store/slices/cartSlice';
import { goToResult, goToSummary, selectCardDraft, selectCustomerEmail } from '../../store/slices/checkoutSlice';
import {
  createTransaction,
  fetchTransactionStatus,
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

/** Backend error `code` — survives thunk serialization (see ApiError). */
function getErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string') {
      return code;
    }
  }
  return undefined;
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
      // Only a PENDING transaction can be (re)paid — reusing one lets a
      // retry after a failed pay skip re-creating it. A *finalized* one
      // (APPROVED/DECLINED/ERROR) can linger in persisted state when the
      // app dies before the result screen archives it, and the backend
      // rejects paying it again ("Transaction already processed"), so a
      // new purchase must start from a fresh transaction.
      let transactionId =
        currentTransaction?.status === 'PENDING' ? currentTransaction.id : undefined;
      try {
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
        if (cancelled) {
          return;
        }
        // TRANSACTION_ALREADY_PROCESSED means an earlier pay attempt DID
        // finalize this transaction but its response never reached us (e.g.
        // the request timed out client-side). The backend already has the
        // real outcome — fetch it and show the result instead of an error,
        // which would otherwise loop the user on the Pay button forever.
        if (
          getErrorCode(error) === 'TRANSACTION_ALREADY_PROCESSED' &&
          transactionId !== undefined
        ) {
          try {
            await dispatch(fetchTransactionStatus(transactionId)).unwrap();
            if (!cancelled) {
              dispatch(goToResult());
            }
            return;
          } catch {
            // Couldn't recover the real status — fall through to the
            // generic error path so the user can retry from the summary.
          }
        }
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
