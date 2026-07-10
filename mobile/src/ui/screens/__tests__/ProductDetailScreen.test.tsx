import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProductDetailScreen } from '../ProductDetailScreen';
import { createTestStore, storeWrapper } from '../../../test-utils/testStore';
import { selectCart } from '../../../store/slices/cartSlice';
import type { Product } from '../../../domain/types';

const product: Product = {
  id: 'p1',
  name: 'Mechanical Keyboard TKL',
  description: 'Tenkeyless mechanical keyboard',
  imageUrl: 'https://example.com/a.jpg',
  priceInCents: 28900000,
  currency: 'COP',
  stock: 2,
};

function makeNavigation() {
  return { navigate: jest.fn() } as unknown as Parameters<
    typeof ProductDetailScreen
  >[0]['navigation'];
}

function makeRoute(productId: string) {
  return { key: 'ProductDetail', name: 'ProductDetail', params: { productId } } as never;
}

describe('ProductDetailScreen', () => {
  it('shows "Product not found" when the product is not in the store', async () => {
    const store = createTestStore({ listProducts: () => Promise.resolve([]) });
    const { getByTestId } = await render(
      <ProductDetailScreen navigation={makeNavigation()} route={makeRoute('missing')} />,
      { wrapper: storeWrapper(store) },
    );

    await waitFor(() => {
      expect(getByTestId('product-detail-not-found')).toBeTruthy();
    });
  });

  it('renders product details and clamps quantity to the stock limit', async () => {
    const store = createTestStore({ listProducts: () => Promise.resolve([product]) });
    const { getByTestId, getByText } = await render(
      <ProductDetailScreen navigation={makeNavigation()} route={makeRoute('p1')} />,
      { wrapper: storeWrapper(store) },
    );

    await waitFor(() => {
      expect(getByTestId('product-detail-screen')).toBeTruthy();
    });
    expect(getByText('Mechanical Keyboard TKL')).toBeTruthy();
    expect(getByText('COP 289,000.00')).toBeTruthy();

    fireEvent.press(getByTestId('quantity-increment'));
    await waitFor(() => {
      expect(getByTestId('quantity-value').props.children).toBe(2);
    });

    // stock is 2 — a third increment must be a no-op
    fireEvent.press(getByTestId('quantity-increment'));
    await waitFor(() => {
      expect(getByTestId('quantity-value').props.children).toBe(2);
    });
  });

  it('adds the selected quantity to the cart and navigates Home', async () => {
    const store = createTestStore({ listProducts: () => Promise.resolve([product]) });
    const navigation = makeNavigation();
    const { getByTestId } = await render(
      <ProductDetailScreen navigation={navigation} route={makeRoute('p1')} />,
      { wrapper: storeWrapper(store) },
    );

    await waitFor(() => {
      expect(getByTestId('product-detail-screen')).toBeTruthy();
    });
    fireEvent.press(getByTestId('quantity-increment'));
    await waitFor(() => {
      expect(getByTestId('quantity-value').props.children).toBe(2);
    });
    fireEvent.press(getByTestId('add-to-cart-button'));

    await waitFor(() => {
      expect(selectCart(store.getState())).toEqual({ productId: 'p1', quantity: 2 });
    });
    expect(navigation.navigate).toHaveBeenCalledWith('Home');
  });

  it('shows "Out of stock" and hides the add-to-cart controls when stock is zero', async () => {
    const store = createTestStore({
      listProducts: () => Promise.resolve([{ ...product, stock: 0 }]),
    });
    const { getByText, queryByTestId } = await render(
      <ProductDetailScreen navigation={makeNavigation()} route={makeRoute('p1')} />,
      { wrapper: storeWrapper(store) },
    );

    await waitFor(() => {
      expect(getByText('Out of stock')).toBeTruthy();
    });
    expect(queryByTestId('add-to-cart-button')).toBeNull();
  });
});
