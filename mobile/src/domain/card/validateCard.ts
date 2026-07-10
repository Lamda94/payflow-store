import { isValidCardNumber } from './luhn';
import { isFutureExpiration } from './expiration';
import { isValidCvc } from './cvc';
import type { CardInput, CardValidationErrors } from './types';

export function validateCard(
  input: CardInput,
  referenceDate: Date = new Date(),
): CardValidationErrors {
  const errors: CardValidationErrors = {};

  if (!isValidCardNumber(input.cardNumber)) {
    errors.cardNumber = 'Enter a valid card number';
  }

  if (!input.holderName.trim()) {
    errors.holderName = 'Cardholder name is required';
  }

  const monthValid = /^(0[1-9]|1[0-2])$/.test(input.expirationMonth);
  if (!monthValid) {
    errors.expirationMonth = 'Enter a valid month (01-12)';
  }

  const yearValid = /^\d{4}$/.test(input.expirationYear);
  if (!yearValid) {
    errors.expirationYear = 'Enter a valid 4-digit year';
  }

  if (
    monthValid &&
    yearValid &&
    !isFutureExpiration(input.expirationMonth, input.expirationYear, referenceDate)
  ) {
    errors.expirationYear = 'Card has expired';
  }

  if (!isValidCvc(input.cvc)) {
    errors.cvc = 'CVC must be 3 or 4 digits';
  }

  return errors;
}

export function isCardValid(
  input: CardInput,
  referenceDate: Date = new Date(),
): boolean {
  return Object.keys(validateCard(input, referenceDate)).length === 0;
}
