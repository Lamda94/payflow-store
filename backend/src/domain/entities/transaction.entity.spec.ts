import { Transaction, TransactionStatus } from './transaction.entity';
import { TransactionAlreadyProcessedError } from '../errors/domain.errors';

const NOW = new Date('2026-01-01T00:00:00Z');
const LATER = new Date('2026-01-01T00:01:00Z');

const makePendingTransaction = () =>
  Transaction.createPending({
    id: 'txn-1',
    reference: 'ref-001',
    productId: 'p-1',
    quantity: 2,
    amountInCents: 398000,
    currency: 'COP',
    customerEmail: 'user@test.com',
    createdAt: NOW,
    updatedAt: NOW,
  });

describe('Transaction', () => {
  describe('createPending()', () => {
    it('creates transaction with PENDING status', () => {
      const txn = makePendingTransaction();
      expect(txn.status).toBe(TransactionStatus.PENDING);
      expect(txn.isPending()).toBe(true);
      expect(txn.isFinished()).toBe(false);
    });
  });

  describe('approve()', () => {
    it('transitions PENDING → APPROVED', () => {
      const txn = makePendingTransaction();
      txn.approve('psp-123', LATER);
      expect(txn.status).toBe(TransactionStatus.APPROVED);
      expect(txn.pspTransactionId).toBe('psp-123');
      expect(txn.updatedAt).toBe(LATER);
      expect(txn.isFinished()).toBe(true);
    });

    it('throws when already APPROVED', () => {
      const txn = makePendingTransaction();
      txn.approve('psp-123', LATER);
      expect(() => txn.approve('psp-456', LATER)).toThrow(
        TransactionAlreadyProcessedError,
      );
    });

    it('throws when DECLINED', () => {
      const txn = makePendingTransaction();
      txn.decline('psp-123', LATER);
      expect(() => txn.approve('psp-456', LATER)).toThrow(
        TransactionAlreadyProcessedError,
      );
    });

    it('throws when ERROR', () => {
      const txn = makePendingTransaction();
      txn.markAsError(LATER);
      expect(() => txn.approve('psp-456', LATER)).toThrow(
        TransactionAlreadyProcessedError,
      );
    });
  });

  describe('decline()', () => {
    it('transitions PENDING → DECLINED', () => {
      const txn = makePendingTransaction();
      txn.decline('psp-123', LATER);
      expect(txn.status).toBe(TransactionStatus.DECLINED);
      expect(txn.pspTransactionId).toBe('psp-123');
      expect(txn.isFinished()).toBe(true);
    });

    it('throws when already DECLINED', () => {
      const txn = makePendingTransaction();
      txn.decline('psp-123', LATER);
      expect(() => txn.decline('psp-456', LATER)).toThrow(
        TransactionAlreadyProcessedError,
      );
    });
  });

  describe('markAsError()', () => {
    it('transitions PENDING → ERROR', () => {
      const txn = makePendingTransaction();
      txn.markAsError(LATER);
      expect(txn.status).toBe(TransactionStatus.ERROR);
      expect(txn.isFinished()).toBe(true);
    });

    it('accepts optional pspTransactionId', () => {
      const txn = makePendingTransaction();
      txn.markAsError(LATER, 'psp-err-1');
      expect(txn.pspTransactionId).toBe('psp-err-1');
    });

    it('throws when already finished', () => {
      const txn = makePendingTransaction();
      txn.markAsError(LATER);
      expect(() => txn.markAsError(LATER)).toThrow(
        TransactionAlreadyProcessedError,
      );
    });
  });
});
