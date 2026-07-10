import { isValidCvc } from '../cvc';

describe('isValidCvc', () => {
  it('accepts 3 digits', () => {
    expect(isValidCvc('123')).toBe(true);
  });

  it('accepts 4 digits (Amex-style)', () => {
    expect(isValidCvc('1234')).toBe(true);
  });

  it.each(['12', '12345', 'abc', '12a', ''])('rejects %s', value => {
    expect(isValidCvc(value)).toBe(false);
  });
});
