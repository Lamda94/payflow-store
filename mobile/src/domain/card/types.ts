export type CardBrand = 'visa' | 'mastercard' | 'unknown';

export interface CardInput {
  cardNumber: string;
  holderName: string;
  expirationMonth: string;
  expirationYear: string;
  cvc: string;
}

export interface CardValidationErrors {
  cardNumber?: string;
  holderName?: string;
  expirationMonth?: string;
  expirationYear?: string;
  cvc?: string;
}
