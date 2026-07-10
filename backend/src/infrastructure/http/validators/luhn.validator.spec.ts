import { validate } from 'class-validator';
import { IsLuhnValid } from './luhn.validator';

class TestDto {
  @IsLuhnValid()
  cardNumber: string;
}

async function validateCard(number: string) {
  const dto = Object.assign(new TestDto(), { cardNumber: number });
  return validate(dto);
}

describe('IsLuhnValid', () => {
  it('accepts a valid Visa test number', async () => {
    const errors = await validateCard('4111111111111111');
    expect(errors).toHaveLength(0);
  });

  it('accepts a valid Mastercard test number', async () => {
    const errors = await validateCard('5500005555555559');
    expect(errors).toHaveLength(0);
  });

  it('rejects a number that fails Luhn check', async () => {
    const errors = await validateCard('4111111111111112');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isLuhnValid).toContain('Luhn');
  });

  it('rejects a non-string value', async () => {
    const dto = Object.assign(new TestDto(), { cardNumber: 12345 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects a string too short to be a card number', async () => {
    const errors = await validateCard('123456789012');
    expect(errors.length).toBeGreaterThan(0);
  });
});
