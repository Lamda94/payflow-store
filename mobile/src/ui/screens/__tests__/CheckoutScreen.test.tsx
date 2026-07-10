import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CheckoutScreen } from '../CheckoutScreen';
import { createTestStore, storeWrapper } from '../../../test-utils/testStore';
import { selectProduct } from '../../../store/slices/cartSlice';
import { fetchProducts } from '../../../store/slices/productsSlice';
import { goToProcessing, selectCheckoutStep } from '../../../store/slices/checkoutSlice';
import type { Product } from '../../../domain/types';

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

  it('shows a processing placeholder while the (M5) payment step runs', async () => {
    const store = createTestStore({ listProducts: () => Promise.resolve([product]) });
    await store.dispatch(fetchProducts());
    store.dispatch(selectProduct({ productId: 'p1', quantity: 1 }));
    store.dispatch(goToProcessing());

    const { getByTestId } = await render(<CheckoutScreen />, { wrapper: storeWrapper(store) });

    expect(getByTestId('checkout-processing')).toBeTruthy();
  });
});
