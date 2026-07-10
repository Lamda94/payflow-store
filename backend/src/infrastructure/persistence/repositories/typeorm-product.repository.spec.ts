import { TypeOrmProductRepository } from './typeorm-product.repository';
import { ProductOrmEntity } from '../entities/product.orm-entity';
import { Product } from '../../../domain/entities/product.entity';

const makeOrmEntity = (): ProductOrmEntity => {
  const e = new ProductOrmEntity();
  e.id = 'p-1';
  e.name = 'Test';
  e.description = 'Desc';
  e.imageUrl = 'http://img';
  e.priceInCents = 100000;
  e.currency = 'COP';
  e.stock = 5;
  return e;
};

const makeRepo = (overrides = {}) => {
  const mockTypeOrmRepo = {
    findOneBy: jest.fn(),
    createQueryBuilder: jest.fn(),
    save: jest.fn(),
    ...overrides,
  };
  return new TypeOrmProductRepository(mockTypeOrmRepo as never);
};

describe('TypeOrmProductRepository', () => {
  describe('findById()', () => {
    it('returns domain product when found', async () => {
      const repo = makeRepo({
        findOneBy: jest.fn().mockResolvedValue(makeOrmEntity()),
      });
      const result = await repo.findById('p-1');
      expect(result).toBeInstanceOf(Product);
      expect(result?.id).toBe('p-1');
    });

    it('returns null when not found', async () => {
      const repo = makeRepo({ findOneBy: jest.fn().mockResolvedValue(null) });
      expect(await repo.findById('p-999')).toBeNull();
    });
  });

  describe('findAllAvailable()', () => {
    it('returns mapped domain products', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([makeOrmEntity(), makeOrmEntity()]),
      };
      const repo = makeRepo({
        createQueryBuilder: jest.fn().mockReturnValue(qb),
      });
      const result = await repo.findAllAvailable();
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Product);
    });

    it('returns empty array when no products available', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      const repo = makeRepo({
        createQueryBuilder: jest.fn().mockReturnValue(qb),
      });
      expect(await repo.findAllAvailable()).toHaveLength(0);
    });
  });

  describe('save()', () => {
    it('calls repo.save with mapped ORM entity', async () => {
      const saveFn = jest.fn().mockResolvedValue(undefined);
      const repo = makeRepo({ save: saveFn });
      const product = new Product(
        'p-1',
        'Test',
        'Desc',
        'http://img',
        100000,
        'COP',
        5,
      );
      await repo.save(product);
      expect(saveFn).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'p-1' }),
      );
    });
  });
});
