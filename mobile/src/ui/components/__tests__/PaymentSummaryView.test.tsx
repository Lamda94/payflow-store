import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PaymentSummaryView } from '../PaymentSummaryView';
import { createTestStore, storeWrapper } from '../../../test-utils/testStore';
import { selectProduct } from '../../../store/slices/cartSlice';
import { fetchProducts } from '../../../store/slices/productsSlice';
import { selectCheckoutStep, setCardField } from '../../../store/slices/checkoutSlice';
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

describe('PaymentSummaryView', () => {
  it('shows an empty message when the cart has no product', async () => {
    const store = createTestStore();
    const { getByTestId } = await render(<PaymentSummaryView />, {
      wrapper: storeWrapper(store),
    });

    expect(getByTestId('payment-summary-empty')).toBeTruthy();
  });

  it('shows product, quantity, total and masked card info', async () => {
    const store = createTestStore({ listProducts: () => Promise.resolve([product]) });
    await store.dispatch(fetchProducts());
    store.dispatch(selectProduct({ productId: 'p1', quantity: 2 }));
    store.dispatch(setCardField({ field: 'cardNumber', value: '4242424242424242' }));
    store.dispatch(setCardField({ field: 'installments', value: 3 }));

    const { getByText, getByTestId } = await render(<PaymentSummaryView />, {
      wrapper: storeWrapper(store),
    });

    expect(getByTestId('payment-summary')).toBeTruthy();
    expect(getByText('Mechanical Keyboard TKL')).toBeTruthy();
    expect(getByText('x2')).toBeTruthy();
    expect(getByText('COP 578,000.00')).toBeTruthy();
    expect(getByText('Card ending in 4242 · 3 installments')).toBeTruthy();
  });

  it('goes back to the card-info step when "Edit card details" is pressed', async () => {
    const store = createTestStore({ listProducts: () => Promise.resolve([product]) });
    await store.dispatch(fetchProducts());
    store.dispatch(selectProduct({ productId: 'p1', quantity: 1 }));

    const { getByTestId } = await render(<PaymentSummaryView />, { wrapper: storeWrapper(store) });

    fireEvent.press(getByTestId('edit-card-button'));

    await waitFor(() => {
      expect(selectCheckoutStep(store.getState())).toBe('card-info');
    });
  });

  it('dispatches goToProcessing when Pay is pressed', async () => {
    const store = createTestStore({ listProducts: () => Promise.resolve([product]) });
    await store.dispatch(fetchProducts());
    store.dispatch(selectProduct({ productId: 'p1', quantity: 1 }));

    const { getByTestId } = await render(<PaymentSummaryView />, { wrapper: storeWrapper(store) });

    fireEvent.press(getByTestId('pay-button'));

    await waitFor(() => {
      expect(selectCheckoutStep(store.getState())).toBe('processing');
    });
  });
});
