import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductOrmEntity } from './entities/product.orm-entity';
import { TransactionOrmEntity } from './entities/transaction.orm-entity';
import { DeliveryOrmEntity } from './entities/delivery.orm-entity';
import { TypeOrmProductRepository } from './repositories/typeorm-product.repository';
import { TypeOrmTransactionRepository } from './repositories/typeorm-transaction.repository';
import { TypeOrmDeliveryRepository } from './repositories/typeorm-delivery.repository';
import { PRODUCT_REPOSITORY } from '../../domain/ports/product.repository.port';
import { TRANSACTION_REPOSITORY } from '../../domain/ports/transaction.repository.port';
import { DELIVERY_REPOSITORY } from '../../domain/ports/delivery.repository.port';

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
    { provide: DELIVERY_REPOSITORY, useClass: TypeOrmDeliveryRepository },
  ],
  exports: [PRODUCT_REPOSITORY, TRANSACTION_REPOSITORY, DELIVERY_REPOSITORY],
})
export class PersistenceModule {}
