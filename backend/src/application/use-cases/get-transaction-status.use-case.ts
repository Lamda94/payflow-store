import { Transaction } from '../../domain/entities/transaction.entity';
import { TransactionNotFoundError } from '../../domain/errors/domain.errors';
import { TransactionRepository } from '../../domain/ports/transaction.repository.port';

export class GetTransactionStatusUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(transactionId: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(transactionId);
    if (!transaction) {
      throw new TransactionNotFoundError(transactionId);
    }
    return transaction;
  }
}
