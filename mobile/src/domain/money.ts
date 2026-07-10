/**
 * Hand-rolled instead of Intl.NumberFormat: Hermes' Intl support has
 * historically been partial/build-flag-gated, and this needs to render
 * identically on every device without relying on it.
 */
export function formatMoney(amountInCents: number, currency: string): string {
  const [whole, decimals] = (amountInCents / 100).toFixed(2).split('.');
  const withThousands = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${currency} ${withThousands}.${decimals}`;
}
