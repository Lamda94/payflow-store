import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ProductOrmEntity } from './entities/product.orm-entity';
import { TransactionOrmEntity } from './entities/transaction.orm-entity';
import { DeliveryOrmEntity } from './entities/delivery.orm-entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  entities: [ProductOrmEntity, TransactionOrmEntity, DeliveryOrmEntity],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
