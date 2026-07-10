import { TypeOrmTransactionRepository } from './typeorm-transaction.repository';
import { TransactionOrmEntity } from '../entities/transaction.orm-entity';
import {
  Transaction,
  TransactionStatus,
} from '../../../domain/entities/transaction.entity';

const NOW = new Date('2026-01-01T00:00:00Z');

const makeOrmEntity = (): TransactionOrmEntity => {
  const e = new TransactionOrmEntity();
  e.id = 'txn-1';
  e.reference = 'ref-001';
  e.productId = 'p-1';
  e.quantity = 1;
  e.amountInCents = 100000;
  e.currency = 'COP';
  e.customerEmail = 'user@test.com';
  e.status = TransactionStatus.PENDING;
  e.pspTransactionId = null;
  e.createdAt = NOW;
  e.updatedAt = NOW;
  return e;
};

const makeRepo = (overrides = {}) =>
  new TypeOrmTransactionRepository({
    findOneBy: jest.fn(),
    save: jest.fn(),
    ...overrides,
  } as never);

describe('TypeOrmTransactionRepository', () => {
  describe('findById()', () => {
    it('returns domain transaction when found', async () => {
      const repo = makeRepo({
        findOneBy: jest.fn().mockResolvedValue(makeOrmEntity()),
      });
      const result = await repo.findById('txn-1');
      expect(result).toBeInstanceOf(Transaction);
      expect(result?.id).toBe('txn-1');
    });

    it('returns null when not found', async () => {
      const repo = makeRepo({ findOneBy: jest.fn().mockResolvedValue(null) });
      expect(await repo.findById('txn-999')).toBeNull();
    });
  });

  describe('findByReference()', () => {
    it('returns transaction by reference', async () => {
      const repo = makeRepo({
        findOneBy: jest.fn().mockResolvedValue(makeOrmEntity()),
      });
      const result = await repo.findByReference('ref-001');
      expect(result?.reference).toBe('ref-001');
    });
  });

  describe('save()', () => {
    it('calls repo.save with mapped ORM entity', async () => {
      const saveFn = jest.fn().mockResolvedValue(undefined);
      const repo = makeRepo({ save: saveFn });
      const txn = Transaction.createPending({
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
      await repo.save(txn);
      expect(saveFn).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'txn-1' }),
      );
    });
  });
});
