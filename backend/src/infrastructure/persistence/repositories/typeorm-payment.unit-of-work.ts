import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Transaction } from '../../../domain/entities/transaction.entity';
import { Delivery } from '../../../domain/entities/delivery.entity';
import { PaymentUnitOfWork } from '../../../domain/ports/payment-unit-of-work.port';
import { InsufficientStockError } from '../../../domain/errors/domain.errors';
import { ProductOrmEntity } from '../entities/product.orm-entity';
import { TransactionMapper } from '../mappers/transaction.mapper';
import { DeliveryMapper } from '../mappers/delivery.mapper';

export class TypeOrmPaymentUnitOfWork implements PaymentUnitOfWork {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async saveApprovedPayment(
    transaction: Transaction,
    delivery: Delivery,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // Guarded decrement: the WHERE clause makes the stock check and the
      // decrement a single atomic statement, so concurrent payments cannot
      // oversell or drive stock negative.
      const result = await manager
        .createQueryBuilder()
        .update(ProductOrmEntity)
        .set({ stock: () => 'stock - :qty' })
        .where('id = :productId AND stock >= :qty', {
          productId: transaction.productId,
          qty: transaction.quantity,
        })
        .execute();

      if (result.affected !== 1) {
        const product = await manager.findOneBy(ProductOrmEntity, {
          id: transaction.productId,
        });
        throw new InsufficientStockError(
          product?.stock ?? 0,
          transaction.quantity,
        );
      }

      await manager.save(TransactionMapper.toOrm(transaction));
      await manager.save(DeliveryMapper.toOrm(delivery));
    });
  }
}
