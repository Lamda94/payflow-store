import { Delivery } from '../../../domain/entities/delivery.entity';
import { DeliveryOrmEntity } from '../entities/delivery.orm-entity';

export class DeliveryMapper {
  static toOrm(domain: Delivery): DeliveryOrmEntity {
    const orm = new DeliveryOrmEntity();
    orm.id = domain.id;
    orm.transactionId = domain.transactionId;
    orm.productId = domain.productId;
    orm.customerEmail = domain.customerEmail;
    orm.quantity = domain.quantity;
    return orm;
  }
}
