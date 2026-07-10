import { Transaction } from '../../domain/entities/transaction.entity';
import {
  ProductNotFoundError,
  InsufficientStockError,
} from '../../domain/errors/domain.errors';
import { ProductRepository } from '../../domain/ports/product.repository.port';
import { TransactionRepository } from '../../domain/ports/transaction.repository.port';
import { IdGenerator } from '../../domain/ports/id-generator.port';

export interface CreateTransactionInput {
  productId: string;
  quantity: number;
  customerEmail: string;
}

export interface CreateTransactionOutput {
  transactionId: string;
  reference: string;
  amountInCents: number;
  currency: string;
}

export class CreateTransactionUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(
    input: CreateTransactionInput,
  ): Promise<CreateTransactionOutput> {
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      throw new ProductNotFoundError(input.productId);
    }

    if (!product.hasStock(input.quantity)) {
      throw new InsufficientStockError(product.stock, input.quantity);
    }

    const now = new Date();
    const transaction = Transaction.createPending({
      id: this.idGenerator.generate(),
      reference: this.idGenerator.generate(),
      productId: input.productId,
      quantity: input.quantity,
      amountInCents: product.priceInCents * input.quantity,
      currency: product.currency,
      customerEmail: input.customerEmail,
      createdAt: now,
      updatedAt: now,
    });

    await this.transactionRepository.save(transaction);

    return {
      transactionId: transaction.id,
      reference: transaction.reference,
      amountInCents: transaction.amountInCents,
      currency: transaction.currency,
    };
  }
}
