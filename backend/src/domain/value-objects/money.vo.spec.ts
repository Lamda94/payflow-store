import { Money } from './money.vo';

describe('Money', () => {
  describe('of()', () => {
    it('creates a valid money instance', () => {
      const m = Money.of(199000, 'COP');
      expect(m.amountInCents).toBe(199000);
      expect(m.currency).toBe('COP');
    });

    it('normalizes currency to uppercase', () => {
      expect(Money.of(100, 'cop').currency).toBe('COP');
    });

    it('allows zero amount', () => {
      expect(Money.of(0, 'COP').amountInCents).toBe(0);
    });

    it('throws on float amount', () => {
      expect(() => Money.of(19.9, 'COP')).toThrow('non-negative integer');
    });

    it('throws on negative amount', () => {
      expect(() => Money.of(-1, 'COP')).toThrow('non-negative integer');
    });

    it('throws on empty currency', () => {
      expect(() => Money.of(100, '')).toThrow('Currency is required');
    });
  });

  describe('equals()', () => {
    it('returns true for same amount and currency', () => {
      expect(Money.of(100, 'COP').equals(Money.of(100, 'COP'))).toBe(true);
    });

    it('returns false for different amount', () => {
      expect(Money.of(100, 'COP').equals(Money.of(200, 'COP'))).toBe(false);
    });

    it('returns false for different currency', () => {
      expect(Money.of(100, 'COP').equals(Money.of(100, 'USD'))).toBe(false);
    });
  });

  describe('add()', () => {
    it('adds two money values of same currency', () => {
      const result = Money.of(100, 'COP').add(Money.of(200, 'COP'));
      expect(result.amountInCents).toBe(300);
    });

    it('throws when currencies differ', () => {
      expect(() => Money.of(100, 'COP').add(Money.of(100, 'USD'))).toThrow(
        'Cannot add different currencies',
      );
    });
  });

  describe('multiply()', () => {
    it('multiplies amount by integer factor', () => {
      expect(Money.of(1000, 'COP').multiply(3).amountInCents).toBe(3000);
    });

    it('throws on float factor', () => {
      expect(() => Money.of(1000, 'COP').multiply(1.5)).toThrow(
        'non-negative integer',
      );
    });

    it('throws on negative factor', () => {
      expect(() => Money.of(1000, 'COP').multiply(-1)).toThrow(
        'non-negative integer',
      );
    });
  });

  describe('toString()', () => {
    it('formats amount with currency', () => {
      expect(Money.of(199000, 'COP').toString()).toContain('COP');
    });
  });
});
