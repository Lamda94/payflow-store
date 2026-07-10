import type { CardBrand } from './types';

/** Detects VISA / MasterCard by IIN prefix. Works incrementally as the user types. */
export function detectCardBrand(cardNumber: string): CardBrand {
  const digits = cardNumber.replace(/\D/g, '');

  if (/^4/.test(digits)) {
    return 'visa';
  }

  if (/^5[1-5]/.test(digits)) {
    return 'mastercard';
  }

  if (digits.length >= 4) {
    const prefix = parseInt(digits.slice(0, 4), 10);
    if (prefix >= 2221 && prefix <= 2720) {
      return 'mastercard';
    }
  }

  return 'unknown';
}
