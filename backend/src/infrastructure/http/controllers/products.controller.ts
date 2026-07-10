import { Controller, Get, Inject } from '@nestjs/common';
import { ListProductsUseCase } from '../../../application/use-cases/list-products.use-case';
import { LIST_PRODUCTS_USE_CASE } from '../tokens/use-case.tokens';

@Controller('products')
export class ProductsController {
  constructor(
    @Inject(LIST_PRODUCTS_USE_CASE)
    private readonly listProducts: ListProductsUseCase,
  ) {}

  @Get()
  async findAll() {
    const products = await this.listProducts.execute();
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      imageUrl: p.imageUrl,
      priceInCents: p.priceInCents,
      currency: p.currency,
      stock: p.stock,
    }));
  }
}
