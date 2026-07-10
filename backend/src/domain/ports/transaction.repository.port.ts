import { Transaction } from '../entities/transaction.entity';

export interface TransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  findByReference(reference: string): Promise<Transaction | null>;
  save(transaction: Transaction): Promise<void>;
}

export const TRANSACTION_REPOSITORY = Symbol('TransactionRepository');
