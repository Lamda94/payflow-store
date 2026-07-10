import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QuantityStepper } from '../QuantityStepper';

describe('QuantityStepper', () => {
  it('renders the current quantity', async () => {
    const { getByTestId } = await render(
      <QuantityStepper quantity={2} max={5} onChange={jest.fn()} />,
    );
    expect(getByTestId('quantity-value').props.children).toBe(2);
  });

  it('calls onChange with quantity + 1 when incrementing', async () => {
    const onChange = jest.fn();
    const { getByTestId } = await render(
      <QuantityStepper quantity={2} max={5} onChange={onChange} />,
    );
    fireEvent.press(getByTestId('quantity-increment'));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('calls onChange with quantity - 1 when decrementing', async () => {
    const onChange = jest.fn();
    const { getByTestId } = await render(
      <QuantityStepper quantity={2} max={5} onChange={onChange} />,
    );
    fireEvent.press(getByTestId('quantity-decrement'));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('disables decrement at the minimum (default 1)', async () => {
    const onChange = jest.fn();
    const { getByTestId } = await render(
      <QuantityStepper quantity={1} max={5} onChange={onChange} />,
    );
    fireEvent.press(getByTestId('quantity-decrement'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('disables increment at the max (stock limit)', async () => {
    const onChange = jest.fn();
    const { getByTestId } = await render(
      <QuantityStepper quantity={5} max={5} onChange={onChange} />,
    );
    fireEvent.press(getByTestId('quantity-increment'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('respects a custom min', async () => {
    const onChange = jest.fn();
    const { getByTestId } = await render(
      <QuantityStepper quantity={2} min={2} max={5} onChange={onChange} />,
    );
    fireEvent.press(getByTestId('quantity-decrement'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
