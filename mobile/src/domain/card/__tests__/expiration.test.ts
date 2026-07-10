import { isFutureExpiration, isValidExpirationFormat } from '../expiration';

const REFERENCE = new Date('2026-07-10T12:00:00.000Z');

describe('isValidExpirationFormat', () => {
  it('accepts a well-formed month/year', () => {
    expect(isValidExpirationFormat('12', '2030')).toBe(true);
  });

  it.each(['00', '13', '1', 'ab'])('rejects an invalid month %s', month => {
    expect(isValidExpirationFormat(month, '2030')).toBe(false);
  });

  it.each(['30', '203', 'abcd'])('rejects an invalid year %s', year => {
    expect(isValidExpirationFormat('12', year)).toBe(false);
  });
});

describe('isFutureExpiration', () => {
  it('accepts a card expiring years in the future', () => {
    expect(isFutureExpiration('12', '2030', REFERENCE)).toBe(true);
  });

  it('accepts a card expiring in the current month (valid through month end)', () => {
    expect(isFutureExpiration('07', '2026', REFERENCE)).toBe(true);
  });

  it('rejects a card that expired last month', () => {
    expect(isFutureExpiration('06', '2026', REFERENCE)).toBe(false);
  });

  it('rejects a card that expired years ago', () => {
    expect(isFutureExpiration('01', '2020', REFERENCE)).toBe(false);
  });

  it('rejects malformed input regardless of date', () => {
    expect(isFutureExpiration('13', '2030', REFERENCE)).toBe(false);
    expect(isFutureExpiration('12', '30', REFERENCE)).toBe(false);
  });

  it('defaults to the real current date when none is provided', () => {
    expect(isFutureExpiration('12', '2099')).toBe(true);
    expect(isFutureExpiration('01', '2000')).toBe(false);
  });
});
