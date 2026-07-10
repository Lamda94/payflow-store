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

  it('fails to recover plaintext with the wrong key', () => {
    const original = { current: { id: 'tx1' } };
    const encrypted = createEncryptedTransform(KEY).in(
      original,
      'transaction',
      {},
    );

    const wrongKeyTransform = createEncryptedTransform('a-different-key');
    let result: unknown;
    let threw = false;
    try {
      result = wrongKeyTransform.out(encrypted as string, 'transaction', {});
    } catch {
      threw = true;
    }

    const recoveredOriginal =
      !threw && JSON.stringify(result) === JSON.stringify(original);
    expect(recoveredOriginal).toBe(false);
  });
});
