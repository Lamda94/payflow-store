import { detectCardBrand } from '../brand';

describe('detectCardBrand', () => {
  it('detects VISA by leading 4', () => {
    expect(detectCardBrand('4242424242424242')).toBe('visa');
    expect(detectCardBrand('4111111111111111')).toBe('visa');
  });

  it('detects MasterCard in the classic 51-55 range', () => {
    expect(detectCardBrand('5100000000000000')).toBe('mastercard');
    expect(detectCardBrand('5500000000000000')).toBe('mastercard');
  });

  it('rejects 50 and 56 as outside the classic MasterCard range', () => {
    expect(detectCardBrand('5000000000000000')).toBe('unknown');
    expect(detectCardBrand('5600000000000000')).toBe('unknown');
  });

  it('detects MasterCard in the newer 2221-2720 range (inclusive boundaries)', () => {
    expect(detectCardBrand('2221000000000000')).toBe('mastercard');
    expect(detectCardBrand('2720000000000000')).toBe('mastercard');
    expect(detectCardBrand('2500000000000000')).toBe('mastercard');
  });

  it('rejects 2220 and 2721 as just outside the newer range', () => {
    expect(detectCardBrand('2220000000000000')).toBe('unknown');
    expect(detectCardBrand('2721000000000000')).toBe('unknown');
  });

  it('returns unknown while too few digits have been typed to tell', () => {
    expect(detectCardBrand('22')).toBe('unknown');
  });

  it('returns unknown for an unrecognized prefix', () => {
    expect(detectCardBrand('6011000000000000')).toBe('unknown');
  });

  it('ignores formatting characters (spaces)', () => {
    expect(detectCardBrand('4242 4242 4242 4242')).toBe('visa');
  });
});
