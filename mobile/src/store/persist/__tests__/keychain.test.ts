import * as Keychain from 'react-native-keychain';
import { getOrCreatePersistenceKey } from '../keychain';

describe('getOrCreatePersistenceKey', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns the existing key when the keychain already has one', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce({
      username: 'payflow-store',
      password: 'existing-key',
    });

    const key = await getOrCreatePersistenceKey();

    expect(key).toBe('existing-key');
    expect(Keychain.setGenericPassword).not.toHaveBeenCalled();
  });

  it('generates and stores a new key when none exists yet', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce(false);

    const key = await getOrCreatePersistenceKey();

    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
      'payflow-store',
      key,
      expect.objectContaining({ service: expect.any(String) }),
    );
  });
});
