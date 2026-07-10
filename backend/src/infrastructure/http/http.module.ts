import { Module } from '@nestjs/common';
import {
  ID_GENERATOR,
  IdGenerator,
} from '../../domain/ports/id-generator.port';
import {
  PAYMENT_GATEWAY,
  PaymentGateway,
} from '../../domain/ports/payment-gateway.port';
import {
  PAYMENT_UNIT_OF_WORK,
  PaymentUnitOfWork,
} from '../../domain/ports/payment-unit-of-work.port';
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from '../../domain/ports/product.repository.port';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '../../domain/ports/transaction.repository.port';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { CreateTransactionUseCase } from '../../application/use-cases/create-transaction.use-case';
import { ProcessPaymentUseCase } from '../../application/use-cases/process-payment.use-case';
import { GetTransactionStatusUseCase } from '../../application/use-cases/get-transaction-status.use-case';
import { UuidIdGenerator } from '../id/uuid-id-generator';
import { PersistenceModule } from '../persistence/persistence.module';
import { PspModule } from '../psp/psp.module';
import { ProductsController } from './controllers/products.controller';
import { TransactionsController } from './controllers/transactions.controller';
import { HealthController } from './controllers/health.controller';
import {
  CREATE_TRANSACTION_USE_CASE,
  GET_TRANSACTION_STATUS_USE_CASE,
  LIST_PRODUCTS_USE_CASE,
  PROCESS_PAYMENT_USE_CASE,
} from './tokens/use-case.tokens';

@Module({
  imports: [PersistenceModule, PspModule],
  controllers: [HealthController, ProductsController, TransactionsController],
  providers: [
    { provide: ID_GENERATOR, useClass: UuidIdGenerator },
    {
      provide: LIST_PRODUCTS_USE_CASE,
      useFactory: (repo: ProductRepository) => new ListProductsUseCase(repo),
      inject: [PRODUCT_REPOSITORY],
    },
    {
      provide: CREATE_TRANSACTION_USE_CASE,
      useFactory: (
        productRepo: ProductRepository,
        txnRepo: TransactionRepository,
        idGen: IdGenerator,
      ) => new CreateTransactionUseCase(productRepo, txnRepo, idGen),
      inject: [PRODUCT_REPOSITORY, TRANSACTION_REPOSITORY, ID_GENERATOR],
    },
    {
      provide: PROCESS_PAYMENT_USE_CASE,
      useFactory: (
        txnRepo: TransactionRepository,
        productRepo: ProductRepository,
        unitOfWork: PaymentUnitOfWork,
        gateway: PaymentGateway,
        idGen: IdGenerator,
      ) =>
        new ProcessPaymentUseCase(
          txnRepo,
          productRepo,
          unitOfWork,
          gateway,
          idGen,
        ),
      inject: [
        TRANSACTION_REPOSITORY,
        PRODUCT_REPOSITORY,
        PAYMENT_UNIT_OF_WORK,
        PAYMENT_GATEWAY,
        ID_GENERATOR,
      ],
    },
    {
      provide: GET_TRANSACTION_STATUS_USE_CASE,
      useFactory: (txnRepo: TransactionRepository) =>
        new GetTransactionStatusUseCase(txnRepo),
      inject: [TRANSACTION_REPOSITORY],
    },
  ],
})
export class HttpModule {}
