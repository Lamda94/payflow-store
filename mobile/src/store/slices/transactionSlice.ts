import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TransactionRecord } from '../../domain/types';
import type {
  CardPaymentInput,
  CreateTransactionInput,
  PayflowApi,
} from '../../services/api';
import type { RootState } from '../rootReducer';
import type { NetworkStatus } from './productsSlice';

export interface TransactionState {
  current: TransactionRecord | null;
  history: TransactionRecord[];
  status: NetworkStatus;
  error?: string;
}

const initialState: TransactionState = {
  current: null,
  history: [],
  status: 'idle',
};

export const createTransaction = createAsyncThunk<
  TransactionRecord,
  // productName is receipt/history metadata for the local record only — the
  // API input stays exactly CreateTransactionInput.
  CreateTransactionInput & { productName?: string },
  { extra: PayflowApi }
>('transaction/create', async ({ productName, ...input }, { extra }) => {
  const result = await extra.createTransaction(input);
  return {
    id: result.transactionId,
    reference: result.reference,
    status: 'PENDING',
    amountInCents: result.amountInCents,
    currency: result.currency,
    createdAt: new Date().toISOString(),
    productName,
    quantity: input.quantity,
  };
});

export const payTransaction = createAsyncThunk<
  TransactionRecord,
  { transactionId: string; card: CardPaymentInput },
  { extra: PayflowApi; state: RootState }
>('transaction/pay', async ({ transactionId, card }, { extra, getState }) => {
  const result = await extra.payTransaction(transactionId, card);
  const current = getState().transaction.current;
  if (!current) {
    throw new Error('payTransaction: no current transaction to update');
  }
  return { ...current, status: result.status };
});

export const fetchTransactionStatus = createAsyncThunk<
  TransactionRecord,
  string,
  { extra: PayflowApi; state: RootState }
>('transaction/fetchStatus', async (transactionId, { extra, getState }) => {
  const result = await extra.getTransactionStatus(transactionId);
  const current = getState().transaction.current;
  // GET /transactions/:id doesn't echo the reference nor the local
  // receipt metadata; keep what we already have for this transaction
  // (set when it was created).
  const isSame = current?.id === result.id;
  return {
    id: result.id,
    reference: isSame ? current.reference : '',
    status: result.status,
    amountInCents: result.amountInCents,
    currency: result.currency,
    createdAt: result.createdAt,
    productName: isSame ? current.productName : undefined,
    quantity: isSame ? current.quantity : undefined,
  };
});

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    archiveCurrentTransaction: state => {
      if (state.current) {
        state.history.unshift(state.current);
        state.current = null;
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(createTransaction.pending, state => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addCase(
        createTransaction.fulfilled,
        (state, action: PayloadAction<TransactionRecord>) => {
          state.status = 'succeeded';
          state.current = action.payload;
        },
      )
      .addCase(createTransaction.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to create transaction';
      })
      .addCase(payTransaction.pending, state => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addCase(
        payTransaction.fulfilled,
        (state, action: PayloadAction<TransactionRecord>) => {
          state.status = 'succeeded';
          state.current = action.payload;
        },
      )
      .addCase(payTransaction.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Payment failed';
      })
      .addCase(
        fetchTransactionStatus.fulfilled,
        (state, action: PayloadAction<TransactionRecord>) => {
          state.current = action.payload;
        },
      );
  },
});

export const { archiveCurrentTransaction } = transactionSlice.actions;
export const transactionReducer = transactionSlice.reducer;

export const selectCurrentTransaction = (
  state: RootState,
): TransactionRecord | null => state.transaction.current;
export const selectTransactionHistory = (
  state: RootState,
): TransactionRecord[] => state.transaction.history;
export const selectTransactionStatus = (state: RootState): NetworkStatus =>
  state.transaction.status;
