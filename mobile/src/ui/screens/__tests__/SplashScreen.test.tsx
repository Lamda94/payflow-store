import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { SplashScreen, SPLASH_DURATION_MS } from '../SplashScreen';

function makeNavigation() {
  return { replace: jest.fn() } as unknown as Parameters<typeof SplashScreen>[0]['navigation'];
}

describe('SplashScreen', () => {
  it('renders the app branding with the logo', async () => {
    const { getByText, getByTestId } = await render(
      <SplashScreen navigation={makeNavigation()} route={{ key: 'Splash', name: 'Splash' } as never} />,
    );
    expect(getByText('PayFlow Store')).toBeTruthy();
    expect(getByText('Checkout made simple')).toBeTruthy();
    expect(getByTestId('splash-logo')).toBeTruthy();
  });

  it('replaces itself with Home after the splash duration', async () => {
    jest.useFakeTimers();
    const navigation = makeNavigation();
    await render(
      <SplashScreen navigation={navigation} route={{ key: 'Splash', name: 'Splash' } as never} />,
    );

    expect(navigation.replace).not.toHaveBeenCalled();

    jest.advanceTimersByTime(SPLASH_DURATION_MS);

    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith('Home');
    });

    jest.useRealTimers();
  });
});
