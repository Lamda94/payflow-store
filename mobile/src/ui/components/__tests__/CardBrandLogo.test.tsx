import React from 'react';
import { render } from '@testing-library/react-native';
import { CardBrandLogo } from '../CardBrandLogo';

describe('CardBrandLogo', () => {
  it('renders the VISA mark for visa', async () => {
    const { getByTestId } = await render(<CardBrandLogo brand="visa" />);
    expect(getByTestId('brand-logo-visa')).toBeTruthy();
  });

  it('renders the MasterCard mark for mastercard', async () => {
    const { getByTestId } = await render(<CardBrandLogo brand="mastercard" />);
    expect(getByTestId('brand-logo-mastercard')).toBeTruthy();
  });

  it('renders nothing for unknown', async () => {
    const { queryByTestId } = await render(<CardBrandLogo brand="unknown" />);
    expect(queryByTestId('brand-logo-visa')).toBeNull();
    expect(queryByTestId('brand-logo-mastercard')).toBeNull();
  });
});
