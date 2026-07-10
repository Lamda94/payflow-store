import { Transaction } from '../entities/transaction.entity';
import { Delivery } from '../entities/delivery.entity';

export interface PaymentUnitOfWork {
  /**
   * Persists the approved payment atomically: transaction update,
   * delivery creation and stock decrement happen in a single DB
   * transaction. The stock decrement is guarded (stock >= quantity)
   * so stock can never go negative even under concurrent payments.
   * Throws InsufficientStockError if the guard rejects the decrement.
   */
  saveApprovedPayment(
    transaction: Transaction,
    delivery: Delivery,
  ): Promise<void>;
}

export const PAYMENT_UNIT_OF_WORK = Symbol('PaymentUnitOfWork');
