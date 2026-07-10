/**
 * Both formatters are stateless: called with the *current* input text on
 * every keystroke, they strip non-digits and rebuild the display string
 * from scratch. That makes them backspace-safe without any caller-side
 * bookkeeping (the caller never needs to know if a separator was just
 * deleted or typed over).
 */

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return (digits.match(/.{1,4}/g) ?? []).join(' ');
}

export function formatExpiration(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
