import { Product } from '../../../domain/entities/product.entity';
import { ProductOrmEntity } from '../entities/product.orm-entity';

export class ProductMapper {
  static toDomain(orm: ProductOrmEntity): Product {
    return new Product(
      orm.id,
      orm.name,
      orm.description,
      orm.imageUrl,
      orm.priceInCents,
      orm.currency,
      orm.stock,
    );
  }

  static toOrm(domain: Product): ProductOrmEntity {
    const orm = new ProductOrmEntity();
    orm.id = domain.id;
    orm.name = domain.name;
    orm.description = domain.description;
    orm.imageUrl = domain.imageUrl;
    orm.priceInCents = domain.priceInCents;
    orm.currency = domain.currency;
    orm.stock = domain.stock;
    return orm;
  }
}
