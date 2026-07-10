import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { LIST_PRODUCTS_USE_CASE } from '../tokens/use-case.tokens';
import { Product } from '../../../domain/entities/product.entity';

describe('ProductsController', () => {
  let controller: ProductsController;
  let listProductsMock: { execute: jest.Mock };

  beforeEach(async () => {
    listProductsMock = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: LIST_PRODUCTS_USE_CASE, useValue: listProductsMock },
      ],
    }).compile();

    controller = module.get(ProductsController);
  });

  describe('findAll()', () => {
    it('returns mapped product list', async () => {
      const product = new Product(
        'prod-1',
        'Laptop',
        'Desc',
        'https://img.example.com/l.jpg',
        199900,
        'COP',
        5,
      );
      listProductsMock.execute.mockResolvedValue([product]);

      const result = await controller.findAll();

      expect(result).toEqual([
        {
          id: 'prod-1',
          name: 'Laptop',
          description: 'Desc',
          imageUrl: 'https://img.example.com/l.jpg',
          priceInCents: 199900,
          currency: 'COP',
          stock: 5,
        },
      ]);
    });

    it('returns empty array when no products', async () => {
      listProductsMock.execute.mockResolvedValue([]);
      const result = await controller.findAll();
      expect(result).toEqual([]);
    });
  });
});
