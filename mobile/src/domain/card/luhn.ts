/**
 * Mirrors the backend's IsLuhnValid check exactly (same digit-length
 * bounds, same algorithm) so client-side and server-side validation
 * never disagree on the same input.
 */
export function isValidCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let isDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (isDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    isDouble = !isDouble;
  }
  return sum % 10 === 0;
}
