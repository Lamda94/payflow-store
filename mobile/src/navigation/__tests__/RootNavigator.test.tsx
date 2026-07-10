import React from 'react';
import { render } from '@testing-library/react-native';
import { RootNavigator } from '../RootNavigator';
import { createTestStore, storeWrapper } from '../../test-utils/testStore';

describe('RootNavigator', () => {
  it('mounts with Splash as the initial route', async () => {
    const store = createTestStore({ listProducts: () => Promise.resolve([]) });
    const { getByTestId } = await render(<RootNavigator />, {
      wrapper: storeWrapper(store),
    });

    expect(getByTestId('splash-screen')).toBeTruthy();
  });
});
