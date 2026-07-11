import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ErrorBoundary } from '../ErrorBoundary';

const BrokenChild = ({ broken }: { broken: boolean }) => {
  if (broken) {
    throw new Error('boom');
  }
  return <></>;
};

describe('ErrorBoundary', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('renders children when no error occurs', async () => {
    const { queryByText } = await render(
      <ErrorBoundary>
        <BrokenChild broken={false} />
      </ErrorBoundary>,
    );
    expect(queryByText('Something went wrong')).toBeNull();
  });

  it('renders fallback UI when a child throws', async () => {
    const { getByText } = await render(
      <ErrorBoundary>
        <BrokenChild broken={true} />
      </ErrorBoundary>,
    );
    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('Try Again button is pressable and does not crash', async () => {
    const { getByText } = await render(
      <ErrorBoundary>
        <BrokenChild broken={true} />
      </ErrorBoundary>,
    );
    expect(getByText('Something went wrong')).toBeTruthy();
    expect(() => fireEvent.press(getByText('Try Again'))).not.toThrow();
  });
});
