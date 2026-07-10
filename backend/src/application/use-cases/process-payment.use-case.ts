import { Delivery } from '../../domain/entities/delivery.entity';
import { TransactionStatus } from '../../domain/entities/transaction.entity';
import {
  TransactionNotFoundError,
  TransactionAlreadyProcessedError,
  ProductNotFoundError,
} from '../../domain/errors/domain.errors';
import {
  CardData,
  PaymentGateway,
  PaymentResultStatus,
} from '../../domain/ports/payment-gateway.port';
import { ProductRepository } from '../../domain/ports/product.repository.port';
import { TransactionRepository } from '../../domain/ports/transaction.repository.port';
import { PaymentUnitOfWork } from '../../domain/ports/payment-unit-of-work.port';
import { IdGenerator } from '../../domain/ports/id-generator.port';

export interface ProcessPaymentInput {
  transactionId: string;
  cardData: CardData;
}

export interface ProcessPaymentOutput {
  status: TransactionStatus;
  transactionId: string;
  pspTransactionId?: string;
}

export class ProcessPaymentUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly productRepository: ProductRepository,
    private readonly paymentUnitOfWork: PaymentUnitOfWork,
    private readonly paymentGateway: PaymentGateway,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: ProcessPaymentInput): Promise<ProcessPaymentOutput> {
    const transaction = await this.transactionRepository.findById(
      input.transactionId,
    );
    if (!transaction) {
      throw new TransactionNotFoundError(input.transactionId);
    }

    if (transaction.isFinished()) {
      throw new TransactionAlreadyProcessedError(input.transactionId);
    }

    const product = await this.productRepository.findById(
      transaction.productId,
    );
    if (!product) {
      throw new ProductNotFoundError(transaction.productId);
    }

    const result = await this.paymentGateway.charge(
      input.cardData,
      transaction.amountInCents,
      transaction.currency,
      transaction.reference,
      transaction.customerEmail,
    );

    const now = new Date();

    if (result.status === PaymentResultStatus.APPROVED) {
      transaction.approve(result.pspTransactionId, now);
      product.decreaseStock(transaction.quantity);

      const delivery = Delivery.create({
        id: this.idGenerator.generate(),
        transactionId: transaction.id,
        productId: transaction.productId,
        customerEmail: transaction.customerEmail,
        quantity: transaction.quantity,
        createdAt: now,
      });

      await this.paymentUnitOfWork.saveApprovedPayment(transaction, delivery);
    } else if (result.status === PaymentResultStatus.DECLINED) {
      transaction.decline(result.pspTransactionId, now);
      await this.transactionRepository.save(transaction);
    } else {
      transaction.markAsError(now, result.pspTransactionId);
      await this.transactionRepository.save(transaction);
    }

    return {
      status: transaction.status,
      transactionId: transaction.id,
      pspTransactionId: transaction.pspTransactionId,
    };
  }
}
