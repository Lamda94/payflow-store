import { ProcessPaymentUseCase } from './process-payment.use-case';
import { Transaction, TransactionStatus } from '../../domain/entities/transaction.entity';
import { Product } from '../../domain/entities/product.entity';
import { TransactionRepository } from '../../domain/ports/transaction.repository.port';
import { ProductRepository } from '../../domain/ports/product.repository.port';
import { DeliveryRepository } from '../../domain/ports/delivery.repository.port';
import { PaymentGateway, PaymentResultStatus } from '../../domain/ports/payment-gateway.port';
import { IdGenerator } from '../../domain/ports/id-generator.port';
import {
  TransactionNotFoundError,
  TransactionAlreadyProcessedError,
  ProductNotFoundError,
} from '../../domain/errors/domain.errors';

const NOW = new Date('2026-01-01T00:00:00Z');

const makePendingTxn = () =>
  Transaction.createPending({
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

const makeProduct = (stock = 10) =>
  new Product('p-1', 'Product', 'Desc', 'http://img.url', 100000, 'COP', stock);

const makeTransactionRepo = (txn: Transaction | null): TransactionRepository => ({
  findById: jest.fn().mockResolvedValue(txn),
  findByReference: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
});

const makeProductRepo = (product: Product | null): ProductRepository => ({
  findById: jest.fn().mockResolvedValue(product),
  findAllAvailable: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
});

const makeDeliveryRepo = (): DeliveryRepository => ({
  save: jest.fn().mockResolvedValue(undefined),
});

const makeGateway = (status: PaymentResultStatus): PaymentGateway => ({
  charge: jest.fn().mockResolvedValue({ status, pspTransactionId: 'psp-123' }),
});

const makeIdGenerator = (): IdGenerator => ({
  generate: jest.fn().mockReturnValue('delivery-id-1'),
});

const makeCardData = () => ({
  number: '4111111111111111',
  holderName: 'Test User',
  expirationMonth: '12',
  expirationYear: '2030',
  cvc: '123',
  installments: 1,
});

describe('ProcessPaymentUseCase', () => {
  describe('happy path — APPROVED', () => {
    it('approves transaction, creates delivery and decreases stock', async () => {
      const txnRepo = makeTransactionRepo(makePendingTxn());
      const productRepo = makeProductRepo(makeProduct(10));
      const deliveryRepo = makeDeliveryRepo();

      const useCase = new ProcessPaymentUseCase(
        txnRepo, productRepo, deliveryRepo,
        makeGateway(PaymentResultStatus.APPROVED), makeIdGenerator(),
      );

      const result = await useCase.execute({ transactionId: 'txn-1', cardData: makeCardData() });

      expect(result.status).toBe(TransactionStatus.APPROVED);
      expect(result.pspTransactionId).toBe('psp-123');
      expect(txnRepo.save).toHaveBeenCalledTimes(1);
      expect(productRepo.save).toHaveBeenCalledTimes(1);
      expect(deliveryRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('unhappy path — DECLINED', () => {
    it('declines transaction and does not touch stock or delivery', async () => {
      const txnRepo = makeTransactionRepo(makePendingTxn());
      const productRepo = makeProductRepo(makeProduct(10));
      const deliveryRepo = makeDeliveryRepo();

      const useCase = new ProcessPaymentUseCase(
        txnRepo, productRepo, deliveryRepo,
        makeGateway(PaymentResultStatus.DECLINED), makeIdGenerator(),
      );

      const result = await useCase.execute({ transactionId: 'txn-1', cardData: makeCardData() });

      expect(result.status).toBe(TransactionStatus.DECLINED);
      expect(productRepo.save).not.toHaveBeenCalled();
      expect(deliveryRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('unhappy path — ERROR', () => {
    it('marks transaction as error and does not touch stock or delivery', async () => {
      const txnRepo = makeTransactionRepo(makePendingTxn());
      const productRepo = makeProductRepo(makeProduct(10));
      const deliveryRepo = makeDeliveryRepo();

      const useCase = new ProcessPaymentUseCase(
        txnRepo, productRepo, deliveryRepo,
        makeGateway(PaymentResultStatus.ERROR), makeIdGenerator(),
      );

      const result = await useCase.execute({ transactionId: 'txn-1', cardData: makeCardData() });

      expect(result.status).toBe(TransactionStatus.ERROR);
      expect(productRepo.save).not.toHaveBeenCalled();
      expect(deliveryRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('error cases', () => {
    it('throws TransactionNotFoundError when transaction does not exist', async () => {
      const useCase = new ProcessPaymentUseCase(
        makeTransactionRepo(null), makeProductRepo(makeProduct()),
        makeDeliveryRepo(), makeGateway(PaymentResultStatus.APPROVED), makeIdGenerator(),
      );

      await expect(
        useCase.execute({ transactionId: 'txn-999', cardData: makeCardData() }),
      ).rejects.toThrow(TransactionNotFoundError);
    });

    it('throws TransactionAlreadyProcessedError when transaction is already finished', async () => {
      const txn = makePendingTxn();
      txn.approve('psp-123', NOW);

      const useCase = new ProcessPaymentUseCase(
        makeTransactionRepo(txn), makeProductRepo(makeProduct()),
        makeDeliveryRepo(), makeGateway(PaymentResultStatus.APPROVED), makeIdGenerator(),
      );

      await expect(
        useCase.execute({ transactionId: 'txn-1', cardData: makeCardData() }),
      ).rejects.toThrow(TransactionAlreadyProcessedError);
    });

    it('throws ProductNotFoundError when product no longer exists', async () => {
      const useCase = new ProcessPaymentUseCase(
        makeTransactionRepo(makePendingTxn()), makeProductRepo(null),
        makeDeliveryRepo(), makeGateway(PaymentResultStatus.APPROVED), makeIdGenerator(),
      );

      await expect(
        useCase.execute({ transactionId: 'txn-1', cardData: makeCardData() }),
      ).rejects.toThrow(ProductNotFoundError);
    });

    it('does not call gateway when transaction is already processed', async () => {
      const txn = makePendingTxn();
      txn.approve('psp-123', NOW);
      const gateway = makeGateway(PaymentResultStatus.APPROVED);

      const useCase = new ProcessPaymentUseCase(
        makeTransactionRepo(txn), makeProductRepo(makeProduct()),
        makeDeliveryRepo(), gateway, makeIdGenerator(),
      );

      await useCase.execute({ transactionId: 'txn-1', cardData: makeCardData() }).catch(() => {});

      expect(gateway.charge).not.toHaveBeenCalled();
    });
  });
});
