import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { TransactionStatus } from '../../../domain/entities/transaction.entity';

@Entity('transactions')
export class TransactionOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  reference: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'amount_in_cents', type: 'int' })
  amountInCents: number;

  @Column({ length: 10 })
  currency: string;

  @Column({ name: 'customer_email', length: 255 })
  customerEmail: string;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Column({ name: 'psp_transaction_id', length: 100, nullable: true })
  pspTransactionId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
