import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProductCard } from '../ProductCard';
import type { Product } from '../../../domain/types';

const product: Product = {
  id: 'p1',
  name: 'Mechanical Keyboard TKL',
  description: 'Tenkeyless mechanical keyboard',
  imageUrl: 'https://example.com/keyboard.jpg',
  priceInCents: 28900000,
  currency: 'COP',
  stock: 8,
};

describe('ProductCard', () => {
  it('renders name, formatted price and stock', async () => {
    const { getByText } = await render(<ProductCard product={product} onPress={jest.fn()} />);
    expect(getByText('Mechanical Keyboard TKL')).toBeTruthy();
    expect(getByText('COP 289,000.00')).toBeTruthy();
    expect(getByText('8 in stock')).toBeTruthy();
  });

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(<ProductCard product={product} onPress={onPress} />);
    fireEvent.press(getByTestId('product-card-p1'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows "Out of stock" and disables press when stock is zero', async () => {
    const onPress = jest.fn();
    const outOfStockProduct = { ...product, stock: 0 };
    const { getByText, getByTestId } = await render(
      <ProductCard product={outOfStockProduct} onPress={onPress} />,
    );

    expect(getByText('Out of stock')).toBeTruthy();
    fireEvent.press(getByTestId('product-card-p1'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
