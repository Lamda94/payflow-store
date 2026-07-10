import { Delivery } from '../../../domain/entities/delivery.entity';
import { DeliveryOrmEntity } from '../entities/delivery.orm-entity';
import { DeliveryMapper } from './delivery.mapper';

describe('DeliveryMapper', () => {
  it('maps domain to ORM correctly', () => {
    const delivery = Delivery.create({
      id: 'd-1',
      transactionId: 'txn-1',
      productId: 'p-1',
      customerEmail: 'user@test.com',
      quantity: 2,
      createdAt: new Date('2026-01-01'),
    });

    const orm = DeliveryMapper.toOrm(delivery);
    expect(orm).toBeInstanceOf(DeliveryOrmEntity);
    expect(orm.id).toBe('d-1');
    expect(orm.transactionId).toBe('txn-1');
    expect(orm.quantity).toBe(2);
  });
});
