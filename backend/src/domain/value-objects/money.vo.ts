export class Money {
  private constructor(
    readonly amountInCents: number,
    readonly currency: string,
  ) {}

  static of(amountInCents: number, currency: string): Money {
    if (!Number.isInteger(amountInCents) || amountInCents < 0) {
      throw new Error('Amount must be a non-negative integer in cents');
    }
    if (!currency || currency.trim().length === 0) {
      throw new Error('Currency is required');
    }
    return new Money(amountInCents, currency.trim().toUpperCase());
  }

  equals(other: Money): boolean {
    return (
      this.amountInCents === other.amountInCents &&
      this.currency === other.currency
    );
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error(
        `Cannot add different currencies: ${this.currency} and ${other.currency}`,
      );
    }
    return new Money(this.amountInCents + other.amountInCents, this.currency);
  }

  multiply(factor: number): Money {
    if (!Number.isInteger(factor) || factor < 0) {
      throw new Error('Factor must be a non-negative integer');
    }
    return new Money(this.amountInCents * factor, this.currency);
  }

  toString(): string {
    const amount = this.amountInCents / 100;
    return `${amount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${this.currency}`;
  }
}
