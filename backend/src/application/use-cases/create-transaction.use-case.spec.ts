import { CreateTransactionUseCase } from './create-transaction.use-case';
import { Product } from '../../domain/entities/product.entity';
import { ProductRepository } from '../../domain/ports/product.repository.port';
import { TransactionRepository } from '../../domain/ports/transaction.repository.port';
import { IdGenerator } from '../../domain/ports/id-generator.port';
import { ProductNotFoundError, InsufficientStockError } from '../../domain/errors/domain.errors';

const makeProduct = (stock: number) =>
  new Product('p-1', 'Product', 'Desc', 'http://img.url', 100000, 'COP', stock);

const makeProductRepo = (product: Product | null): ProductRepository => ({
  findById: jest.fn().mockResolvedValue(product),
  findAllAvailable: jest.fn(),
  save: jest.fn(),
});

const makeTransactionRepo = (): TransactionRepository => ({
  findById: jest.fn(),
  findByReference: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
});

const makeIdGenerator = (): IdGenerator => ({
  generate: jest
    .fn()
    .mockReturnValueOnce('txn-id-1')
    .mockReturnValueOnce('ref-001'),
});

describe('CreateTransactionUseCase', () => {
  it('creates a pending transaction and returns its data', async () => {
    const useCase = new CreateTransactionUseCase(
      makeProductRepo(makeProduct(10)),
      makeTransactionRepo(),
      makeIdGenerator(),
    );

    const result = await useCase.execute({
      productId: 'p-1',
      quantity: 2,
      customerEmail: 'user@test.com',
    });

    expect(result.transactionId).toBe('txn-id-1');
    expect(result.reference).toBe('ref-001');
    expect(result.amountInCents).toBe(200000);
    expect(result.currency).toBe('COP');
  });

  it('saves the transaction to the repository', async () => {
    const transactionRepo = makeTransactionRepo();
    const useCase = new CreateTransactionUseCase(
      makeProductRepo(makeProduct(10)),
      transactionRepo,
      makeIdGenerator(),
    );

    await useCase.execute({ productId: 'p-1', quantity: 1, customerEmail: 'user@test.com' });

    expect(transactionRepo.save).toHaveBeenCalledTimes(1);
  });

  it('throws ProductNotFoundError when product does not exist', async () => {
    const useCase = new CreateTransactionUseCase(
      makeProductRepo(null),
      makeTransactionRepo(),
      makeIdGenerator(),
    );

    await expect(
      useCase.execute({ productId: 'p-999', quantity: 1, customerEmail: 'user@test.com' }),
    ).rejects.toThrow(ProductNotFoundError);
  });

  it('throws InsufficientStockError when stock is too low', async () => {
    const useCase = new CreateTransactionUseCase(
      makeProductRepo(makeProduct(1)),
      makeTransactionRepo(),
      makeIdGenerator(),
    );

    await expect(
      useCase.execute({ productId: 'p-1', quantity: 5, customerEmail: 'user@test.com' }),
    ).rejects.toThrow(InsufficientStockError);
  });

  it('does not save transaction when product is not found', async () => {
    const transactionRepo = makeTransactionRepo();
    const useCase = new CreateTransactionUseCase(
      makeProductRepo(null),
      transactionRepo,
      makeIdGenerator(),
    );

    await useCase.execute({ productId: 'p-999', quantity: 1, customerEmail: 'user@test.com' }).catch(() => {});

    expect(transactionRepo.save).not.toHaveBeenCalled();
  });
});
