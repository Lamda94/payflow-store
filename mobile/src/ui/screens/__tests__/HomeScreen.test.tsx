import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { HomeScreen } from '../HomeScreen';
import { createTestStore, storeWrapper } from '../../../test-utils/testStore';
import { selectProduct } from '../../../store/slices/cartSlice';
import type { Product } from '../../../domain/types';

const products: Product[] = [
  {
    id: 'p1',
    name: 'Mechanical Keyboard TKL',
    description: 'desc',
    imageUrl: 'https://example.com/a.jpg',
    priceInCents: 28900000,
    currency: 'COP',
    stock: 8,
  },
];

function makeNavigation() {
  return {
    navigate: jest.fn(),
  } as unknown as Parameters<typeof HomeScreen>[0]['navigation'];
}

describe('HomeScreen', () => {
  it('starts in a loading state and renders the product grid once fetched', async () => {
    const store = createTestStore({ listProducts: () => Promise.resolve(products) });
    expect(store.getState().products.status).toBe('idle');

    const { getByTestId, getByText } = await render(
      <HomeScreen navigation={makeNavigation()} route={{ key: 'Home', name: 'Home' } as never} />,
      { wrapper: storeWrapper(store) },
    );

    // The awaited render already flushes the fetch to completion, so the
    // transient loading state isn't observable here — asserted directly
    // against the reducer instead (already covered by productsSlice specs).
    await waitFor(() => {
      expect(getByTestId('home-product-list')).toBeTruthy();
    });
    expect(getByText('Mechanical Keyboard TKL')).toBeTruthy();
  });

  it('shows an error state with a retry button when the fetch fails', async () => {
    const listProducts = jest
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(products);
    const store = createTestStore({ listProducts });

    const { getByTestId, getByText } = await render(
      <HomeScreen navigation={makeNavigation()} route={{ key: 'Home', name: 'Home' } as never} />,
      { wrapper: storeWrapper(store) },
    );

    await waitFor(() => {
      expect(getByTestId('home-error')).toBeTruthy();
    });
    expect(getByText('network down')).toBeTruthy();

    fireEvent.press(getByText('Retry'));

    await waitFor(() => {
      expect(getByTestId('home-product-list')).toBeTruthy();
    });
    expect(listProducts).toHaveBeenCalledTimes(2);
  });

  it('shows an empty state when there are no products', async () => {
    const store = createTestStore({ listProducts: () => Promise.resolve([]) });
    const { getByTestId, getByText } = await render(
      <HomeScreen navigation={makeNavigation()} route={{ key: 'Home', name: 'Home' } as never} />,
      { wrapper: storeWrapper(store) },
    );

    await waitFor(() => {
      expect(getByTestId('home-empty')).toBeTruthy();
    });
    expect(getByText('No products available right now')).toBeTruthy();
  });

  it('navigates to ProductDetail when a product card is pressed', async () => {
    const store = createTestStore({ listProducts: () => Promise.resolve(products) });
    const navigation = makeNavigation();
    const { getByTestId } = await render(
      <HomeScreen navigation={navigation} route={{ key: 'Home', name: 'Home' } as never} />,
      { wrapper: storeWrapper(store) },
    );

    await waitFor(() => {
      expect(getByTestId('home-product-list')).toBeTruthy();
    });
    fireEvent.press(getByTestId('product-card-p1'));

    expect(navigation.navigate).toHaveBeenCalledWith('ProductDetail', { productId: 'p1' });
  });

  it('renders its own header with the store title', async () => {
    const store = createTestStore({ listProducts: () => Promise.resolve(products) });
    const { getByText } = await render(
      <HomeScreen navigation={makeNavigation()} route={{ key: 'Home', name: 'Home' } as never} />,
      { wrapper: storeWrapper(store) },
    );

    expect(getByText('PayFlow Store')).toBeTruthy();
  });

  it('hides the header cart button when the cart is empty', async () => {
    const store = createTestStore({ listProducts: () => Promise.resolve(products) });
    const { getByTestId, queryByTestId } = await render(
      <HomeScreen navigation={makeNavigation()} route={{ key: 'Home', name: 'Home' } as never} />,
      { wrapper: storeWrapper(store) },
    );

    await waitFor(() => {
      expect(getByTestId('home-product-list')).toBeTruthy();
      expect(queryByTestId('header-cart-button')).toBeNull();
    });
  });

  it('shows the cart icon with a quantity badge and navigates to Checkout when pressed', async () => {
    const store = createTestStore({ listProducts: () => Promise.resolve(products) });
    const navigation = makeNavigation();

    const { getByTestId, getByText } = await render(
      <HomeScreen navigation={navigation} route={{ key: 'Home', name: 'Home' } as never} />,
      { wrapper: storeWrapper(store) },
    );

    await act(async () => {
      store.dispatch(selectProduct({ productId: 'p1', quantity: 2 }));
    });

    await waitFor(() => {
      expect(getByTestId('header-cart-button')).toBeTruthy();
    });
    expect(getByText('2')).toBeTruthy();

    fireEvent.press(getByTestId('header-cart-button'));

    expect(navigation.navigate).toHaveBeenCalledWith('Checkout');
  });

  it('hides the header history button when there are no archived purchases', async () => {
    const store = createTestStore({ listProducts: () => Promise.resolve(products) });
    const { getByTestId, queryByTestId } = await render(
      <HomeScreen navigation={makeNavigation()} route={{ key: 'Home', name: 'Home' } as never} />,
      { wrapper: storeWrapper(store) },
    );

    await waitFor(() => {
      expect(getByTestId('home-product-list')).toBeTruthy();
      expect(queryByTestId('header-history-button')).toBeNull();
    });
  });

  it('shows the history icon and navigates to History when pressed', async () => {
    const store = createTestStore({ listProducts: () => Promise.resolve(products) });
    const navigation = makeNavigation();

    const { getByTestId } = await render(
      <HomeScreen navigation={navigation} route={{ key: 'Home', name: 'Home' } as never} />,
      { wrapper: storeWrapper(store) },
    );

    await act(async () => {
      store.dispatch({
        type: 'transaction/pay/fulfilled',
        payload: {
          id: 'tx1',
          reference: 'ref-1',
          status: 'APPROVED',
          amountInCents: 28900000,
          currency: 'COP',
          createdAt: '2026-07-11T10:00:00.000Z',
        },
      });
      store.dispatch({ type: 'transaction/archiveCurrentTransaction' });
    });

    await waitFor(() => {
      expect(getByTestId('header-history-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('header-history-button'));

    expect(navigation.navigate).toHaveBeenCalledWith('History');
  });
});
