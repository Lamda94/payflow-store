import { ListProductsUseCase } from './list-products.use-case';
import { ProductRepository } from '../../domain/ports/product.repository.port';
import { Product } from '../../domain/entities/product.entity';

const makeProduct = (id: string, stock: number) =>
  new Product(id, 'Product', 'Desc', 'http://img.url', 100000, 'COP', stock);

const makeRepo = (products: Product[]): ProductRepository => ({
  findById: jest.fn(),
  findAllAvailable: jest.fn().mockResolvedValue(products),
  save: jest.fn(),
});

describe('ListProductsUseCase', () => {
  it('returns all available products', async () => {
    const products = [makeProduct('p-1', 5), makeProduct('p-2', 3)];
    const useCase = new ListProductsUseCase(makeRepo(products));
    const result = await useCase.execute();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('p-1');
  });

  it('returns empty array when no products available', async () => {
    const useCase = new ListProductsUseCase(makeRepo([]));
    const result = await useCase.execute();
    expect(result).toHaveLength(0);
  });
});
