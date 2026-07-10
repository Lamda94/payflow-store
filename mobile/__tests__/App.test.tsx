/**
 * @format
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import App from '../App';

const mockUseColorScheme = jest.fn();
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockUseColorScheme(),
}));

describe('App', () => {
  it.each(['light', 'dark'])(
    'boots the store and renders the placeholder in %s mode',
    async scheme => {
      mockUseColorScheme.mockReturnValue(scheme);
      const result = await render(<App />);

      await waitFor(() => {
        expect(result.getByText('PayFlow Store')).toBeTruthy();
      });
    },
  );
});
