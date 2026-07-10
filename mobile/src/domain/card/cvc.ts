export function isValidCvc(cvc: string): boolean {
  return /^\d{3,4}$/.test(cvc);
}
