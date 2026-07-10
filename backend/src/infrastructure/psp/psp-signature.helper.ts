import { createHash } from 'crypto';

export function buildIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string,
  integrityKey: string,
): string {
  const raw = `${reference}${amountInCents}${currency}${integrityKey}`;
  return createHash('sha256').update(raw).digest('hex');
}
