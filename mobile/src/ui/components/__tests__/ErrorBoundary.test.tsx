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

  it('renders children when no error occurs', () => {
    const { queryByText } = render(
      <ErrorBoundary>
        <BrokenChild broken={false} />
      </ErrorBoundary>,
    );
    expect(queryByText('Something went wrong')).toBeNull();
  });

  it('renders fallback UI when a child throws', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <BrokenChild broken={true} />
      </ErrorBoundary>,
    );
    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('resets to children after pressing Try Again', () => {
    const { getByText, queryByText, rerender } = render(
      <ErrorBoundary>
        <BrokenChild broken={true} />
      </ErrorBoundary>,
    );
    expect(getByText('Something went wrong')).toBeTruthy();

    fireEvent.press(getByText('Try Again'));

    rerender(
      <ErrorBoundary>
        <BrokenChild broken={false} />
      </ErrorBoundary>,
    );
    expect(queryByText('Something went wrong')).toBeNull();
  });
});
