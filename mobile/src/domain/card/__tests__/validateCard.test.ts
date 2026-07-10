import { isCardValid, validateCard } from '../validateCard';
import type { CardInput } from '../types';

const REFERENCE = new Date('2026-07-10T12:00:00.000Z');

const validCard: CardInput = {
  cardNumber: '4242424242424242',
  holderName: 'JOHN DOE',
  expirationMonth: '12',
  expirationYear: '2030',
  cvc: '123',
};

describe('validateCard', () => {
  it('returns no errors for a fully valid card', () => {
    expect(validateCard(validCard, REFERENCE)).toEqual({});
  });

  it('flags an invalid card number', () => {
    const errors = validateCard(
      { ...validCard, cardNumber: '4111111111111112' },
      REFERENCE,
    );
    expect(errors.cardNumber).toBeDefined();
  });

  it('flags a missing or blank holder name', () => {
    expect(
      validateCard({ ...validCard, holderName: '' }, REFERENCE).holderName,
    ).toBeDefined();
    expect(
      validateCard({ ...validCard, holderName: '   ' }, REFERENCE).holderName,
    ).toBeDefined();
  });

  it('flags an invalid month independently of the year', () => {
    const errors = validateCard(
      { ...validCard, expirationMonth: '13' },
      REFERENCE,
    );
    expect(errors.expirationMonth).toBeDefined();
    expect(errors.expirationYear).toBeUndefined();
  });

  it('flags an invalid year format independently of the month', () => {
    const errors = validateCard(
      { ...validCard, expirationYear: '30' },
      REFERENCE,
    );
    expect(errors.expirationYear).toBeDefined();
    expect(errors.expirationMonth).toBeUndefined();
  });

  it('flags an expired card on the year field, distinct from a format error', () => {
    const errors = validateCard(
      { ...validCard, expirationMonth: '01', expirationYear: '2020' },
      REFERENCE,
    );
    expect(errors.expirationMonth).toBeUndefined();
    expect(errors.expirationYear).toBe('Card has expired');
  });

  it('flags an invalid CVC', () => {
    expect(validateCard({ ...validCard, cvc: '12' }, REFERENCE).cvc).toBeDefined();
  });

  it('collects multiple field errors at once', () => {
    const errors = validateCard(
      {
        cardNumber: 'invalid',
        holderName: '',
        expirationMonth: '99',
        expirationYear: 'xx',
        cvc: '1',
      },
      REFERENCE,
    );
    expect(Object.keys(errors).sort()).toEqual(
      ['cardNumber', 'cvc', 'expirationMonth', 'expirationYear', 'holderName'].sort(),
    );
  });
});

describe('isCardValid', () => {
  it('is true only when there are zero field errors', () => {
    expect(isCardValid(validCard, REFERENCE)).toBe(true);
    expect(isCardValid({ ...validCard, cvc: '12' }, REFERENCE)).toBe(false);
  });

  it('defaults to the real current date when none is provided', () => {
    expect(isCardValid({ ...validCard, expirationYear: '2099' })).toBe(true);
    expect(validateCard({ ...validCard, expirationYear: '2000' }).expirationYear).toBe(
      'Card has expired',
    );
  });
});
