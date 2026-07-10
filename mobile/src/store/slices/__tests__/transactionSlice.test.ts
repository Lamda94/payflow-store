import { configureStore } from '@reduxjs/toolkit';
import {
  archiveCurrentTransaction,
  createTransaction,
  fetchTransactionStatus,
  payTransaction,
  selectCurrentTransaction,
  selectTransactionHistory,
  selectTransactionStatus,
  transactionReducer,
} from '../transactionSlice';
import { rootReducer } from '../../rootReducer';
import type { PayflowApi } from '../../../services/api';

function makeStore(api: Partial<PayflowApi>) {
  return configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ thunk: { extraArgument: api as PayflowApi } }),
  });
}

describe('transactionSlice', () => {
  it('starts idle with no current transaction and empty history', () => {
    const state = transactionReducer(undefined, { type: '@@init' });
    expect(state).toEqual({ current: null, history: [], status: 'idle' });
  });

  it('createTransaction stores the new PENDING transaction', async () => {
    const store = makeStore({
      createTransaction: () =>
        Promise.resolve({
          transactionId: 'tx1',
          reference: 'ref1',
          amountInCents: 1000,
          currency: 'COP',
        }),
    });

    await store.dispatch(
      createTransaction({
        productId: 'p1',
        quantity: 1,
        customerEmail: 'a@b.co',
      }),
    );

    const current = selectCurrentTransaction(store.getState());
    expect(current?.id).toBe('tx1');
    expect(current?.status).toBe('PENDING');
    expect(selectTransactionStatus(store.getState())).toBe('succeeded');
  });

  it('createTransaction failure sets status failed with error message', async () => {
    const store = makeStore({
      createTransaction: () => Promise.reject(new Error('product not found')),
    });

    await store.dispatch(
      createTransaction({
        productId: 'missing',
        quantity: 1,
        customerEmail: 'a@b.co',
      }),
    );

    expect(selectTransactionStatus(store.getState())).toBe('failed');
  });

  it('payTransaction updates the current transaction status on APPROVED', async () => {
    const store = makeStore({
      createTransaction: () =>
        Promise.resolve({
          transactionId: 'tx1',
          reference: 'ref1',
          amountInCents: 1000,
          currency: 'COP',
        }),
      payTransaction: () =>
        Promise.resolve({ status: 'APPROVED', transactionId: 'tx1', pspTransactionId: 'psp1' }),
    });

    await store.dispatch(
      createTransaction({ productId: 'p1', quantity: 1, customerEmail: 'a@b.co' }),
    );
    await store.dispatch(
      payTransaction({
        transactionId: 'tx1',
        card: {
          cardNumber: '4242424242424242',
          holderName: 'Test',
          expirationMonth: '12',
          expirationYear: '2030',
          cvc: '123',
          installments: 1,
        },
      }),
    );

    expect(selectCurrentTransaction(store.getState())?.status).toBe('APPROVED');
  });

  it('payTransaction fails gracefully when there is no current transaction', async () => {
    const store = makeStore({
      payTransaction: () =>
        Promise.resolve({ status: 'APPROVED', transactionId: 'tx1' }),
    });

    await store.dispatch(
      payTransaction({
        transactionId: 'tx1',
        card: {
          cardNumber: '4242424242424242',
          holderName: 'Test',
          expirationMonth: '12',
          expirationYear: '2030',
          cvc: '123',
          installments: 1,
        },
      }),
    );

    expect(selectTransactionStatus(store.getState())).toBe('failed');
    expect(selectCurrentTransaction(store.getState())).toBeNull();
  });

  it('fetchTransactionStatus refreshes the current transaction, keeping its reference (resiliency polling)', async () => {
    const store = makeStore({
      createTransaction: () =>
        Promise.resolve({
          transactionId: 'tx1',
          reference: 'ref1',
          amountInCents: 1000,
          currency: 'COP',
        }),
      getTransactionStatus: () =>
        Promise.resolve({
          id: 'tx1',
          status: 'APPROVED',
          amountInCents: 1000,
          currency: 'COP',
          createdAt: '2026-07-10T00:00:00.000Z',
        }),
    });

    // Simulates the app reopening with a PENDING transaction already in state.
    await store.dispatch(
      createTransaction({ productId: 'p1', quantity: 1, customerEmail: 'a@b.co' }),
    );
    await store.dispatch(fetchTransactionStatus('tx1'));

    expect(selectCurrentTransaction(store.getState())).toEqual({
      id: 'tx1',
      reference: 'ref1',
      status: 'APPROVED',
      amountInCents: 1000,
      currency: 'COP',
      createdAt: '2026-07-10T00:00:00.000Z',
    });
  });

  it('fetchTransactionStatus falls back to an empty reference when there is no matching current transaction', async () => {
    const store = makeStore({
      getTransactionStatus: () =>
        Promise.resolve({
          id: 'tx1',
          status: 'APPROVED',
          amountInCents: 1000,
          currency: 'COP',
          createdAt: '2026-07-10T00:00:00.000Z',
        }),
    });

    await store.dispatch(fetchTransactionStatus('tx1'));

    expect(selectCurrentTransaction(store.getState())?.reference).toBe('');
  });

  it('archiveCurrentTransaction moves current into history and clears current', () => {
    const withCurrent = transactionReducer(undefined, {
      type: createTransaction.fulfilled.type,
      payload: {
        id: 'tx1',
        reference: 'ref1',
        status: 'APPROVED',
        amountInCents: 1000,
        currency: 'COP',
        createdAt: '2026-07-10T00:00:00.000Z',
      },
    });

    const archived = transactionReducer(withCurrent, archiveCurrentTransaction());

    expect(archived.current).toBeNull();
    expect(archived.history).toHaveLength(1);
    expect(archived.history[0].id).toBe('tx1');
  });

  it('archiveCurrentTransaction is a no-op when there is nothing current', () => {
    const state = transactionReducer(undefined, archiveCurrentTransaction());
    expect(state.current).toBeNull();
    expect(state.history).toEqual([]);
  });

  it('falls back to default error messages when the thunk error has none', () => {
    const afterCreateFailure = transactionReducer(undefined, {
      type: createTransaction.rejected.type,
      error: {},
    });
    expect(afterCreateFailure.status).toBe('failed');
    expect(afterCreateFailure.error).toBe('Failed to create transaction');

    const afterPayFailure = transactionReducer(undefined, {
      type: payTransaction.rejected.type,
      error: {},
    });
    expect(afterPayFailure.status).toBe('failed');
    expect(afterPayFailure.error).toBe('Payment failed');
  });

  it('selectTransactionHistory reads the history list', () => {
    const withCurrent = transactionReducer(undefined, {
      type: createTransaction.fulfilled.type,
      payload: {
        id: 'tx1',
        reference: 'ref1',
        status: 'APPROVED',
        amountInCents: 1000,
        currency: 'COP',
        createdAt: '2026-07-10T00:00:00.000Z',
      },
    });
    const archived = transactionReducer(withCurrent, archiveCurrentTransaction());
    const state = { ...rootReducer(undefined, { type: '@@init' }), transaction: archived };

    expect(selectTransactionHistory(state)).toHaveLength(1);
  });
});
