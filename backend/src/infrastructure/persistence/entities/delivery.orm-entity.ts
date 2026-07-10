import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('deliveries')
export class DeliveryOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'transaction_id', type: 'uuid' })
  transactionId: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'customer_email', length: 255 })
  customerEmail: string;

  @Column({ type: 'int' })
  quantity: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
