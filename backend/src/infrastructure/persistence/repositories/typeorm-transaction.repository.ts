import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../../../domain/entities/transaction.entity';
import { TransactionRepository } from '../../../domain/ports/transaction.repository.port';
import { TransactionOrmEntity } from '../entities/transaction.orm-entity';
import { TransactionMapper } from '../mappers/transaction.mapper';

export class TypeOrmTransactionRepository implements TransactionRepository {
  constructor(
    @InjectRepository(TransactionOrmEntity)
    private readonly repo: Repository<TransactionOrmEntity>,
  ) {}

  async findById(id: string): Promise<Transaction | null> {
    const orm = await this.repo.findOneBy({ id });
    return orm ? TransactionMapper.toDomain(orm) : null;
  }

  async findByReference(reference: string): Promise<Transaction | null> {
    const orm = await this.repo.findOneBy({ reference });
    return orm ? TransactionMapper.toDomain(orm) : null;
  }

  async save(transaction: Transaction): Promise<void> {
    const orm = TransactionMapper.toOrm(transaction);
    await this.repo.save(orm);
  }
}
