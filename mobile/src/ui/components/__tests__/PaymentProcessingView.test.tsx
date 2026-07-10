import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { PaymentProcessingView } from '../PaymentProcessingView';
import { createTestStore, storeWrapper, type PayflowApi } from '../../../test-utils/testStore';
import { selectProduct } from '../../../store/slices/cartSlice';
import {
  selectCheckoutStep,
  setCardField,
  setCustomerEmail,
} from '../../../store/slices/checkoutSlice';
import {
  createTransaction,
  selectCurrentTransaction,
} from '../../../store/slices/transactionSlice';

function setupCheckoutState(store: ReturnType<typeof createTestStore>) {
  store.dispatch(selectProduct({ productId: 'p1', quantity: 1 }));
  store.dispatch(setCustomerEmail('buyer@example.com'));
  store.dispatch(setCardField({ field: 'cardNumber', value: '4242424242424242' }));
  store.dispatch(setCardField({ field: 'holderName', value: 'JOHN DOE' }));
  store.dispatch(setCardField({ field: 'expirationMonth', value: '12' }));
  store.dispatch(setCardField({ field: 'expirationYear', value: '2030' }));
  store.dispatch(setCardField({ field: 'cvc', value: '123' }));
}

describe('PaymentProcessingView', () => {
  it('creates a transaction, pays it, and advances to result on APPROVED', async () => {
    const api: Partial<PayflowApi> = {
      createTransaction: () =>
        Promise.resolve({
          transactionId: 'tx1',
          reference: 'ref1',
          amountInCents: 28900000,
          currency: 'COP',
        }),
      payTransaction: () =>
        Promise.resolve({ status: 'APPROVED', transactionId: 'tx1', pspTransactionId: 'psp1' }),
    };
    const store = createTestStore(api);
    setupCheckoutState(store);

    await render(<PaymentProcessingView onError={jest.fn()} />, {
      wrapper: storeWrapper(store),
    });

    await waitFor(() => {
      expect(selectCheckoutStep(store.getState())).toBe('result');
    });
    expect(selectCurrentTransaction(store.getState())?.status).toBe('APPROVED');
  });

  it('reuses the existing transaction instead of creating a new one', async () => {
    const createTransactionMock = jest.fn().mockResolvedValue({
      transactionId: 'tx1',
      reference: 'ref1',
      amountInCents: 28900000,
      currency: 'COP',
    });
    const api: Partial<PayflowApi> = {
      createTransaction: createTransactionMock,
      payTransaction: () =>
        Promise.resolve({ status: 'DECLINED', transactionId: 'tx1' }),
    };
    const store = createTestStore(api);
    setupCheckoutState(store);
    await store.dispatch(
      createTransaction({ productId: 'p1', quantity: 1, customerEmail: 'buyer@example.com' }),
    );
    createTransactionMock.mockClear();

    await render(<PaymentProcessingView onError={jest.fn()} />, {
      wrapper: storeWrapper(store),
    });

    await waitFor(() => {
      expect(selectCheckoutStep(store.getState())).toBe('result');
    });
    expect(createTransactionMock).not.toHaveBeenCalled();
  });

  it('advances to result on DECLINED (a resolved answer, not an error)', async () => {
    const api: Partial<PayflowApi> = {
      createTransaction: () =>
        Promise.resolve({
          transactionId: 'tx1',
          reference: 'ref1',
          amountInCents: 28900000,
          currency: 'COP',
        }),
      payTransaction: () => Promise.resolve({ status: 'DECLINED', transactionId: 'tx1' }),
    };
    const store = createTestStore(api);
    setupCheckoutState(store);
    const onError = jest.fn();

    await render(<PaymentProcessingView onError={onError} />, { wrapper: storeWrapper(store) });

    await waitFor(() => {
      expect(selectCheckoutStep(store.getState())).toBe('result');
    });
    expect(selectCurrentTransaction(store.getState())?.status).toBe('DECLINED');
    expect(onError).not.toHaveBeenCalled();
  });

  it('reports an error and reverts to summary when createTransaction fails', async () => {
    const api: Partial<PayflowApi> = {
      createTransaction: () => Promise.reject(new Error('Insufficient stock: requested 1, available 0')),
    };
    const store = createTestStore(api);
    setupCheckoutState(store);
    const onError = jest.fn();

    await render(<PaymentProcessingView onError={onError} />, { wrapper: storeWrapper(store) });

    await waitFor(() => {
      expect(selectCheckoutStep(store.getState())).toBe('summary');
    });
    expect(onError).toHaveBeenCalledWith('Insufficient stock: requested 1, available 0');
  });

  it('reports a network error and reverts to summary when payTransaction fails', async () => {
    const api: Partial<PayflowApi> = {
      createTransaction: () =>
        Promise.resolve({
          transactionId: 'tx1',
          reference: 'ref1',
          amountInCents: 28900000,
          currency: 'COP',
        }),
      payTransaction: () => Promise.reject(new Error('Network request failed')),
    };
    const store = createTestStore(api);
    setupCheckoutState(store);
    const onError = jest.fn();

    await render(<PaymentProcessingView onError={onError} />, { wrapper: storeWrapper(store) });

    await waitFor(() => {
      expect(selectCheckoutStep(store.getState())).toBe('summary');
    });
    expect(onError).toHaveBeenCalledWith('Network request failed');
  });
});
