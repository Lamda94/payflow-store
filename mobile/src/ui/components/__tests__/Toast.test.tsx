import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Toast } from '../Toast';

describe('Toast', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when there is no message', async () => {
    const { queryByTestId } = await render(<Toast message={null} onDismiss={jest.fn()} />);
    expect(queryByTestId('toast')).toBeNull();
  });

  it('renders the message when provided', async () => {
    const { getByText } = await render(<Toast message="Network error" onDismiss={jest.fn()} />);
    expect(getByText('Network error')).toBeTruthy();
  });

  it('calls onDismiss automatically after the timeout', async () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    await render(<Toast message="Network error" onDismiss={onDismiss} />);

    expect(onDismiss).not.toHaveBeenCalled();
    jest.advanceTimersByTime(3500);

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });
});
