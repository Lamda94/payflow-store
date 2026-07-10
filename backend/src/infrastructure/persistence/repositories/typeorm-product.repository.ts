import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../../domain/entities/product.entity';
import { ProductRepository } from '../../../domain/ports/product.repository.port';
import { ProductOrmEntity } from '../entities/product.orm-entity';
import { ProductMapper } from '../mappers/product.mapper';

export class TypeOrmProductRepository implements ProductRepository {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repo: Repository<ProductOrmEntity>,
  ) {}

  async findById(id: string): Promise<Product | null> {
    const orm = await this.repo.findOneBy({ id });
    return orm ? ProductMapper.toDomain(orm) : null;
  }

  async findAllAvailable(): Promise<Product[]> {
    const orms = await this.repo
      .createQueryBuilder('p')
      .where('p.stock > 0')
      .orderBy('p.name', 'ASC')
      .getMany();
    return orms.map(ProductMapper.toDomain);
  }

  async save(product: Product): Promise<void> {
    const orm = ProductMapper.toOrm(product);
    await this.repo.save(orm);
  }
}
