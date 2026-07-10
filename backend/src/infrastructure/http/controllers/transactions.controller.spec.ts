import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import {
  CREATE_TRANSACTION_USE_CASE,
  GET_TRANSACTION_STATUS_USE_CASE,
  PROCESS_PAYMENT_USE_CASE,
} from '../tokens/use-case.tokens';
import { CreateTransactionDto } from '../dtos/create-transaction.dto';
import { PayTransactionDto } from '../dtos/pay-transaction.dto';
import { TransactionStatus } from '../../../domain/entities/transaction.entity';

const VALID_TRANSACTION_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let createMock: { execute: jest.Mock };
  let processMock: { execute: jest.Mock };
  let getStatusMock: { execute: jest.Mock };

  beforeEach(async () => {
    createMock = { execute: jest.fn() };
    processMock = { execute: jest.fn() };
    getStatusMock = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        { provide: CREATE_TRANSACTION_USE_CASE, useValue: createMock },
        { provide: PROCESS_PAYMENT_USE_CASE, useValue: processMock },
        { provide: GET_TRANSACTION_STATUS_USE_CASE, useValue: getStatusMock },
      ],
    }).compile();

    controller = module.get(TransactionsController);
  });

  describe('create()', () => {
    it('delegates to CreateTransactionUseCase and returns output', async () => {
      const dto: CreateTransactionDto = {
        productId: VALID_TRANSACTION_ID,
        quantity: 2,
        customerEmail: 'user@test.com',
      };

      const useCaseOutput = {
        transactionId: 'txn-1',
        reference: 'ref-abc',
        amountInCents: 399800,
        currency: 'COP',
      };
      createMock.execute.mockResolvedValue(useCaseOutput);

      const result = await controller.create(dto);

      expect(createMock.execute).toHaveBeenCalledWith({
        productId: VALID_TRANSACTION_ID,
        quantity: 2,
        customerEmail: 'user@test.com',
      });
      expect(result).toEqual(useCaseOutput);
    });
  });

  describe('pay()', () => {
    it('maps DTO to CardData and returns payment result', async () => {
      const dto: PayTransactionDto = {
        cardNumber: '4111111111111111',
        holderName: 'John Doe',
        expirationMonth: '12',
        expirationYear: '2030',
        cvc: '123',
        installments: 1,
      };

      processMock.execute.mockResolvedValue({
        status: TransactionStatus.APPROVED,
        transactionId: VALID_TRANSACTION_ID,
        pspTransactionId: 'psp-001',
      });

      const result = await controller.pay(VALID_TRANSACTION_ID, dto);

      expect(processMock.execute).toHaveBeenCalledWith({
        transactionId: VALID_TRANSACTION_ID,
        cardData: {
          number: '4111111111111111',
          holderName: 'John Doe',
          expirationMonth: '12',
          expirationYear: '2030',
          cvc: '123',
          installments: 1,
        },
      });
      expect(result).toEqual({
        status: TransactionStatus.APPROVED,
        transactionId: VALID_TRANSACTION_ID,
        pspTransactionId: 'psp-001',
      });
    });

    it('propagates use case errors (gateway errors are handled by filter)', async () => {
      const dto: PayTransactionDto = {
        cardNumber: '4111111111111111',
        holderName: 'John Doe',
        expirationMonth: '12',
        expirationYear: '2030',
        cvc: '123',
        installments: 1,
      };

      processMock.execute.mockRejectedValue(new Error('ECONNREFUSED'));
      await expect(controller.pay(VALID_TRANSACTION_ID, dto)).rejects.toThrow(
        'ECONNREFUSED',
      );
    });
  });

  describe('findOne()', () => {
    it('returns mapped transaction status', async () => {
      const now = new Date('2024-01-15T10:00:00Z');
      getStatusMock.execute.mockResolvedValue({
        id: VALID_TRANSACTION_ID,
        status: TransactionStatus.PENDING,
        amountInCents: 199900,
        currency: 'COP',
        createdAt: now,
      });

      const result = await controller.findOne(VALID_TRANSACTION_ID);

      expect(getStatusMock.execute).toHaveBeenCalledWith(VALID_TRANSACTION_ID);
      expect(result).toEqual({
        id: VALID_TRANSACTION_ID,
        status: TransactionStatus.PENDING,
        amountInCents: 199900,
        currency: 'COP',
        createdAt: now,
      });
    });
  });
});
