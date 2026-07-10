import React from 'react';
import { render } from '@testing-library/react-native';
import { HomeHeaderRight } from '../HomeScreen';
import { createTestStore, storeWrapper } from '../../../test-utils/testStore';
import { selectProduct } from '../../../store/slices/cartSlice';

describe('HomeHeaderRight', () => {
  it('reflects the cart quantity from the store', async () => {
    const store = createTestStore();
    store.dispatch(selectProduct({ productId: 'p1', quantity: 3 }));

    const { getByText } = await render(<HomeHeaderRight />, {
      wrapper: storeWrapper(store),
    });

    expect(getByText('3')).toBeTruthy();
  });

  it('renders nothing when the cart is empty', async () => {
    const store = createTestStore();

    const { queryByTestId } = await render(<HomeHeaderRight />, {
      wrapper: storeWrapper(store),
    });

    expect(queryByTestId('cart-badge')).toBeNull();
  });
});
