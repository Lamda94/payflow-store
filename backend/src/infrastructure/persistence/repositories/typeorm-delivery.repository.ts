import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from '../../../domain/entities/delivery.entity';
import { DeliveryRepository } from '../../../domain/ports/delivery.repository.port';
import { DeliveryOrmEntity } from '../entities/delivery.orm-entity';
import { DeliveryMapper } from '../mappers/delivery.mapper';

export class TypeOrmDeliveryRepository implements DeliveryRepository {
  constructor(
    @InjectRepository(DeliveryOrmEntity)
    private readonly repo: Repository<DeliveryOrmEntity>,
  ) {}

  async save(delivery: Delivery): Promise<void> {
    const orm = DeliveryMapper.toOrm(delivery);
    await this.repo.save(orm);
  }
}
