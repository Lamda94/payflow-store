import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { StoreProvider } from '../StoreProvider';
import { useAppSelector } from '../hooks';

function Probe() {
  const cart = useAppSelector(state => state.cart);
  return <Text>quantity:{cart.quantity}</Text>;
}

describe('StoreProvider', () => {
  it('boots the store from the Keystore/Keychain key and mounts children', async () => {
    const result = await render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );

    await waitFor(() => {
      expect(result.getByText('quantity:0')).toBeTruthy();
    });
  });
});
