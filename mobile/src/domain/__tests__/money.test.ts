import { formatMoney } from '../money';

describe('formatMoney', () => {
  it('formats cents into a grouped decimal amount with currency prefix', () => {
    expect(formatMoney(28900000, 'COP')).toBe('COP 289,000.00');
  });

  it('formats small amounts without thousands separators', () => {
    expect(formatMoney(500, 'COP')).toBe('COP 5.00');
  });

  it('formats zero', () => {
    expect(formatMoney(0, 'COP')).toBe('COP 0.00');
  });

  it('groups millions correctly', () => {
    expect(formatMoney(123456789, 'COP')).toBe('COP 1,234,567.89');
  });
});
