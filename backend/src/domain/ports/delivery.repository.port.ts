import { Delivery } from '../entities/delivery.entity';

export interface DeliveryRepository {
  save(delivery: Delivery): Promise<void>;
}

export const DELIVERY_REPOSITORY = Symbol('DeliveryRepository');
