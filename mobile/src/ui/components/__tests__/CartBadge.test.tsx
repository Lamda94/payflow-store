import React from 'react';
import { render } from '@testing-library/react-native';
import { CartBadge } from '../CartBadge';

describe('CartBadge', () => {
  it('renders the quantity when greater than zero', async () => {
    const { getByTestId, getByText } = await render(<CartBadge quantity={3} />);
    expect(getByTestId('cart-badge')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
  });

  it('renders nothing when the cart is empty', async () => {
    const { queryByTestId } = await render(<CartBadge quantity={0} />);
    expect(queryByTestId('cart-badge')).toBeNull();
  });
});
