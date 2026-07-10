import {
  InsufficientStockError,
  InvalidTransactionStateError,
  ProductNotFoundError,
  TransactionNotFoundError,
  TransactionAlreadyProcessedError,
} from './domain.errors';

describe('DomainErrors', () => {
  it('InsufficientStockError has correct message and name', () => {
    const err = new InsufficientStockError(2, 5);
    expect(err.message).toContain('requested 5');
    expect(err.message).toContain('available 2');
    expect(err.name).toBe('InsufficientStockError');
  });

  it('InvalidTransactionStateError has correct message', () => {
    const err = new InvalidTransactionStateError('APPROVED', 'DECLINED');
    expect(err.message).toContain('APPROVED');
    expect(err.message).toContain('DECLINED');
  });

  it('ProductNotFoundError has correct message', () => {
    const err = new ProductNotFoundError('p-1');
    expect(err.message).toContain('p-1');
  });

  it('TransactionNotFoundError has correct message', () => {
    const err = new TransactionNotFoundError('txn-1');
    expect(err.message).toContain('txn-1');
  });

  it('TransactionAlreadyProcessedError has correct message', () => {
    const err = new TransactionAlreadyProcessedError('txn-1');
    expect(err.message).toContain('txn-1');
  });
});
