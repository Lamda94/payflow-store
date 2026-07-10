import * as Keychain from 'react-native-keychain';
import { initStore } from '../index';

describe('initStore', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('resolves the Keystore/Keychain key before creating the store', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce({
      username: 'payflow-store',
      password: 'stored-key',
    });

    const { store, persistor } = await initStore();

    expect(store.getState().cart).toEqual({ productId: null, quantity: 0 });
    persistor.pause();
  });
});
