import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductOrmEntity } from './entities/product.orm-entity';
import { TransactionOrmEntity } from './entities/transaction.orm-entity';
import { DeliveryOrmEntity } from './entities/delivery.orm-entity';
import { TypeOrmProductRepository } from './repositories/typeorm-product.repository';
import { TypeOrmTransactionRepository } from './repositories/typeorm-transaction.repository';
import { TypeOrmPaymentUnitOfWork } from './repositories/typeorm-payment.unit-of-work';
import { PRODUCT_REPOSITORY } from '../../domain/ports/product.repository.port';
import { TRANSACTION_REPOSITORY } from '../../domain/ports/transaction.repository.port';
import { PAYMENT_UNIT_OF_WORK } from '../../domain/ports/payment-unit-of-work.port';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductOrmEntity,
      TransactionOrmEntity,
      DeliveryOrmEntity,
    ]),
  ],
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: TypeOrmProductRepository },
    { provide: TRANSACTION_REPOSITORY, useClass: TypeOrmTransactionRepository },
    { provide: PAYMENT_UNIT_OF_WORK, useClass: TypeOrmPaymentUnitOfWork },
  ],
  exports: [PRODUCT_REPOSITORY, TRANSACTION_REPOSITORY, PAYMENT_UNIT_OF_WORK],
})
export class PersistenceModule {}
