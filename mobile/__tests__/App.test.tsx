/**
 * @format
 */

import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, waitFor } from '@testing-library/react-native';
import App from '../App';

const mockUseColorScheme = jest.fn();
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockUseColorScheme(),
}));

describe('App', () => {
  afterEach(async () => {
    // Each render boots its own store with a freshly "generated" key (the
    // mocked Keychain never remembers one call to the next), so leftover
    // persisted state from a previous render would fail to decrypt here.
    await AsyncStorage.clear();
  });

  it.each(['light', 'dark'])(
    'boots the store and renders the Splash screen in %s mode',
    async scheme => {
      mockUseColorScheme.mockReturnValue(scheme);
      const result = await render(<App />);

      await waitFor(() => {
        expect(result.getByTestId('splash-screen')).toBeTruthy();
      });
    },
  );
});
