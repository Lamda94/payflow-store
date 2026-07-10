import { isValidCardNumber } from '../luhn';

describe('isValidCardNumber (Luhn)', () => {
  it('accepts the PSP sandbox APPROVED test card', () => {
    expect(isValidCardNumber('4242424242424242')).toBe(true);
  });

  it('accepts the PSP sandbox DECLINED test card', () => {
    expect(isValidCardNumber('4111111111111111')).toBe(true);
  });

  it('accepts a valid card number with spaces', () => {
    expect(isValidCardNumber('4242 4242 4242 4242')).toBe(true);
  });

  it('rejects a single-digit-off (bad checksum) number', () => {
    expect(isValidCardNumber('4111111111111112')).toBe(false);
  });

  it('rejects numbers shorter than 13 digits', () => {
    expect(isValidCardNumber('411111111111')).toBe(false);
  });

  it('rejects numbers longer than 19 digits', () => {
    expect(isValidCardNumber('41111111111111111111')).toBe(false);
  });

  it('rejects non-numeric input', () => {
    expect(isValidCardNumber('not-a-card-number')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidCardNumber('')).toBe(false);
  });

  it('accepts a valid 13-digit number (boundary)', () => {
    // 13-digit Luhn-valid number
    expect(isValidCardNumber('4222222222222')).toBe(true);
  });

  it('accepts a valid number that exercises the doubled-digit-over-9 reduction', () => {
    expect(isValidCardNumber('5105105105105100')).toBe(true);
  });
});
