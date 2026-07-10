import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CheckoutScreen } from '../CheckoutScreen';
import { createTestStore, storeWrapper, type PayflowApi } from '../../../test-utils/testStore';
import { selectProduct } from '../../../store/slices/cartSlice';
import { fetchProducts } from '../../../store/slices/productsSlice';
import { goToProcessing, goToResult, selectCheckoutStep } from '../../../store/slices/checkoutSlice';
import { createTransaction } from '../../../store/slices/transactionSlice';
import type { Product } from '../../../domain/types';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

const product: Product = {
  id: 'p1',
  name: 'Mechanical Keyboard TKL',
  description: 'desc',
  imageUrl: 'https://example.com/a.jpg',
  priceInCents: 28900000,
  currency: 'COP',
  stock: 8,
};

describe('CheckoutScreen', () => {
  it('shows an empty-cart message when nothing is selected', async () => {
    const store = createTestStore();
    const { getByTestId } = await render(<CheckoutScreen />, { wrapper: storeWrapper(store) });

    expect(getByTestId('checkout-empty')).toBeTruthy();
  });

  it('shows the order summary and opens the card form via the Backdrop', async () => {
    const store = createTestStore({ listProducts: () => Promise.resolve([product]) });
    await store.dispatch(fetchProducts());
    store.dispatch(selectProduct({ productId: 'p1', quantity: 2 }));

    const { getByText, getByTestId, queryByTestId } = await render(<CheckoutScreen />, {
      wrapper: storeWrapper(store),
    });

    expect(getByTestId('checkout-screen')).toBeTruthy();
    expect(getByText('Mechanical Keyboard TKL')).toBeTruthy();
    expect(getByText('COP 578,000.00')).toBeTruthy();
    expect(queryByTestId('card-info-form')).toBeNull();

    fireEvent.press(getByTestId('pay-with-card-button'));

    await waitFor(() => {
      expect(getByTestId('card-info-form')).toBeTruthy();
    });
    expect(selectCheckoutStep(store.getState())).toBe('card-info');
  });

  it('resets the checkout step when the backdrop is dismissed', async () => {
    const store = createTestStore({ listProducts: () => Promise.resolve([product]) });
    await store.dispatch(fetchProducts());
    store.dispatch(selectProduct({ productId: 'p1', quantity: 1 }));

    const { getByTestId } = await render(<CheckoutScreen />, { wrapper: storeWrapper(store) });

    fireEvent.press(getByTestId('pay-with-card-button'));
    await waitFor(() => {
      expect(selectCheckoutStep(store.getState())).toBe('card-info');
    });

    fireEvent.press(getByTestId('backdrop-scrim'));

    await waitFor(() => {
      expect(selectCheckoutStep(store.getState())).toBe('idle');
    });
  });

  it('ignores backdrop dismissal while a payment request is in flight', async () => {
    const api: Partial<PayflowApi> = {
      listProducts: () => Promise.resolve([product]),
      createTransaction: () => new Promise(() => {}), // never resolves
    };
    const store = createTestStore(api);
    await store.dispatch(fetchProducts());
    store.dispatch(selectProduct({ productId: 'p1', quantity: 1 }));
    store.dispatch(goToProcessing());

    const { getByTestId } = await render(<CheckoutScreen />, { wrapper: storeWrapper(store) });

    expect(getByTestId('checkout-processing')).toBeTruthy();
    fireEvent.press(getByTestId('backdrop-scrim'));

    expect(selectCheckoutStep(store.getState())).toBe('processing');
  });

  it('shows a toast and reverts to summary when the payment request fails', async () => {
    const api: Partial<PayflowApi> = {
      listProducts: () => Promise.resolve([product]),
      createTransaction: () => Promise.reject(new Error('Network request failed')),
    };
    const store = createTestStore(api);
    await store.dispatch(fetchProducts());
    store.dispatch(selectProduct({ productId: 'p1', quantity: 1 }));
    store.dispatch(goToProcessing());

    const { getByTestId, getByText } = await render(<CheckoutScreen />, {
      wrapper: storeWrapper(store),
    });

    await waitFor(() => {
      expect(getByText('Network request failed')).toBeTruthy();
    });
    expect(selectCheckoutStep(store.getState())).toBe('summary');
    expect(getByTestId('toast')).toBeTruthy();
  });

  it('shows the payment result once the transaction resolves', async () => {
    const api: Partial<PayflowApi> = {
      listProducts: () => Promise.resolve([product]),
      createTransaction: () =>
        Promise.resolve({
          transactionId: 'tx1',
          reference: 'ref1',
          amountInCents: 28900000,
          currency: 'COP',
        }),
      payTransaction: () => Promise.resolve({ status: 'APPROVED', transactionId: 'tx1' }),
    };
    const store = createTestStore(api);
    await store.dispatch(fetchProducts());
    store.dispatch(selectProduct({ productId: 'p1', quantity: 1 }));
    store.dispatch(goToProcessing());

    const { getByTestId, getByText } = await render(<CheckoutScreen />, {
      wrapper: storeWrapper(store),
    });

    await waitFor(() => {
      expect(getByTestId('payment-result')).toBeTruthy();
    });
    expect(getByText('Payment approved')).toBeTruthy();
  });

  it('fully resets and refetches products when the result backdrop is dismissed', async () => {
    const api: Partial<PayflowApi> = {
      listProducts: () => Promise.resolve([product]),
    };
    const store = createTestStore(api);
    await store.dispatch(fetchProducts());
    store.dispatch(selectProduct({ productId: 'p1', quantity: 1 }));
    await store.dispatch(
      createTransaction({ productId: 'p1', quantity: 1, customerEmail: 'a@b.co' }),
    );
    store.dispatch({
      type: 'transaction/pay/fulfilled',
      payload: { ...store.getState().transaction.current, status: 'APPROVED' },
    });
    store.dispatch(goToResult());

    const { getByTestId } = await render(<CheckoutScreen />, { wrapper: storeWrapper(store) });

    expect(getByTestId('payment-result')).toBeTruthy();
    fireEvent.press(getByTestId('backdrop-scrim'));

    expect(selectCheckoutStep(store.getState())).toBe('idle');
    expect(store.getState().cart).toEqual({ productId: null, quantity: 0 });
    expect(store.getState().transaction.current).toBeNull();
  });
});
