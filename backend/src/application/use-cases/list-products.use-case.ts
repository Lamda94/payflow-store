import { Product } from '../../domain/entities/product.entity';
import { ProductRepository } from '../../domain/ports/product.repository.port';

export class ListProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(): Promise<Product[]> {
    return this.productRepository.findAllAvailable();
  }
}
