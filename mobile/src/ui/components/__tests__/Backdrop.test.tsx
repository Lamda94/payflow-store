import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { Backdrop } from '../Backdrop';

describe('Backdrop', () => {
  it('renders its children when visible', async () => {
    const { getByText, getByTestId } = await render(
      <Backdrop visible onClose={jest.fn()}>
        <Text>Front layer content</Text>
      </Backdrop>,
    );

    expect(getByTestId('backdrop-sheet')).toBeTruthy();
    expect(getByText('Front layer content')).toBeTruthy();
  });

  it('calls onClose when the scrim is pressed', async () => {
    const onClose = jest.fn();
    const { getByTestId } = await render(
      <Backdrop visible onClose={onClose}>
        <Text>Content</Text>
      </Backdrop>,
    );

    fireEvent.press(getByTestId('backdrop-scrim'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on the Android back button (onRequestClose)', async () => {
    const onClose = jest.fn();
    const { getByTestId } = await render(
      <Backdrop visible onClose={onClose}>
        <Text>Content</Text>
      </Backdrop>,
    );

    fireEvent(getByTestId('backdrop-modal'), 'requestClose');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
