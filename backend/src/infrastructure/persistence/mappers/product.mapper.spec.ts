import { Product } from '../../../domain/entities/product.entity';
import { ProductOrmEntity } from '../entities/product.orm-entity';
import { ProductMapper } from './product.mapper';

const makeOrm = (): ProductOrmEntity => {
  const orm = new ProductOrmEntity();
  orm.id = 'p-1';
  orm.name = 'Test Product';
  orm.description = 'Description';
  orm.imageUrl = 'http://img.url';
  orm.priceInCents = 100000;
  orm.currency = 'COP';
  orm.stock = 10;
  return orm;
};

describe('ProductMapper', () => {
  it('maps ORM to domain correctly', () => {
    const domain = ProductMapper.toDomain(makeOrm());
    expect(domain).toBeInstanceOf(Product);
    expect(domain.id).toBe('p-1');
    expect(domain.stock).toBe(10);
    expect(domain.priceInCents).toBe(100000);
  });

  it('maps domain to ORM correctly', () => {
    const domain = new Product('p-1', 'Test', 'Desc', 'http://img.url', 100000, 'COP', 5);
    const orm = ProductMapper.toOrm(domain);
    expect(orm).toBeInstanceOf(ProductOrmEntity);
    expect(orm.id).toBe('p-1');
    expect(orm.stock).toBe(5);
  });

  it('round-trips domain → orm → domain', () => {
    const original = new Product('p-1', 'Test', 'Desc', 'http://img.url', 100000, 'COP', 5);
    const restored = ProductMapper.toDomain(ProductMapper.toOrm(original));
    expect(restored.id).toBe(original.id);
    expect(restored.stock).toBe(original.stock);
    expect(restored.priceInCents).toBe(original.priceInCents);
  });
});
