import { createEncryptedTransform } from '../encryptedTransform';

const KEY = 'test-secret-key';

describe('createEncryptedTransform', () => {
  it('round-trips a slice through encrypt (in) and decrypt (out)', () => {
    const transform = createEncryptedTransform(KEY);
    const original = { productId: 'p1', quantity: 3 };

    const ciphertext = transform.in(original, 'cart', {});
    expect(typeof ciphertext).toBe('string');
    expect(ciphertext).not.toContain('productId');
    expect(ciphertext).not.toContain('p1');

    const restored = transform.out(ciphertext as string, 'cart', {});
    expect(restored).toEqual(original);
  });

  it('produces different ciphertext for different plaintext', () => {
    const transform = createEncryptedTransform(KEY);
    const a = transform.in({ productId: 'p1', quantity: 1 }, 'cart', {});
    const b = transform.in({ productId: 'p2', quantity: 1 }, 'cart', {});
    expect(a).not.toBe(b);
  });

  it('throws instead of silently returning garbage when the key is wrong', () => {
    const encrypted = createEncryptedTransform(KEY).in(
      { current: { id: 'tx1' } },
      'transaction',
      {},
    );

    const wrongKeyTransform = createEncryptedTransform('a-different-key');
    // Throwing (rather than returning undefined/garbage) is what lets
    // redux-persist discard the whole corrupt snapshot and fall back to
    // the reducers' initial state instead of crashing downstream code
    // that assumes a rehydrated slice is always a full, valid object.
    expect(() =>
      wrongKeyTransform.out(encrypted as string, 'transaction', {}),
    ).toThrow();
  });
});
