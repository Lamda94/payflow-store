import { createTransform } from 'redux-persist';
import CryptoJS from 'crypto-js';

/**
 * Encrypts whitelisted redux-persist slices at rest (AES, key from the
 * device Keystore/Keychain — see persist/keychain.ts). Applies to any
 * slice in persistConfig.whitelist; each one is stored as ciphertext and
 * transparently decrypted on rehydration.
 */
export function createEncryptedTransform(secretKey: string) {
  return createTransform<unknown, string>(
    inboundState => CryptoJS.AES.encrypt(JSON.stringify(inboundState), secretKey).toString(),
    outboundState => {
      const bytes = CryptoJS.AES.decrypt(outboundState, secretKey);
      const json = bytes.toString(CryptoJS.enc.Utf8);
      return json ? JSON.parse(json) : undefined;
    },
  );
}
