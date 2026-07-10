import { GetTransactionStatusUseCase } from './get-transaction-status.use-case';
import { Transaction } from '../../domain/entities/transaction.entity';
import { TransactionRepository } from '../../domain/ports/transaction.repository.port';
import { TransactionNotFoundError } from '../../domain/errors/domain.errors';

const NOW = new Date('2026-01-01T00:00:00Z');

const makeTxn = () =>
  Transaction.createPending({
    id: 'txn-1',
    reference: 'ref-001',
    productId: 'p-1',
    quantity: 1,
    amountInCents: 100000,
    currency: 'COP',
    customerEmail: 'user@test.com',
    createdAt: NOW,
    updatedAt: NOW,
  });

const makeRepo = (txn: Transaction | null): TransactionRepository => ({
  findById: jest.fn().mockResolvedValue(txn),
  findByReference: jest.fn(),
  save: jest.fn(),
});

describe('GetTransactionStatusUseCase', () => {
  it('returns transaction when found', async () => {
    const txn = makeTxn();
    const useCase = new GetTransactionStatusUseCase(makeRepo(txn));
    const result = await useCase.execute('txn-1');
    expect(result.id).toBe('txn-1');
  });

  it('throws TransactionNotFoundError when not found', async () => {
    const useCase = new GetTransactionStatusUseCase(makeRepo(null));
    await expect(useCase.execute('txn-999')).rejects.toThrow(TransactionNotFoundError);
  });
});
