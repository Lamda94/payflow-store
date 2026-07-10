import { Transaction, TransactionStatus } from '../../../domain/entities/transaction.entity';
import { TransactionOrmEntity } from '../entities/transaction.orm-entity';
import { TransactionMapper } from './transaction.mapper';

const NOW = new Date('2026-01-01T00:00:00Z');

const makeOrm = (): TransactionOrmEntity => {
  const orm = new TransactionOrmEntity();
  orm.id = 'txn-1';
  orm.reference = 'ref-001';
  orm.productId = 'p-1';
  orm.quantity = 2;
  orm.amountInCents = 200000;
  orm.currency = 'COP';
  orm.customerEmail = 'user@test.com';
  orm.status = TransactionStatus.PENDING;
  orm.pspTransactionId = null;
  orm.createdAt = NOW;
  orm.updatedAt = NOW;
  return orm;
};

describe('TransactionMapper', () => {
  it('maps ORM to domain correctly', () => {
    const domain = TransactionMapper.toDomain(makeOrm());
    expect(domain).toBeInstanceOf(Transaction);
    expect(domain.id).toBe('txn-1');
    expect(domain.status).toBe(TransactionStatus.PENDING);
    expect(domain.pspTransactionId).toBeUndefined();
  });

  it('maps null pspTransactionId to undefined in domain', () => {
    const orm = makeOrm();
    orm.pspTransactionId = null;
    const domain = TransactionMapper.toDomain(orm);
    expect(domain.pspTransactionId).toBeUndefined();
  });

  it('maps domain to ORM correctly', () => {
    const domain = Transaction.createPending({
      id: 'txn-1', reference: 'ref-001', productId: 'p-1',
      quantity: 2, amountInCents: 200000, currency: 'COP',
      customerEmail: 'user@test.com', createdAt: NOW, updatedAt: NOW,
    });
    const orm = TransactionMapper.toOrm(domain);
    expect(orm).toBeInstanceOf(TransactionOrmEntity);
    expect(orm.status).toBe(TransactionStatus.PENDING);
    expect(orm.pspTransactionId).toBeNull();
  });

  it('maps approved domain to ORM with pspTransactionId', () => {
    const domain = Transaction.createPending({
      id: 'txn-1', reference: 'ref-001', productId: 'p-1',
      quantity: 1, amountInCents: 100000, currency: 'COP',
      customerEmail: 'user@test.com', createdAt: NOW, updatedAt: NOW,
    });
    domain.approve('psp-123', new Date());
    const orm = TransactionMapper.toOrm(domain);
    expect(orm.status).toBe(TransactionStatus.APPROVED);
    expect(orm.pspTransactionId).toBe('psp-123');
  });
});
