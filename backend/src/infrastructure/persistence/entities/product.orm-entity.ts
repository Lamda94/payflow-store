import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('products')
export class ProductOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'image_url', length: 500 })
  imageUrl: string;

  @Column({ name: 'price_in_cents', type: 'int' })
  priceInCents: number;

  @Column({ length: 10 })
  currency: string;

  @Column({ type: 'int' })
  stock: number;
}
