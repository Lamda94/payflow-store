import { DataSource, EntityManager } from 'typeorm';
import { TypeOrmPaymentUnitOfWork } from './typeorm-payment.unit-of-work';
import {
  Transaction,
  TransactionStatus,
} from '../../../domain/entities/transaction.entity';
import { Delivery } from '../../../domain/entities/delivery.entity';
import { InsufficientStockError } from '../../../domain/errors/domain.errors';
import { TransactionOrmEntity } from '../entities/transaction.orm-entity';
import { DeliveryOrmEntity } from '../entities/delivery.orm-entity';

const NOW = new Date('2026-01-01T00:00:00Z');

const makeApprovedTransaction = () => {
  const txn = Transaction.createPending({
    id: 'txn-1',
    reference: 'ref-001',
    productId: 'p-1',
    quantity: 2,
    amountInCents: 200000,
    currency: 'COP',
    customerEmail: 'user@test.com',
    createdAt: NOW,
    updatedAt: NOW,
  });
  txn.approve('psp-123', NOW);
  return txn;
};

const makeDelivery = () =>
  Delivery.create({
    id: 'd-1',
    transactionId: 'txn-1',
    productId: 'p-1',
    customerEmail: 'user@test.com',
    quantity: 2,
    createdAt: NOW,
  });

interface ManagerMocks {
  manager: EntityManager;
  execute: jest.Mock;
  save: jest.Mock;
  findOneBy: jest.Mock;
  where: jest.Mock;
}

const makeManager = (affected: number, currentStock = 0): ManagerMocks => {
  const execute = jest.fn().mockResolvedValue({ affected });
  const save = jest.fn().mockResolvedValue(undefined);
  const findOneBy = jest.fn().mockResolvedValue({ stock: currentStock });
  const where = jest.fn().mockReturnValue({ execute });
  const manager = {
    createQueryBuilder: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({ where }),
      }),
    }),
    save,
    findOneBy,
  } as unknown as EntityManager;
  return { manager, execute, save, findOneBy, where };
};

const makeUnitOfWork = (mocks: ManagerMocks) => {
  const dataSource = {
    transaction: jest.fn(
      (fn: (manager: EntityManager) => Promise<void>): Promise<void> =>
        fn(mocks.manager),
    ),
  } as unknown as DataSource;
  return new TypeOrmPaymentUnitOfWork(dataSource);
};

describe('TypeOrmPaymentUnitOfWork', () => {
  it('decrements stock with guard and saves transaction + delivery in one DB transaction', async () => {
    const mocks = makeManager(1);
    const uow = makeUnitOfWork(mocks);

    await uow.saveApprovedPayment(makeApprovedTransaction(), makeDelivery());

    expect(mocks.where).toHaveBeenCalledWith(
      'id = :productId AND stock >= :qty',
      { productId: 'p-1', qty: 2 },
    );
    expect(mocks.save).toHaveBeenCalledTimes(2);

    const savedEntities = mocks.save.mock.calls.map(
      (call: unknown[]) => call[0],
    );
    const savedTxn = savedEntities.find(
      (e): e is TransactionOrmEntity => e instanceof TransactionOrmEntity,
    );
    const savedDelivery = savedEntities.find(
      (e): e is DeliveryOrmEntity => e instanceof DeliveryOrmEntity,
    );
    expect(savedTxn?.status).toBe(TransactionStatus.APPROVED);
    expect(savedDelivery?.transactionId).toBe('txn-1');
  });

  it('throws InsufficientStockError and saves nothing when the guard rejects the decrement', async () => {
    const mocks = makeManager(0, 1);
    const uow = makeUnitOfWork(mocks);

    await expect(
      uow.saveApprovedPayment(makeApprovedTransaction(), makeDelivery()),
    ).rejects.toThrow(InsufficientStockError);

    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('reports 0 available when the product row no longer exists', async () => {
    const mocks = makeManager(0);
    mocks.findOneBy.mockResolvedValue(null);
    const uow = makeUnitOfWork(mocks);

    await expect(
      uow.saveApprovedPayment(makeApprovedTransaction(), makeDelivery()),
    ).rejects.toThrow('Insufficient stock: requested 2, available 0');
  });
});
