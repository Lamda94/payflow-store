import { expandTwoDigitYear, formatCardNumber, formatExpiration } from '../format';

describe('formatCardNumber', () => {
  it('groups digits in blocks of 4', () => {
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
  });

  it('reformats from scratch when given an already-formatted (or edited) string', () => {
    expect(formatCardNumber('4242 4242 4242 424')).toBe('4242 4242 4242 424');
  });

  it('handles a partial number', () => {
    expect(formatCardNumber('42424')).toBe('4242 4');
  });

  it('strips non-digit characters', () => {
    expect(formatCardNumber('4242-4242-4242-4242')).toBe('4242 4242 4242 4242');
  });

  it('caps at 19 digits (longest supported PAN)', () => {
    expect(formatCardNumber('12345678901234567890123')).toBe(
      '1234 5678 9012 3456 789',
    );
  });

  it('returns an empty string for empty input', () => {
    expect(formatCardNumber('')).toBe('');
  });
});

describe('formatExpiration', () => {
  it('returns raw digits until the month is complete', () => {
    expect(formatExpiration('1')).toBe('1');
    expect(formatExpiration('12')).toBe('12');
  });

  it('inserts a slash once the year starts', () => {
    expect(formatExpiration('123')).toBe('12/3');
    expect(formatExpiration('1230')).toBe('12/30');
  });

  it('is backspace-safe: re-deriving from a string that still has a slash', () => {
    expect(formatExpiration('12/3')).toBe('12/3');
  });

  it('caps at 4 digits (MM + YY)', () => {
    expect(formatExpiration('123099')).toBe('12/30');
  });

  it('strips non-digit characters before formatting', () => {
    expect(formatExpiration('12-30')).toBe('12/30');
  });

  it('returns an empty string for empty input', () => {
    expect(formatExpiration('')).toBe('');
  });
});

describe('expandTwoDigitYear', () => {
  it('prefixes with 20', () => {
    expect(expandTwoDigitYear('30')).toBe('2030');
    expect(expandTwoDigitYear('99')).toBe('2099');
  });
});
