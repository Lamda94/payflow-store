export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InsufficientStockError extends DomainError {
  constructor(available: number, requested: number) {
    super(`Insufficient stock: requested ${requested}, available ${available}`);
  }
}

export class InvalidTransactionStateError extends DomainError {
  constructor(from: string, to: string) {
    super(`Invalid transaction state transition: ${from} → ${to}`);
  }
}

export class ProductNotFoundError extends DomainError {
  constructor(productId: string) {
    super(`Product not found: ${productId}`);
  }
}

export class TransactionNotFoundError extends DomainError {
  constructor(transactionId: string) {
    super(`Transaction not found: ${transactionId}`);
  }
}

export class TransactionAlreadyProcessedError extends DomainError {
  constructor(transactionId: string) {
    super(`Transaction already processed: ${transactionId}`);
  }
}
