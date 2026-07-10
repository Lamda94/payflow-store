import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ProductOrmEntity } from '../persistence/entities/product.orm-entity';
import { TransactionOrmEntity } from '../persistence/entities/transaction.orm-entity';
import { DeliveryOrmEntity } from '../persistence/entities/delivery.orm-entity';

export function getDatabaseConfig(): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    entities: [ProductOrmEntity, TransactionOrmEntity, DeliveryOrmEntity],
    migrations: [__dirname + '/../persistence/migrations/*{.ts,.js}'],
    synchronize: false,
    migrationsRun: false,
    logging: process.env.NODE_ENV === 'development',
  };
}
