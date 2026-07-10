import { Product } from '../entities/product.entity';

export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findAllAvailable(): Promise<Product[]>;
  save(product: Product): Promise<void>;
}

export const PRODUCT_REPOSITORY = Symbol('ProductRepository');
