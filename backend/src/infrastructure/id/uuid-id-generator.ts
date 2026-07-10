import { randomUUID } from 'crypto';
import { IdGenerator } from '../../domain/ports/id-generator.port';

export class UuidIdGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
