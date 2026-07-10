import { Transaction } from '../../../domain/entities/transaction.entity';
import { TransactionOrmEntity } from '../entities/transaction.orm-entity';

export class TransactionMapper {
  static toDomain(orm: TransactionOrmEntity): Transaction {
    return new Transaction({
      id: orm.id,
      reference: orm.reference,
      productId: orm.productId,
      quantity: orm.quantity,
      amountInCents: orm.amountInCents,
      currency: orm.currency,
      customerEmail: orm.customerEmail,
      status: orm.status,
      pspTransactionId: orm.pspTransactionId ?? undefined,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Transaction): TransactionOrmEntity {
    const orm = new TransactionOrmEntity();
    orm.id = domain.id;
    orm.reference = domain.reference;
    orm.productId = domain.productId;
    orm.quantity = domain.quantity;
    orm.amountInCents = domain.amountInCents;
    orm.currency = domain.currency;
    orm.customerEmail = domain.customerEmail;
    orm.status = domain.status;
    orm.pspTransactionId = domain.pspTransactionId ?? null;
    return orm;
  }
}
