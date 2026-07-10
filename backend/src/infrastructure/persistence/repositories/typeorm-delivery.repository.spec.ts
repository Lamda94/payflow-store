import { TypeOrmDeliveryRepository } from './typeorm-delivery.repository';
import { Delivery } from '../../../domain/entities/delivery.entity';

const makeRepo = () =>
  new TypeOrmDeliveryRepository({ save: jest.fn().mockResolvedValue(undefined) } as never);

describe('TypeOrmDeliveryRepository', () => {
  it('calls repo.save with mapped ORM entity', async () => {
    const repo = makeRepo();
    const delivery = Delivery.create({
      id: 'd-1', transactionId: 'txn-1', productId: 'p-1',
      customerEmail: 'user@test.com', quantity: 1, createdAt: new Date(),
    });
    await repo.save(delivery);
  });
});
