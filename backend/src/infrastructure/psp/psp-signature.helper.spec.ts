import { buildIntegritySignature } from './psp-signature.helper';
import { createHash } from 'crypto';

describe('buildIntegritySignature', () => {
  it('produces a sha256 hex of reference+amount+currency+key', () => {
    const reference = 'ref-001';
    const amount = 199000;
    const currency = 'COP';
    const key = 'test_integrity_key';

    const expected = createHash('sha256')
      .update(`${reference}${amount}${currency}${key}`)
      .digest('hex');

    expect(buildIntegritySignature(reference, amount, currency, key)).toBe(
      expected,
    );
  });

  it('produces different signatures for different references', () => {
    const sig1 = buildIntegritySignature('ref-001', 100000, 'COP', 'key');
    const sig2 = buildIntegritySignature('ref-002', 100000, 'COP', 'key');
    expect(sig1).not.toBe(sig2);
  });

  it('produces different signatures for different amounts', () => {
    const sig1 = buildIntegritySignature('ref-001', 100000, 'COP', 'key');
    const sig2 = buildIntegritySignature('ref-001', 200000, 'COP', 'key');
    expect(sig1).not.toBe(sig2);
  });

  it('produces a 64-character hex string', () => {
    const sig = buildIntegritySignature('ref', 100, 'COP', 'key');
    expect(sig).toHaveLength(64);
    expect(sig).toMatch(/^[a-f0-9]+$/);
  });
});
