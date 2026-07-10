import * as Keychain from 'react-native-keychain';
import CryptoJS from 'crypto-js';

const KEYCHAIN_SERVICE = 'com.payflowstore.persist-key';

/**
 * Returns the AES key used to encrypt persisted redux state, generating
 * and storing a random one in the device Keystore/Keychain on first run.
 * Never hardcoded, never sent over the network, never logged.
 */
export async function getOrCreatePersistenceKey(): Promise<string> {
  const existing = await Keychain.getGenericPassword({
    service: KEYCHAIN_SERVICE,
  });
  if (existing) {
    return existing.password;
  }

  const generatedKey = CryptoJS.lib.WordArray.random(32).toString(
    CryptoJS.enc.Hex,
  );
  await Keychain.setGenericPassword('payflow-store', generatedKey, {
    service: KEYCHAIN_SERVICE,
  });
  return generatedKey;
}
